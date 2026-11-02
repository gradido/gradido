import {
  AppDatabase,
  buildContributionLinkRow,
  buildSeedCreationRows,
  buildSeedTransactionLinkRows,
  buildSeedUserRows,
  DrizzleTransaction,
  dbInsertContributionLinks,
  dbInsertHomeCommunity,
  dbInsertTransactionLinks,
  dbTruncateAllRowsExceptMigrations,
  drizzleDb,
  insertSeedCreationRows,
  insertSeedUserRows,
  newSeedBookingState,
  SeedUserRef,
  sortCreationsByBalanceDate,
  UserInterface,
} from 'database'
import { internet, name } from 'faker/locale/en'
import { getLogger } from 'log4js'
import { AppContext, additionalAliasVariants, aliasCandidates, findFirstFreeAlias } from 'shared'
import { MonotonicTimer } from 'shared-native'
import { v4 as uuidv4 } from 'uuid'
import { CONFIG } from '@/config'
import { initLogging } from '@/server/logger'
import { buildHomeCommunity } from './community'
import { contributionLinks } from './contributionLink/index'
import { creations } from './creation/index'
import { hashSeedUserPasswords } from './factory/user'
import { transactionLinks } from './transactionLink/index'
import { users } from './users/index'

// Rows per round, each built, written and let go before the next: the batch size AGENTS.md sets
// for data migrations.
const BATCH_SIZE = 500
const RANDOM_USER_COUNT = 100
const MODERATOR_EMAIL = 'peter@lustig.de'
const logger = getLogger('seed')

// The first free name of the ladder registration climbs (RegisterUserRole.getFreeAlias): the
// candidates as they are, then numbered, then the gradido id. Lowercased into `taken`, because
// the column compares case-insensitively.
function seedAlias(
  firstName: string,
  lastName: string,
  email: string,
  gradidoId: string,
  taken: Set<string>,
): string {
  const candidates = aliasCandidates({ firstName, lastName, email })
  const alias =
    findFirstFreeAlias([...taken], candidates) ??
    findFirstFreeAlias([...taken], additionalAliasVariants(candidates)) ??
    gradidoId.slice(0, 18).toLowerCase()
  taken.add(alias.toLowerCase())
  return alias
}

// the standard users first, then the random ones - made only when their batch comes
function seedUser(index: number, taken: Set<string>): UserInterface {
  if (index < users.length) {
    return users[index]
  }
  const firstName = name.firstName()
  const lastName = name.lastName()
  const email = internet.email()
  // Drawn here, not in the factory: the ladder's last rung is built from it.
  const gradidoId = uuidv4()
  return {
    alias: seedAlias(firstName, lastName, email, gradidoId, taken),
    gradidoId,
    firstName,
    lastName,
    email,
    language: Math.random() < 0.5 ? 'en' : 'de',
  }
}

/**
 * Writes the users batch by batch and keeps of them only what the later rows refer to: the
 * members whose address a creation or a transaction link names, and the moderator.
 */
async function seedUsers(
  tx: DrizzleTransaction,
  communityUuid: string,
): Promise<Map<string, SeedUserRef>> {
  const referencedEmails = new Set([
    MODERATOR_EMAIL,
    ...creations.map((creation) => creation.email),
    ...transactionLinks.map((transactionLink) => transactionLink.email),
  ])
  // This run's own record of the names handed out, the standard users' included, so no two collide.
  const taken = new Set(users.map((user) => user.alias.toLowerCase()))
  const refsByEmail = new Map<string, SeedUserRef>()
  const total = users.length + RANDOM_USER_COUNT
  for (let offset = 0; offset < total; offset += BATCH_SIZE) {
    const batch: UserInterface[] = []
    for (let index = offset; index < Math.min(offset + BATCH_SIZE, total); index++) {
      batch.push(seedUser(index, taken))
    }
    const rows = buildSeedUserRows(batch, offset + 1, communityUuid, referencedEmails)
    await hashSeedUserPasswords(rows)
    await insertSeedUserRows(rows, tx)
    for (const [email, ref] of rows.refsByEmail) {
      refsByEmail.set(email, ref)
    }
  }
  return refsByEmail
}

async function seedCreations(
  tx: DrizzleTransaction,
  refsByEmail: Map<string, SeedUserRef>,
): Promise<void> {
  const moderator = refsByEmail.get(MODERATOR_EMAIL)
  if (!moderator) {
    throw new Error('Moderator user not found')
  }
  // the sort needs every creation, the rows are built and written batch by batch
  const datedCreations = sortCreationsByBalanceDate(creations)
  const state = newSeedBookingState()
  for (let offset = 0; offset < datedCreations.length; offset += BATCH_SIZE) {
    const batch = datedCreations.slice(offset, offset + BATCH_SIZE)
    await insertSeedCreationRows(buildSeedCreationRows(batch, refsByEmail, moderator, state), tx)
  }
}

async function seedTransactionLinks(
  tx: DrizzleTransaction,
  refsByEmail: Map<string, SeedUserRef>,
): Promise<void> {
  for (let offset = 0; offset < transactionLinks.length; offset += BATCH_SIZE) {
    const batch = transactionLinks.slice(offset, offset + BATCH_SIZE).map((transactionLink) => ({
      ...transactionLink,
      createdAt: transactionLink.createdAt ?? new Date(new Date().getTime() + 1000),
    }))
    await dbInsertTransactionLinks(buildSeedTransactionLinkRows(batch, refsByEmail), tx)
  }
}

async function seedContributionLinks(tx: DrizzleTransaction): Promise<void> {
  for (let offset = 0; offset < contributionLinks.length; offset += BATCH_SIZE) {
    const batch = contributionLinks.slice(offset, offset + BATCH_SIZE)
    await dbInsertContributionLinks(batch.map(buildContributionLinkRow), tx)
  }
}

const run = async () => {
  const timeUsed = new MonotonicTimer()
  initLogging()
  const db = AppDatabase.getInstance()
  await db.init(false, false, true)
  // The rows below count their ids from 1. Before the transaction: TRUNCATE commits implicitly.
  await dbTruncateAllRowsExceptMigrations()
  logger.info('clean database successful...')
  AppContext.getInstance().initPasswordHashing({
    appSecret: CONFIG.LOGIN_APP_SECRET,
    serverKey: CONFIG.LOGIN_SERVER_KEY,
  })
  const homeCommunity = await buildHomeCommunity()

  // One transaction: a seed that fails half way leaves no half seeded database behind. The
  // password hashing runs inside it, batch by batch - hashing everything before would mean
  // holding every row at once.
  await drizzleDb().transaction(async (tx) => {
    await dbInsertHomeCommunity(homeCommunity, tx)
    const refsByEmail = await seedUsers(tx, homeCommunity.communityUuid)
    await seedCreations(tx, refsByEmail)
    await seedTransactionLinks(tx, refsByEmail)
    await seedContributionLinks(tx)
  })
  logger.info(
    `seeded ${users.length + RANDOM_USER_COUNT} users, ${creations.length} creations, ` +
      `${transactionLinks.length} transaction links and ${contributionLinks.length} ` +
      `contribution links in ${timeUsed}`,
  )
}

async function main() {
  try {
    await run()
  } finally {
    await AppDatabase.getInstance().destroy()
  }
}

main().catch((err) => {
  // biome-ignore lint/suspicious/noConsole: no logger present
  console.error('error on seeding', err)
  process.exitCode = 1
})
