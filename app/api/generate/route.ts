import { NextRequest, NextResponse } from 'next/server';
import { AzureOpenAI } from 'openai';
import { buildSystemPrompt } from '@/lib/prompts';
import { BlueprintType, ChatPhase, ARTIFACT_MARKER } from '@/lib/types';

export const runtime = 'nodejs';
export const maxDuration = 60;

interface RequestBody {
  messages: { role: 'user' | 'assistant'; content: string }[];
  type: BlueprintType;
  currentArtifact?: string;
}

function detectPhase(messages: RequestBody['messages'], currentArtifact?: string): ChatPhase {
  if (currentArtifact) return 'refine';
  const userCount = messages.filter((m) => m.role === 'user').length;
  return userCount <= 1 ? 'clarify' : 'generate';
}

export async function POST(request: NextRequest) {
  const body = await request.json() as RequestBody;
  const { messages, type, currentArtifact } = body;

  if (!messages?.length) {
    return NextResponse.json({ error: 'messages array is required' }, { status: 400 });
  }

  const endpoint   = process.env.AZURE_OPENAI_ENDPOINT;
  const apiKey     = process.env.AZURE_OPENAI_KEY;
  const deployment = process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4o';
  const apiVersion = process.env.AZURE_OPENAI_API_VERSION || '2024-02-01';

  if (!endpoint || !apiKey) {
    return NextResponse.json(
      { error: 'Azure OpenAI credentials not configured. Set AZURE_OPENAI_ENDPOINT and AZURE_OPENAI_KEY in .env.local' },
      { status: 500 },
    );
  }

  const phase        = detectPhase(messages, currentArtifact);
  const systemPrompt = buildSystemPrompt(type, phase, currentArtifact);
  const client       = new AzureOpenAI({ endpoint, apiKey, deployment, apiVersion });

  const stream = await client.chat.completions.create({
    model: deployment,
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages,
    ],
    stream: true,
    // Clarifying questions are short; generation needs room for full artifacts.
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
    cancel() {
      stream.controller.abort();
    },
  });

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache',
      'X-Accel-Buffering': 'no',
      // Let the client know which phase was used so it can route the stream correctly.
      'X-Blueprint-Phase': phase,
      'X-Blueprint-Marker': ARTIFACT_MARKER,
    },
  });
}
