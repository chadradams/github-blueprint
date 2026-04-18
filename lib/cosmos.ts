import { CosmosClient, Container } from '@azure/cosmos';
import { DefaultAzureCredential } from '@azure/identity';
import { StoredBlueprint } from './types';

const DB_NAME        = 'copilot-blueprint';
const CONTAINER_NAME = 'blueprints';

let _client: CosmosClient | null = null;

function isConfigured() {
  return !!process.env.COSMOS_ENDPOINT;
}

function getContainer(): Container {
  if (!isConfigured()) throw new Error('Cosmos DB not configured');
  if (!_client) {
    const endpoint = process.env.COSMOS_ENDPOINT!;
    const key      = process.env.COSMOS_KEY;
    // Production: authenticate via managed identity (no key needed).
    // Local dev: fall back to key from .env.local, or use `az login` via DefaultAzureCredential.
    _client = key
      ? new CosmosClient({ endpoint, key })
      : new CosmosClient({ endpoint, aadCredentials: new DefaultAzureCredential() });
  }
  return _client.database(DB_NAME).container(CONTAINER_NAME);
}

// ── Blueprint CRUD ────────────────────────────────────────────────────────────

export async function listBlueprints(login: string, repoFullName?: string): Promise<StoredBlueprint[]> {
  if (!isConfigured()) return [];
  try {
    const c = getContainer();
    const query = repoFullName
      ? { query: 'SELECT * FROM c WHERE c.createdBy = @login AND c.repoFullName = @repo ORDER BY c.updatedAt DESC',
          parameters: [{ name: '@login', value: login }, { name: '@repo', value: repoFullName }] }
      : { query: 'SELECT * FROM c WHERE c.createdBy = @login ORDER BY c.updatedAt DESC OFFSET 0 LIMIT 50',
          parameters: [{ name: '@login', value: login }] };

    const { resources } = await c.items.query<StoredBlueprint>(query).fetchAll();
    return resources;
  } catch {
    return [];
  }
}

export async function getBlueprint(id: string, repoFullName: string): Promise<StoredBlueprint | null> {
  if (!isConfigured()) return null;
  try {
    const { resource } = await getContainer().item(id, repoFullName).read<StoredBlueprint>();
    return resource ?? null;
  } catch {
    return null;
  }
}

export async function createBlueprint(data: Omit<StoredBlueprint, 'id' | 'createdAt' | 'updatedAt'>): Promise<StoredBlueprint> {
  const now  = new Date().toISOString();
  const item: StoredBlueprint = {
    ...data,
    id:        crypto.randomUUID(),
    // Partition key defaults to the login when there's no repo context
    repoFullName: data.repoFullName ?? `user:${data.createdBy}`,
    createdAt: now,
    updatedAt: now,
  };
  const { resource } = await getContainer().items.create(item);
  if (!resource) throw new Error('Cosmos DB create returned no resource');
  return resource;
}

export async function updateBlueprint(
  id: string,
  repoFullName: string,
  patch: Partial<Pick<StoredBlueprint, 'title' | 'output' | 'messages'>>,
): Promise<StoredBlueprint | null> {
  if (!isConfigured()) return null;
  try {
    const existing = await getBlueprint(id, repoFullName);
    if (!existing) return null;
    const updated = { ...existing, ...patch, updatedAt: new Date().toISOString() };
    const { resource } = await getContainer().item(id, repoFullName).replace(updated);
    return resource ?? null;
  } catch {
    return null;
  }
}

export async function deleteBlueprint(id: string, repoFullName: string): Promise<void> {
  if (!isConfigured()) return;
  await getContainer().item(id, repoFullName).delete();
}
