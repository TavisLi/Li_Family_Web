# Admin and Family Accounts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restrict Payload CMS access to two administrator accounts while provisioning the approved family accounts for Family Mode without committing credentials.

**Architecture:** Keep `users` as the only auth collection. Add a non-localized `role` field plus pure admin predicates; collections and globals use them to restrict CMS management writes to administrators, while comments and bucket items retain Family Mode participation. A one-off provisioning CLI reads the user-owned account file at runtime, produces a redacted dry-run, and applies idempotent account changes only with `--apply`.

**Tech Stack:** Payload CMS 3.85.1, PostgreSQL migrations, TypeScript, Node `assert`, `tsx` CLI.

---

### Task 1: Define and test the administrator boundary

**Files:**
- Create: `src/payload/access/is-admin.ts`
- Create: `src/payload/access/is-admin.test.ts`
- Modify: `src/payload/collections/Users.ts`

- [ ] **Step 1: Write the failing access test**

```ts
import assert from 'node:assert/strict'

import { canAccessAdmin } from './is-admin'

assert.equal(canAccessAdmin({ user: { role: 'admin' } }), true)
assert.equal(canAccessAdmin({ user: { role: 'family' } }), false)
assert.equal(canAccessAdmin({ user: null }), false)
console.log('admin access tests passed')
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --import tsx src/payload/access/is-admin.test.ts`
Expected: failure because `./is-admin` does not exist.

- [ ] **Step 3: Add the minimal role predicate and wire the collection**

```ts
// src/payload/access/is-admin.ts
export type AdminAccessUser = { role?: string | null } | null | undefined

export function canAccessAdmin({ user }: { user: AdminAccessUser }): boolean {
  return user?.role === 'admin'
}
```

```ts
// src/payload/collections/Users.ts additions
import { canAccessAdmin } from '../access/is-admin'

access: {
  admin: ({ req }) => canAccessAdmin({ user: req.user }),
  // retain the existing read rule unchanged
},
fields: [
  {
    name: 'role',
    type: 'select',
    required: true,
    defaultValue: 'family',
    options: [
      { label: 'Administrator', value: 'admin' },
      { label: 'Family member', value: 'family' },
    ],
  },
  // existing fields
]
```

- [ ] **Step 4: Run the focused test to verify it passes**

Run: `node --import tsx src/payload/access/is-admin.test.ts`
Expected: `admin access tests passed`.

- [ ] **Step 5: Commit the isolated access-control change**

```bash
git add src/payload/access/is-admin.ts src/payload/access/is-admin.test.ts src/payload/collections/Users.ts
git commit -m "feat: restrict Payload admin to administrators"
```

### Task 2: Restrict CMS data writes while preserving family participation

**Files:**
- Modify: `src/payload/collections/Posts.ts`
- Modify: `src/payload/collections/Categories.ts`
- Modify: `src/payload/collections/TravelProjects.ts`
- Modify: `src/payload/collections/Media.ts`
- Modify: `src/payload/collections/TimelineEvents.ts`
- Modify: `src/payload/collections/WrappedSnapshots.ts`
- Modify: `src/payload/globals/SiteConfig.ts`
- Modify: `src/payload/globals/HomeConfig.ts`
- Modify: `src/lib/data/bucket-list.ts`
- Modify: `src/payload/access/is-admin.test.ts`

- [ ] **Step 1: Extend the failing access test to cover management writes and family participation**

```ts
import { canManageContent } from './is-admin'

assert.equal(canManageContent({ user: { role: 'admin' } }), true)
assert.equal(canManageContent({ user: { role: 'family' } }), false)
```

- [ ] **Step 2: Run the test to verify the new assertion fails**

Run: `node --import tsx src/payload/access/is-admin.test.ts`
Expected: failure because `canManageContent` is not exported until implemented.

- [ ] **Step 3: Apply the role predicate to CMS-managed resources**

Add `canManageContent` to `src/payload/access/is-admin.ts`; it returns the same role check as `canAccessAdmin`. Import it into each CMS-managed collection and set `create`, `update`, and `delete` to `({ req }) => canManageContent({ user: req.user })`. This includes `Users`, which already has `access.admin`; preserve every existing `read` access rule. Set both `SiteConfig.access.update` and `HomeConfig.access.update` to the same predicate.

Do **not** restrict `Comments` or `BucketItems`: their existing authenticated-family create/update/delete behavior is part of Family Mode. Restrict `TimelineEvents` direct create/update/delete to administrators, then change only the timeline creation inside `completeBucketItem()` to use `overrideAccess: true` after its existing `requireFamilyUser()` call. That preserves the approved, server-validated bucket-completion flow without leaving a generic timeline write API open to family accounts.

- [ ] **Step 4: Run focused tests to verify green behavior**

Run:

```bash
node --import tsx src/payload/access/is-admin.test.ts
node --import tsx src/lib/data/phase-7-domain.test.ts
```

Expected: both commands exit zero.

- [ ] **Step 5: Commit the management-access boundary**

```bash
git add src/payload/collections src/payload/globals src/payload/access src/lib/data/bucket-list.ts
git commit -m "feat: limit CMS data changes to administrators"
```

### Task 3: Generate and register the database migration

**Files:**
- Create: `src/migrations/<timestamp>_add_user_role.ts`
- Create: `src/migrations/<timestamp>_add_user_role.json`
- Modify: `src/migrations/index.ts`
- Modify: `src/payload/payload-types.ts` (generated)

- [ ] **Step 1: Generate the Payload types after the collection change**

Run: `pnpm exec payload generate:types`
Expected: generated `User` includes `role: 'admin' | 'family'`.

- [ ] **Step 2: Generate a migration under Node 20**

Run: `pnpm exec payload migrate:create add-user-role --skip-empty --force-accept-warning`
Expected: a timestamped TypeScript migration and JSON snapshot that add a `role` column / select enum to `users`.

- [ ] **Step 3: Verify the generated migration makes existing data safe**

Ensure the migration's `up` path adds the role with a `family` default and updates existing null rows to `family` before adding any non-null constraint. Ensure `down` removes only the role enum/column.

- [ ] **Step 4: Register and apply the migration to the target protected database**

Run: `pnpm exec payload migrate`
Expected: the new migration is recorded exactly once; no existing user, profile, media, or relationship is removed.

- [ ] **Step 5: Commit generated artifacts**

```bash
git add src/migrations src/payload/payload-types.ts
git commit -m "feat: add user roles to Payload"
```

### Task 4: Build and test a credential-safe provisioning parser

**Files:**
- Create: `src/scripts/account-provisioning.ts`
- Create: `src/scripts/account-provisioning.test.ts`

- [ ] **Step 1: Write failing parser and redaction tests using dummy values only**

```ts
import assert from 'node:assert/strict'

import { parseAccountTable, redactProvisioningPlan } from './account-provisioning'

const accounts = parseAccountTable(`| Slug | Email | Password | Administrator |
| --- | --- | --- | --- |
| Tavis | person@example.test | test-password | Y |
| Lynn | second@example.test | another-test-password | N |`)

assert.deepEqual(accounts.map(({ slug, administrator }) => ({ slug, administrator })), [
  { slug: 'tavis', administrator: true },
  { slug: 'lynn', administrator: false },
])
assert.doesNotMatch(redactProvisioningPlan(accounts), /test-password|another-test-password/)
console.log('account provisioning tests passed')
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --import tsx src/scripts/account-provisioning.test.ts`
Expected: failure because `./account-provisioning` does not exist.

- [ ] **Step 3: Implement the parser and plan formatter**

Implement `parseAccountTable(markdown)` to accept only a four-column Markdown table headed `Slug`, `Email`, `Password`, `Administrator`; trim values, require non-empty slug/email/password, normalize slug to lowercase, and treat only `Y` as an administrator marker. Implement `redactProvisioningPlan(accounts)` to report only slug, role, and create/update action—never email or password.

- [ ] **Step 4: Run the focused test to verify it passes**

Run: `node --import tsx src/scripts/account-provisioning.test.ts`
Expected: `account provisioning tests passed`.

- [ ] **Step 5: Commit parser behavior**

```bash
git add src/scripts/account-provisioning.ts src/scripts/account-provisioning.test.ts
git commit -m "feat: add safe family account provisioning parser"
```

### Task 5: Add the deliberate account-provisioning command

**Files:**
- Create: `src/scripts/provision-accounts.ts`
- Modify: `package.json`
- Modify: `src/scripts/account-provisioning.ts`
- Modify: `src/scripts/account-provisioning.test.ts`

- [ ] **Step 1: Write failing CLI argument tests**

```ts
import assert from 'node:assert/strict'

import { provisioningRequestFromArgs } from './account-provisioning'

assert.deepEqual(provisioningRequestFromArgs(['--accounts-file', '/tmp/accounts.md']), {
  accountsFile: '/tmp/accounts.md',
  apply: false,
})
assert.deepEqual(provisioningRequestFromArgs(['--accounts-file', '/tmp/accounts.md', '--apply']), {
  accountsFile: '/tmp/accounts.md',
  apply: true,
})
assert.throws(() => provisioningRequestFromArgs([]), /requires --accounts-file/)
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --import tsx src/scripts/account-provisioning.test.ts`
Expected: failure because `provisioningRequestFromArgs` is not exported.

- [ ] **Step 3: Implement the runtime-only provisioning command**

`provision-accounts.ts` must:

1. Load only the absolute, readable file passed by `--accounts-file`, and never copy the file into the repository.
2. Read two Administration credentials from `WEB_LI_ADMIN_EMAIL` and `WEB_LI_ADMIN_PASSWORD`; fail without printing either value when either is absent.
   The Administration record always uses the stable slug `administration`.
3. Resolve existing users by slug and email, stopping on mismatched ownership rather than overwriting another record.
4. For known profile slugs (`tavis`, `lynn`, `nini`, `sophie`, `leo`, `grandma`), update the existing profile record. For additional accounts, create a minimal record with `familyRole: 'family'`, `profileVisibility: 'family'`, `theme.persona: 'neutral'`, and display name equal to the supplied slug.
5. Set `role: 'admin'` for Administration and Tavis; set `role: 'family'` for all other listed accounts.
6. Print only aggregate create/update counts and role counts in dry-run mode. Perform no write without `--apply`.
7. After apply, call `payload.login` for every provisioned identity and print only per-slug `login: ok` / `login: failed` results.

Add this script:

```json
"accounts:provision": "cross-env NODE_OPTIONS=--no-deprecation node --import tsx src/scripts/provision-accounts.ts"
```

- [ ] **Step 4: Run the command in dry-run mode against the user-owned source file**

Run:

```bash
WEB_LI_ADMIN_EMAIL=<provided-outside-git> WEB_LI_ADMIN_PASSWORD=<provided-outside-git> \
pnpm run accounts:provision -- --accounts-file /Users/tien-hsinglee/Desktop/Account\ Creation.txt
```

Expected: a redacted create/update summary, zero database mutations, and no credential text in output.

- [ ] **Step 5: Commit the command**

```bash
git add src/scripts/account-provisioning.ts src/scripts/account-provisioning.test.ts src/scripts/provision-accounts.ts package.json
git commit -m "feat: add guarded account provisioning command"
```

### Task 6: Apply account changes and verify production behavior

**Files:**
- No repository file changes required.

- [ ] **Step 1: Re-run the dry-run immediately before mutation**

Run the Task 5 dry-run command in the same protected environment and compare its redacted count summary with the approved account list.

- [ ] **Step 2: Apply the approved accounts once**

Run:

```bash
WEB_LI_ADMIN_EMAIL=<provided-outside-git> WEB_LI_ADMIN_PASSWORD=<provided-outside-git> \
pnpm run accounts:provision -- --accounts-file /Users/tien-hsinglee/Desktop/Account\ Creation.txt --apply
```

Expected: only approved `users` records are created or updated; every listed identity reports `login: ok`; output contains no credential, token, or cookie.

- [ ] **Step 3: Verify CMS authorization and Family Mode**

Use the Payload admin endpoint or the collection's `access.admin` predicate with an admin and a family account. Confirm both admin identities are allowed, a family identity is rejected from `/admin`, and a family identity can still log into `/family/login`.

- [ ] **Step 4: Run the full technical verification suite**

Run:

```bash
node --import tsx src/payload/access/is-admin.test.ts
node --import tsx src/scripts/account-provisioning.test.ts
pnpm exec payload generate:types
pnpm tsc --noEmit
pnpm run build
git diff --check
```

Expected: every command exits zero. Record only counts and verification outcomes; never include credentials or session artifacts.

- [ ] **Step 5: Commit and hand off**

```bash
git add src/payload src/migrations src/scripts package.json
git commit -m "feat: provision administrator and family accounts"
```

Report the two administrator identities by display label only, the count of family accounts, migration state, and verification results. Do not report emails or passwords.
