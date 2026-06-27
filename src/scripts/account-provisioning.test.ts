import assert from 'node:assert/strict'

import {
  buildProvisioningIdentities,
  parseAccountTable,
  provisioningRequestFromArgs,
  redactProvisioningPlan,
  summarizeProvisioningActions,
} from './account-provisioning'

const accounts = parseAccountTable(`| Slug | Email | Password | Administrator |
| --- | --- | --- | --- |
| Tavis | person@example.test | test-password | Y |
| Lynn | second@example.test | another-test-password | N |`)

assert.deepEqual(
  accounts.map(({ slug, administrator }) => ({ slug, administrator })),
  [
    { slug: 'tavis', administrator: true },
    { slug: 'lynn', administrator: false },
  ],
)
assert.doesNotMatch(redactProvisioningPlan(accounts), /test-password|another-test-password/)
const identities = buildProvisioningIdentities(accounts, {
  email: 'admin@example.test',
  password: 'admin-test-password',
})
assert.deepEqual(
  identities.map(({ slug, role }) => ({ slug, role })),
  [
    { slug: 'administration', role: 'admin' },
    { slug: 'tavis', role: 'admin' },
    { slug: 'lynn', role: 'family' },
  ],
)
const summary = summarizeProvisioningActions([
  { identity: identities[0], action: 'create' },
  { identity: identities[1], action: 'update' },
  { identity: identities[2], action: 'update' },
])
assert.deepEqual(summary.counts, { create: 1, update: 2 })
assert.deepEqual(summary.roles, { admin: 2, family: 1 })
assert.deepEqual(summary.access, { administrators: 2, familyMembers: 2 })
assert.doesNotMatch(JSON.stringify(summary), /admin@example\.test|admin-test-password|person@example\.test/)
const identitiesWithAdminRow = buildProvisioningIdentities(
  [
    {
      slug: '-',
      email: 'admin@example.test',
      password: 'ignored-admin-row-password',
      administrator: true,
    },
    ...accounts,
  ],
  {
    email: 'admin@example.test',
    password: 'admin-test-password',
  },
)
assert.deepEqual(
  identitiesWithAdminRow.map(({ slug, role }) => ({ slug, role })),
  [
    { slug: 'administration', role: 'admin' },
    { slug: 'tavis', role: 'admin' },
    { slug: 'lynn', role: 'family' },
  ],
)
assert.equal(identitiesWithAdminRow[0]?.password, 'admin-test-password')
assert.deepEqual(provisioningRequestFromArgs(['--accounts-file', '/tmp/accounts.md']), {
  accountsFile: '/tmp/accounts.md',
  apply: false,
})
assert.deepEqual(provisioningRequestFromArgs(['--accounts-file', '/tmp/accounts.md', '--apply']), {
  accountsFile: '/tmp/accounts.md',
  apply: true,
})
assert.throws(() => provisioningRequestFromArgs([]), /requires --accounts-file/)
console.log('account provisioning tests passed')
