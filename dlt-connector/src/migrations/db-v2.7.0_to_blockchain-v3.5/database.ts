import { SQL } from 'bun'
import { memoSchema, uuidv4Schema, identifierSeedSchema, gradidoAmountSchema } from '../../schemas/typeGuard.schema'
import { dateSchema, booleanSchema } from '../../schemas/typeConverter.schema'
import * as v from 'valibot'
import { GradidoUnit } from 'gradido-blockchain-js'
import { LOG4JS_BASE_CATEGORY } from '../../config/const'
import { getLogger } from 'log4js'

export const createdUserDbSchema = v.object({
  gradidoId: uuidv4Schema,
  communityUuid: uuidv4Schema,  
  createdAt: dateSchema,
})

export const userDbSchema = v.object({
  gradidoId: uuidv4Schema,
  communityUuid: uuidv4Schema,  
})

export enum TransactionTypeId {
  CREATION = 1,
  SEND = 2,
  RECEIVE = 3,
  // This is a virtual property, never occurring on the database
  DECAY = 4,
  LINK_SUMMARY = 5,
}

export const transactionDbSchema = v.object({
  typeId: v.enum(TransactionTypeId),
  amount: gradidoAmountSchema,
  balanceDate: dateSchema,
  memo: memoSchema,
  creationDate: v.nullish(dateSchema),
  user: userDbSchema,
  linkedUser: userDbSchema,
  transactionLinkCode: v.nullish(identifierSeedSchema),
})

export const transactionLinkDbSchema = v.object({
  user: userDbSchema,
  code: identifierSeedSchema,
  amount: gradidoAmountSchema,
  memo: memoSchema,
  createdAt: dateSchema,
  validUntil: dateSchema,
})

export const communityDbSchema = v.object({
  foreign: booleanSchema,
  communityUuid: uuidv4Schema,
  name: v.string(),
  creationDate: dateSchema,
  userMinCreatedAt: dateSchema,
  uniqueAlias: v.string(),
})

export type TransactionDb = v.InferOutput<typeof transactionDbSchema>
export type UserDb = v.InferOutput<typeof userDbSchema>
export type CreatedUserDb = v.InferOutput<typeof createdUserDbSchema>
export type TransactionLinkDb = v.InferOutput<typeof transactionLinkDbSchema>
export type CommunityDb = v.InferOutput<typeof communityDbSchema>

const logger = getLogger(`${LOG4JS_BASE_CATEGORY}.migrations.db-v2.7.0_to_blockchain-v3.6.blockchain`)

// queries
export async function loadCommunities(db: SQL): Promise<CommunityDb[]> {
  const result = await db`
    SELECT c.foreign, c.community_uuid as communityUuid, c.name as name, c.creation_date as creationDate, MIN(u.created_at) as userMinCreatedAt
    FROM communities c
    LEFT JOIN users u ON c.community_uuid = u.community_uuid
    WHERE c.community_uuid IS NOT NULL
    GROUP BY c.community_uuid
  `
  const communityNames = new Set<string>()
  return result.map((row: any) => {
    let alias = row.name
    if (communityNames.has(row.name)) {
      alias = row.community_uuid
    } else {
      communityNames.add(row.name)
    }
    return v.parse(communityDbSchema, {
      ...row,
      uniqueAlias: alias,
    })
  })
}

export async function loadUsers(db: SQL, offset: number, count: number): Promise<CreatedUserDb[]> {
  const result = await db`
    SELECT gradido_id as gradidoId, community_uuid as communityUuid, created_at as createdAt FROM users
    ORDER by created_at ASC
    LIMIT ${offset}, ${count}
  `
  return result.map((row: any) => {
    return v.parse(createdUserDbSchema, row)
  })
}

export async function loadTransactions(db: SQL, offset: number, count: number): Promise<TransactionDb[]> {
  const result = await db`
    SELECT t.id, t.type_id, t.amount, t.balance_date, t.memo, t.creation_date, 
    u.gradido_id AS user_gradido_id, u.community_uuid AS user_community_uuid, u.created_at as user_created_at,
    lu.gradido_id AS linked_user_gradido_id, lu.community_uuid AS linked_user_community_uuid, lu.created_at as linked_user_created_at,
    tl.code as transaction_link_code
    FROM transactions as t
    LEFT JOIN users u ON t.user_id = u.id
    LEFT JOIN users lu ON t.linked_user_id = lu.id
    LEFT JOIN transaction_links tl ON t.transaction_link_id = tl.id
    ORDER by balance_date ASC
    LIMIT ${offset}, ${count}
  `
  return result.map((row: any) => {
    // console.log(row)
    // check for consistent data beforehand
    const userCreatedAt = new Date(row.user_created_at)
    const linkedUserCreatedAd = new Date(row.linked_user_created_at)
    const balanceDate = new Date(row.balance_date)
    if (userCreatedAt.getTime() > balanceDate.getTime() ||
        linkedUserCreatedAd.getTime() > balanceDate.getTime()
    ){
      logger.error(`table row: `, row)
      throw new Error('at least one user was created after transaction balance date, logic error!')
    }
    
    let amount = GradidoUnit.fromString(row.amount)
    if (row.type_id === TransactionTypeId.SEND) {
      amount = amount.mul(new GradidoUnit(-1))
    }
    try {
      return v.parse(transactionDbSchema, {
        typeId: row.type_id,
        amount,
        balanceDate: new Date(row.balance_date),
        memo: row.memo,
        creationDate: new Date(row.creation_date),
        transactionLinkCode: row.transaction_link_code,
        user: {
          gradidoId: row.user_gradido_id,
          communityUuid: row.user_community_uuid
        },
        linkedUser: {
          gradidoId: row.linked_user_gradido_id,
          communityUuid: row.linked_user_community_uuid
        }
      })
    } catch (e) {
      if (e instanceof v.ValiError) {
        console.error(v.flatten(e.issues))
      } else {
        throw e
      }
    }
  })
}

export async function loadTransactionLinks(db: SQL, offset: number, count: number): Promise<TransactionLinkDb[]> {
  const result = await db`
    SELECT u.gradido_id as userGradidoId, u.community_uuid as userCommunityUuid, tl.code, tl.amount, tl.memo, tl.createdAt, tl.validUntil
    FROM transaction_links tl
    LEFT JOIN users u ON tl.userId = u.id
    ORDER by createdAt ASC
    LIMIT ${offset}, ${count}
  `
  return result.map((row: any) => {
    return v.parse(transactionLinkDbSchema, {
      ...row,
      user: {
        gradidoId: row.userGradidoId,
        communityUuid: row.userCommunityUuid
      }
    })
  })
}

export async function loadDeletedTransactionLinks(db: SQL, offset: number, count: number): Promise<TransactionDb[]> {
  const result = await db`
    SELECT u.gradido_id as user_gradido_id, u.community_uuid as user_community_uuid, 
    tl.code, tl.amount, tl.memo, tl.deletedAt
    FROM transaction_links tl
    LEFT JOIN users u ON tl.userId = u.id
    WHERE deletedAt IS NOT NULL
    ORDER by deletedAt ASC
    LIMIT ${offset}, ${count}
  `
  return result.map((row: any) => {
    const user = {
      gradidoId: row.user_gradido_id,
      communityUuid: row.user_community_uuid
    }
    return v.parse(transactionDbSchema, {
      typeId: TransactionTypeId.RECEIVE,
      amount: row.amount,      
      balanceDate: new Date(row.deletedAt),
      memo: row.memo,
      transactionLinkCode: row.code,
      user,
      linkedUser: user
    })
  })
}