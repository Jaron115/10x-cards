# GitHub Actions Workflows

This directory contains CI/CD workflows for the 10x Cards project.

## pull-request.yml

Workflow that runs on:

- Every pull request to the `master` branch
- Every push to the `master` branch

### Jobs Flow

```
lint
├── unit-test (parallel)
└── e2e-test (parallel)
    └── status-comment (only if all pass)
```

### Job Details

#### 1. Lint (`lint`)

- Runs ESLint on the codebase
- Uses Node.js version from `.nvmrc` (22.14.0)
- Blocks subsequent jobs if linting fails
- **No environment or secrets required**

#### 2. Unit Tests (`unit-test`)

- Runs in parallel with E2E tests after linting passes
- Executes Vitest with coverage collection
- Uploads coverage artifacts for review
- **No environment or secrets required** (uses MSW for mocking)

#### 3. E2E Tests (`e2e-test`)

- Runs in parallel with unit tests after linting passes
- Uses the `integration` environment for secrets
- Installs only Chromium browser (as per playwright.config.ts)
- Executes Playwright E2E tests
- Uploads test reports and results (even on failure via `if: always()`)
- Uses secrets: `SUPABASE_URL`, `SUPABASE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `E2E_USERNAME_ID`, `E2E_USERNAME`, `E2E_PASSWORD`

#### 4. Status Comment (`status-comment`)

- Only runs if all previous jobs succeed
- Downloads unit test coverage artifacts
- Posts a success comment to the pull request
- Includes coverage information if available
- Uses `GITHUB_TOKEN` (automatically provided by GitHub) for posting comments

### Required Secrets

Configure these secrets in your GitHub repository settings under the `integration` environment:

**Supabase (required for e2e-test only):**

- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key for admin operations

**E2E Test User (required for e2e-test only):**

- `E2E_USERNAME_ID` - Test user ID for E2E tests
- `E2E_USERNAME` - Test username/email for E2E tests
- `E2E_PASSWORD` - Test user password for E2E tests

**Automatic Tokens:**

- `GITHUB_TOKEN` - Automatically provided by GitHub Actions (no configuration needed)

### Action Versions

All actions use the latest major versions (verified as of October 2025):

- `actions/checkout@v5` (latest: v5)
- `actions/setup-node@v6` (latest: v6)
- `actions/upload-artifact@v5` (latest: v5)
- `actions/download-artifact@v6` (latest: v6)
- `actions/github-script@v8` (latest: v8)

All actions are verified as **not archived/deprecated**.
