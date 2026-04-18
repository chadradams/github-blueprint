import { NextRequest, NextResponse } from 'next/server';
import { AzureOpenAI } from 'openai';
import { DefaultAzureCredential, getBearerTokenProvider } from '@azure/identity';
import { buildSystemPrompt } from '@/lib/prompts';
import { BlueprintType, ChatPhase, GitHubContext, ARTIFACT_MARKER } from '@/lib/types';

export const runtime    = 'nodejs';
export const maxDuration = 60;

interface RequestBody {
  messages:        { role: 'user' | 'assistant'; content: string }[];
  type:            BlueprintType;
  currentArtifact?: string;
  githubContext?:  GitHubContext;
}

function detectPhase(messages: RequestBody['messages'], currentArtifact?: string): ChatPhase {
  if (currentArtifact) return 'refine';
  const userCount = messages.filter((m) => m.role === 'user').length;
  return userCount <= 1 ? 'clarify' : 'generate';
}

export async function POST(request: NextRequest) {
  const body = await request.json() as RequestBody;
  const { messages, type, currentArtifact, githubContext } = body;

  if (!messages?.length) {
    return NextResponse.json({ error: 'messages array is required' }, { status: 400 });
  }

  const endpoint   = process.env.AZURE_OPENAI_ENDPOINT;
  const apiKey     = process.env.AZURE_OPENAI_KEY; // optional — only needed for local dev without az login
  const deployment = process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4o';
  const apiVersion = process.env.AZURE_OPENAI_API_VERSION || '2024-02-01';

  if (!endpoint) {
    return NextResponse.json(
      { error: 'AZURE_OPENAI_ENDPOINT is not configured.' },
      { status: 500 },
    );
  }

  const phase        = detectPhase(messages, currentArtifact);
  const systemPrompt = buildSystemPrompt(type, phase, currentArtifact, githubContext);

  // Production: managed identity via Cognitive Services OpenAI User role (no key).
  // Local dev: use API key from .env.local, or DefaultAzureCredential via `az login`.
  const client = apiKey
    ? new AzureOpenAI({ endpoint, apiKey, deployment, apiVersion })
    : new AzureOpenAI({
        endpoint,
        azureADTokenProvider: getBearerTokenProvider(
          new DefaultAzureCredential(),
          'https://cognitiveservices.azure.com/.default',
        ),
        deployment,
        apiVersion,
      });

  const stream = await client.chat.completions.create({
    model:      deployment,
    messages:   [{ role: 'system', content: systemPrompt }, ...messages],
    stream:     true,
    max_tokens: phase === 'clarify' ? 512 : 4096,
    temperature: phase === 'clarify' ? 0.5 : 0.7,
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          const text = chunk.choices[0]?.delta?.content ?? '';
          if (text) controller.enqueue(encoder.encode(text));
        }
      } finally {
        controller.close();
      }
    },
    cancel() { stream.controller.abort(); },
  });

  return new Response(readable, {
    headers: {
      'Content-Type':       'text/plain; charset=utf-8',
      'Cache-Control':      'no-cache',
      'X-Accel-Buffering':  'no',
      'X-Blueprint-Phase':  phase,
      'X-Blueprint-Marker': ARTIFACT_MARKER,
    },
  });
}
