#!/usr/bin/env node
/**
 * GitHub utility to enforce a "Codecov project ≥ 80 %" branch protection rule.
 *
 * Usage (from package.json):
 *   "enforce:codecov": "node scripts/enforce-codecov.js"
 *
 * Requirements:
 *   1. Personal access token or GitHub App token with `repo` scope via env GITHUB_TOKEN.
 *   2. Repository name in `OWNER/REPO` format via env REPO_FULL_NAME (e.g. "lightspeedpay/lightspeedpay-integrated").
 *   3. Branch to protect via env PROTECTED_BRANCH (default "main").
 *
 * The script idempotently checks current branch protection settings and injects
 * a required status check for Codecov if missing or mis-configured.
 */

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { request } = require('node:https'); // Using built-in fetch via https.request

async function githubFetch(path, method = 'GET', body = undefined) {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error('Missing GITHUB_TOKEN env for GitHub API auth');

  const options = {
    hostname: 'api.github.com',
    port: 443,
    path,
    method,
    headers: {
      'User-Agent': 'lightspeedpay-codecov-enforcer',
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
    },
  };

  return new Promise((resolve, reject) => {
    const req = request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          resolve(data ? JSON.parse(data) : {});
        } else {
          reject(new Error(`GitHub API ${method} ${path} -> ${res.statusCode}: ${data}`));
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

(async () => {
  try {
    const repo = process.env.REPO_FULL_NAME;
    if (!repo) throw new Error('Missing REPO_FULL_NAME env (format OWNER/REPO)');
    const [owner, repoName] = repo.split('/');
    const branch = process.env.PROTECTED_BRANCH || 'main';

    // 1. Fetch current branch protection rules ------------------------
    const protectionPath = `/repos/${owner}/${repoName}/branches/${branch}/protection`;
    let protection;
    try {
      protection = await githubFetch(protectionPath);
    } catch (err) {
      console.error(`⚠️  Unable to read branch protection: ${err.message}`);
      console.error('Ensure the token has admin access to the repo.');
      process.exit(1);
    }

    // 2. Determine if Codecov status check already present -----------
    const statusChecks =
      protection?.required_status_checks?.checks?.map((c) => c.context) || [];
    const CODECOV_CONTEXT = 'codecov/project';

    if (statusChecks.includes(CODECOV_CONTEXT)) {
      console.log('✅ Codecov branch protection already enforced.');
      return;
    }

    // 3. Merge with existing checks and PATCH protection settings ----
    const updatedChecks = [...statusChecks, CODECOV_CONTEXT];

    await githubFetch(protectionPath, 'PATCH', {
      required_status_checks: {
        strict: false,
        checks: updatedChecks.map((context) => ({ context })),
      },
    });

    console.log('🎉 Codecov project ≥ 80 % status check enforced on branch:', branch);
  } catch (err) {
    console.error('❌ Failed to enforce Codecov protection:', err);
    process.exit(1);
  }
})(); 