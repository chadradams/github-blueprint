const GH_API = 'https://api.github.com';

async function ghFetch<T>(path: string, token: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${GH_API}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      ...options?.headers,
    },
    next: { revalidate: 60 },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`GitHub ${res.status}: ${body}`);
  }
  return res.json() as Promise<T>;
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export async function exchangeCodeForToken(code: string): Promise<string> {
  const res = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id:     process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
    }),
  });
  const data = await res.json() as { access_token?: string; error?: string };
  if (!data.access_token) throw new Error(data.error ?? 'OAuth exchange failed');
  return data.access_token;
}

export async function getAuthenticatedUser(token: string) {
  return ghFetch<{ login: string; avatar_url: string; name: string }>(
    '/user', token,
  );
}

// ── Repos ─────────────────────────────────────────────────────────────────────

export async function listRepos(token: string) {
  return ghFetch<Array<{
    full_name: string;
    name: string;
    description: string | null;
    default_branch: string;
    language: string | null;
    private: boolean;
  }>>('/user/repos?sort=updated&per_page=50&type=all', token);
}

// ── Repo context ──────────────────────────────────────────────────────────────

export async function getRepoTree(token: string, owner: string, repo: string, branch: string) {
  return ghFetch<{ tree: Array<{ path: string; type: string; size?: number }> }>(
    `/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`, token,
  );
}

export async function getFileContent(token: string, owner: string, repo: string, path: string) {
  const data = await ghFetch<{ content: string; encoding: string }>(
    `/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}`, token,
  );
  if (data.encoding === 'base64') {
    return Buffer.from(data.content.replace(/\n/g, ''), 'base64').toString('utf-8');
  }
  return data.content;
}

export async function buildRepoContextText(
  token: string,
  owner: string,
  repo: string,
  branch: string,
): Promise<string> {
  const [treeData, repoMeta] = await Promise.all([
    getRepoTree(token, owner, repo, branch),
    ghFetch<{ description: string | null; language: string | null }>(
      `/repos/${owner}/${repo}`, token,
    ),
  ]);

  // Build a readable file tree (skip binary / generated paths)
  const SKIP = /\.(png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot|map|lock)$|node_modules|\.next|dist|build|\.git/;
  const files = treeData.tree
    .filter((n) => n.type === 'blob' && !SKIP.test(n.path ?? ''))
    .map((n) => n.path)
    .slice(0, 120); // cap for prompt length

  // Fetch README (best-effort)
  let readme = '';
  const readmePath = treeData.tree.find((n) =>
    /^readme\.md$/i.test(n.path ?? ''),
  )?.path;
  if (readmePath) {
    try {
      const raw = await getFileContent(token, owner, repo, readmePath);
      readme = raw.slice(0, 800).replace(/\n{3,}/g, '\n\n');
    } catch { /* non-fatal */ }
  }

  // Fetch package.json / go.mod / requirements.txt for tech-stack hints
  let techHint = '';
  const techFiles = ['package.json', 'go.mod', 'requirements.txt', 'Cargo.toml', 'pom.xml'];
  for (const tf of techFiles) {
    if (treeData.tree.some((n) => n.path === tf)) {
      try {
        const raw = await getFileContent(token, owner, repo, tf);
        techHint = `\n\n${tf}:\n${raw.slice(0, 600)}`;
        break;
      } catch { /* non-fatal */ }
    }
  }

  return [
    `Repository: ${owner}/${repo} (branch: ${branch})`,
    repoMeta.description ? `Description: ${repoMeta.description}` : '',
    repoMeta.language ? `Primary language: ${repoMeta.language}` : '',
    readme ? `\nREADME (excerpt):\n${readme}` : '',
    `\nFile tree (${files.length} files):\n${files.map((f) => `  ${f}`).join('\n')}`,
    techHint,
  ]
    .filter(Boolean)
    .join('\n');
}

// ── Issues & PRs ──────────────────────────────────────────────────────────────

export async function buildIssueContextText(
  token: string,
  owner: string,
  repo: string,
  number: number,
  type: 'issue' | 'pr',
): Promise<string> {
  if (type === 'pr') {
    const [pr, files] = await Promise.all([
      ghFetch<{ title: string; body: string | null; state: string; user: { login: string } }>(
        `/repos/${owner}/${repo}/pulls/${number}`, token,
      ),
      ghFetch<Array<{ filename: string; status: string; additions: number; deletions: number }>>(
        `/repos/${owner}/${repo}/pulls/${number}/files?per_page=50`, token,
      ),
    ]);
    const fileList = files.map((f) => `  ${f.status.padEnd(8)} ${f.filename}`).join('\n');
    return [
      `Pull Request #${number}: ${pr.title}`,
      `State: ${pr.state}  Author: ${pr.user.login}`,
      pr.body ? `\nDescription:\n${pr.body.slice(0, 800)}` : '',
      `\nChanged files (${files.length}):\n${fileList}`,
    ]
      .filter(Boolean)
      .join('\n');
  }

  const [issue, comments] = await Promise.all([
    ghFetch<{ title: string; body: string | null; state: string; user: { login: string }; labels: Array<{ name: string }> }>(
      `/repos/${owner}/${repo}/issues/${number}`, token,
    ),
    ghFetch<Array<{ user: { login: string }; body: string }>>(
      `/repos/${owner}/${repo}/issues/${number}/comments?per_page=10`, token,
    ),
  ]);

  const labelList = issue.labels.map((l) => l.name).join(', ');
  const commentText = comments
    .slice(0, 5)
    .map((c) => `  ${c.user.login}: ${c.body.slice(0, 200)}`)
    .join('\n');

  return [
    `Issue #${number}: ${issue.title}`,
    `State: ${issue.state}  Author: ${issue.user.login}`,
    labelList ? `Labels: ${labelList}` : '',
    issue.body ? `\nDescription:\n${issue.body.slice(0, 800)}` : '',
    commentText ? `\nKey comments:\n${commentText}` : '',
  ]
    .filter(Boolean)
    .join('\n');
}
