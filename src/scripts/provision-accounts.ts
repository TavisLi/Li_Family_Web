import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { access, readFile } from 'node:fs/promises'

import { getPayload, type Payload } from 'payload'
import { sql } from '@payloadcms/db-postgres'

import {
  buildProvisioningIdentities,
  parseAccountTable,
  provisioningRequestFromArgs,
  summarizeProvisioningActions,
  type ProvisioningActionPlan,
  type ProvisioningIdentity,
} from './account-provisioning'

type ExistingUser = {
  id: number | string
  slug?: string | null
}

const dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(dirname, '../..')

async function run() {
  await loadLocalEnv(projectRoot)

  const request = provisioningRequestFromArgs(process.argv.slice(2))
  const accountTable = await readAccountTable(request.accountsFile)
  const accounts = parseAccountTable(accountTable)
  const identities = buildProvisioningIdentities(accounts, requiredAdministrationCredentials())
  const { default: configPromise } = await import('@payload-config')
  const payload = await getPayload({ config: configPromise })
  const actions = await resolveProvisioningActions(payload, identities)
  const summary = summarizeProvisioningActions(actions)

  console.log(
    JSON.stringify(
      {
        mode: request.apply ? 'apply' : 'dry-run',
        summary,
      },
      null,
      2,
    ),
  )

  if (!request.apply) {
    return
  }

  for (const action of actions) {
    await applyProvisioningAction(payload, action)
  }

  for (const identity of identities) {
    await verifyLogin(payload, identity)
  }
}

async function readAccountTable(accountsFile: string): Promise<string> {
  if (!path.isAbsolute(accountsFile)) {
    throw new Error('Account provisioning requires an absolute --accounts-file path')
  }

  await access(accountsFile)

  return readFile(accountsFile, 'utf8')
}

function requiredAdministrationCredentials() {
  const email = process.env.WEB_LI_ADMIN_EMAIL
  const password = process.env.WEB_LI_ADMIN_PASSWORD

  if (!email || !password) {
    throw new Error('Administration credentials are required in WEB_LI_ADMIN_EMAIL and WEB_LI_ADMIN_PASSWORD')
  }

  return {
    email,
    password,
  }
}

async function resolveProvisioningActions(
  payload: Payload,
  identities: ProvisioningIdentity[],
): Promise<ProvisioningActionPlan[]> {
  const actions: ProvisioningActionPlan[] = []

  for (const identity of identities) {
    const existingBySlug = await findUserBySlug(payload, identity.slug)
    const existingByEmail = await findUserByEmail(payload, identity.email)

    if (existingBySlug && existingByEmail && existingBySlug.id !== existingByEmail.id) {
      throw new Error(`Refusing to provision ${identity.slug}: email is already assigned to another account`)
    }

    if (!existingBySlug && existingByEmail && existingByEmail.slug !== identity.slug) {
      throw new Error(`Refusing to provision ${identity.slug}: email is already assigned to another account`)
    }

    actions.push({
      identity,
      action: existingBySlug || existingByEmail ? 'update' : 'create',
    })
  }

  return actions
}

async function applyProvisioningAction(payload: Payload, action: ProvisioningActionPlan) {
  const existing = await findUserBySlug(payload, action.identity.slug)

  if (existing) {
    await updateExistingAuthIdentity(payload, existing.id, action.identity)

    return
  }

  await payload.create({
    collection: 'users',
    overrideAccess: true,
    data: {
      email: action.identity.email,
      password: action.identity.password,
      role: action.identity.role,
      displayName: displayNameForSlug(action.identity.slug),
      slug: action.identity.slug,
      familyRole: 'family',
      profileVisibility: 'family',
      theme: {
        persona: 'neutral',
      },
    },
  })
}

async function verifyLogin(payload: Payload, identity: ProvisioningIdentity) {
  try {
    await payload.login({
      collection: 'users',
      data: {
        email: identity.email,
        password: identity.password,
      },
    })
    console.log(`${identity.slug}: login ok`)
  } catch {
    console.log(`${identity.slug}: login failed`)
  }
}

async function updateExistingAuthIdentity(
  payload: Payload,
  id: number | string,
  identity: ProvisioningIdentity,
) {
  const { hash, salt } = await generatePasswordSaltHash(identity.password)

  await payload.db.drizzle.execute(sql`
    UPDATE "users"
    SET
      "email" = ${identity.email},
      "role" = ${identity.role}::"public"."enum_users_role",
      "salt" = ${salt},
      "hash" = ${hash},
      "updated_at" = now()
    WHERE "id" = ${id}
  `)
}

async function generatePasswordSaltHash(password: string): Promise<{ hash: string; salt: string }> {
  const salt = await new Promise<string>((resolve, reject) => {
    crypto.randomBytes(32, (error, saltBuffer) => {
      if (error) {
        reject(error)
        return
      }

      resolve(saltBuffer.toString('hex'))
    })
  })
  const hash = await new Promise<string>((resolve, reject) => {
    crypto.pbkdf2(password, salt, 25000, 512, 'sha256', (error, hashBuffer) => {
      if (error) {
        reject(error)
        return
      }

      resolve(hashBuffer.toString('hex'))
    })
  })

  return {
    hash,
    salt,
  }
}

async function findUserBySlug(payload: Payload, slug: string): Promise<ExistingUser | undefined> {
  const result = await payload.find({
    collection: 'users',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    showHiddenFields: true,
    where: {
      slug: {
        equals: slug,
      },
    },
  })

  return result.docs[0]
}

async function findUserByEmail(payload: Payload, email: string): Promise<ExistingUser | undefined> {
  const result = await payload.find({
    collection: 'users',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    showHiddenFields: true,
    where: {
      email: {
        equals: email,
      },
    },
  })

  return result.docs[0]
}

function displayNameForSlug(slug: string): string {
  if (slug === 'administration') {
    return 'Administration'
  }

  return slug
}

async function loadLocalEnv(root: string) {
  for (const filename of ['.env.local', '.env']) {
    const envPath = path.join(root, filename)

    try {
      const content = await readFile(envPath, 'utf8')

      for (const line of content.split('\n')) {
        const trimmed = line.trim()

        if (!trimmed || trimmed.startsWith('#')) {
          continue
        }

        const separatorIndex = trimmed.indexOf('=')

        if (separatorIndex === -1) {
          continue
        }

        const key = trimmed.slice(0, separatorIndex).trim()
        const value = trimmed.slice(separatorIndex + 1).trim().replace(/^['"]|['"]$/g, '')

        if (key && process.env[key] === undefined) {
          process.env[key] = value
        }
      }
    } catch (error) {
      if (!isNodeError(error) || error.code !== 'ENOENT') {
        throw error
      }
    }
  }
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && 'code' in error
}

run()
  .then(() => {
    process.exit(0)
  })
  .catch((error) => {
    console.error(error instanceof Error ? error.message : 'Account provisioning failed')
    process.exit(1)
  })
