export interface AccountTableRow {
  slug: string
  email: string
  password: string
  administrator: boolean
}

export interface ProvisioningRequest {
  accountsFile: string
  apply: boolean
}

export type ProvisionedRole = 'admin' | 'family'
export type ProvisioningAction = 'create' | 'update'

export interface AdministrationCredentials {
  email: string
  password: string
}

export interface ProvisioningIdentity {
  slug: string
  email: string
  password: string
  role: ProvisionedRole
}

export interface ProvisioningActionPlan {
  identity: ProvisioningIdentity
  action: ProvisioningAction
}

export interface ProvisioningSummary {
  counts: Record<ProvisioningAction, number>
  roles: Record<ProvisionedRole, number>
  actions: {
    slug: string
    role: ProvisionedRole
    action: ProvisioningAction
  }[]
}

const expectedAccountHeaders = ['slug', 'email', 'password', 'administrator']

export function parseAccountTable(markdown: string): AccountTableRow[] {
  const rows = markdown
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.startsWith('|') && line.endsWith('|'))
    .map(parseMarkdownTableRow)

  if (rows.length < 2) {
    throw new Error('Account table is missing rows')
  }

  const headers = rows[0]?.map((cell) => cell.toLowerCase())

  if (!headers || !arraysEqual(headers, expectedAccountHeaders)) {
    throw new Error('Account table must use Slug, Email, Password, Administrator headers')
  }

  return rows.slice(2).map((row, index) => {
    if (row.length !== expectedAccountHeaders.length) {
      throw new Error(`Account row ${index + 1} must have four columns`)
    }

    const [slug, email, password, administrator] = row

    if (!slug || !email || !password) {
      throw new Error(`Account row ${index + 1} requires slug, email, and password`)
    }

    return {
      slug: slug.toLowerCase(),
      email,
      password,
      administrator: administrator === 'Y',
    }
  })
}

export function redactProvisioningPlan(accounts: AccountTableRow[]): string {
  return JSON.stringify(
    accounts.map((account) => ({
      slug: account.slug,
      role: account.administrator ? 'admin' : 'family',
      action: 'pending',
    })),
    null,
    2,
  )
}

export function buildProvisioningIdentities(
  accounts: AccountTableRow[],
  administrationCredentials: AdministrationCredentials,
): ProvisioningIdentity[] {
  const identities: ProvisioningIdentity[] = [
    {
      slug: 'administration',
      email: administrationCredentials.email,
      password: administrationCredentials.password,
      role: 'admin',
    },
    ...accounts.map((account) => ({
      slug: account.slug,
      email: account.email,
      password: account.password,
      role: account.administrator ? ('admin' as const) : ('family' as const),
    })),
  ]

  assertUnique(identities.map((identity) => identity.slug), 'slug')
  assertUnique(
    identities.map((identity) => identity.email.toLowerCase()),
    'email',
  )

  return identities
}

export function summarizeProvisioningActions(actions: ProvisioningActionPlan[]): ProvisioningSummary {
  const summary: ProvisioningSummary = {
    counts: {
      create: 0,
      update: 0,
    },
    roles: {
      admin: 0,
      family: 0,
    },
    actions: [],
  }

  for (const action of actions) {
    summary.counts[action.action] += 1
    summary.roles[action.identity.role] += 1
    summary.actions.push({
      slug: action.identity.slug,
      role: action.identity.role,
      action: action.action,
    })
  }

  return summary
}

export function provisioningRequestFromArgs(args: string[]): ProvisioningRequest {
  const accountsFileIndex = args.indexOf('--accounts-file')

  if (accountsFileIndex === -1) {
    throw new Error('Account provisioning requires --accounts-file')
  }

  const accountsFile = args[accountsFileIndex + 1]

  if (!accountsFile || accountsFile.startsWith('--')) {
    throw new Error('Account provisioning requires --accounts-file value')
  }

  return {
    accountsFile,
    apply: args.includes('--apply'),
  }
}

function assertUnique(values: string[], label: string) {
  const seen = new Set<string>()

  for (const value of values) {
    if (seen.has(value)) {
      throw new Error(`Duplicate account ${label}: ${value}`)
    }

    seen.add(value)
  }
}

function parseMarkdownTableRow(line: string): string[] {
  return line
    .slice(1, -1)
    .split('|')
    .map((cell) => cell.trim())
}

function arraysEqual(left: string[], right: string[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index])
}
