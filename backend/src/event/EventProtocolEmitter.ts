import { EventEmitter } from 'events'
import { backendLogger as logger } from '@/server/logger'
// import { EventProtocolType } from './EventProtocolType'
import { EventProtocol } from '@entity/EventProtocol'
// import { getConnection } from '@dbTools/typeorm'
import Decimal from 'decimal.js-light'
import CONFIG from '@/config'

class EventProtocolEmitter extends EventEmitter {
  public isEnabled() {
    logger.info(`EventProtocol - isEnabled=${CONFIG.EVENT_PROTOCOL_ENABLED}`)
    return CONFIG.EVENT_PROTOCOL_ENABLED
  }
}
export const eventProtocol = new EventProtocolEmitter()

eventProtocol.on('error', (err) => {
  logger.error(`ERROR in EventProtocol: ${err}`)
})

/*
eventProtocol.on(EventProtocolType.BASIC, async (createdAt: Date, userId: number) => {
  logger.info(
    `EventProtocol - ${EventProtocolType.BASIC}: createdAt=${createdAt}, userId=${userId}`,
  )
  await writeEvent(EventProtocolType.BASIC, createdAt, userId, null, null, null, null, null)
})

eventProtocol.on(EventProtocolType.VISIT_GRADIDO, async (createdAt: Date, userId: number) => {
  logger.info(
    `EventProtocol - ${EventProtocolType.VISIT_GRADIDO}: createdAt=${createdAt}, userId=${userId}`,
  )
  await writeEvent(EventProtocolType.VISIT_GRADIDO, createdAt, userId, null, null, null, null, null)
})

eventProtocol.on(EventProtocolType.REGISTER, async (createdAt: Date, userId: number) => {
  logger.info(
    `EventProtocol - ${EventProtocolType.REGISTER}: createdAt=${createdAt}, userId=${userId}`,
  )
  await writeEvent(EventProtocolType.REGISTER, createdAt, userId, null, null, null, null, null)
})

eventProtocol.on(
  EventProtocolType.REDEEM_REGISTER,
  async (createdAt: Date, userId: number, transactionId: number, contributionId: number) => {
    logger.info(
      `EventProtocol - ${EventProtocolType.REDEEM_REGISTER}: createdAt=${createdAt}, userId=${userId}, transactionId=${transactionId}, contributionId=${contributionId}`,
    )
    await writeEvent(
      EventProtocolType.REDEEM_REGISTER,
      createdAt,
      userId,
      null,
      null,
      transactionId,
      contributionId,
      null,
    )
  },
)

eventProtocol.on(EventProtocolType.INACTIVE_ACCOUNT, async (createdAt: Date, userId: number) => {
  logger.info(
    `EventProtocol - ${EventProtocolType.INACTIVE_ACCOUNT}: createdAt=${createdAt}, userId=${userId}`,
  )
  await writeEvent(
    EventProtocolType.INACTIVE_ACCOUNT,
    createdAt,
    userId,
    null,
    null,
    null,
    null,
    null,
  )
})

eventProtocol.on(
  EventProtocolType.SEND_CONFIRMATION_EMAIL,
  async (createdAt: Date, userId: number) => {
    logger.info(
      `EventProtocol - ${EventProtocolType.SEND_CONFIRMATION_EMAIL}: createdAt=${createdAt}, userId=${userId}`,
    )
    await writeEvent(
      EventProtocolType.SEND_CONFIRMATION_EMAIL,
      createdAt,
      userId,
      null,
      null,
      null,
      null,
      null,
    )
  },
)

eventProtocol.on(EventProtocolType.CONFIRM_EMAIL, async (createdAt: Date, userId: number) => {
  logger.info(
    `EventProtocol - ${EventProtocolType.CONFIRM_EMAIL}: createdAt=${createdAt}, userId=${userId}`,
  )
  await writeEvent(EventProtocolType.CONFIRM_EMAIL, createdAt, userId, null, null, null, null, null)
})

eventProtocol.on(
  EventProtocolType.REGISTER_EMAIL_KLICKTIPP,
  async (createdAt: Date, userId: number) => {
    logger.info(
      `EventProtocol - ${EventProtocolType.REGISTER_EMAIL_KLICKTIPP}: createdAt=${createdAt}, userId=${userId}`,
    )
    await writeEvent(
      EventProtocolType.REGISTER_EMAIL_KLICKTIPP,
      createdAt,
      userId,
      null,
      null,
      null,
      null,
      null,
    )
  },
)

eventProtocol.on(EventProtocolType.LOGIN, async (createdAt: Date, userId: number) => {
  logger.info(
    `EventProtocol - ${EventProtocolType.LOGIN}: createdAt=${createdAt}, userId=${userId}`,
  )
  await writeEvent(EventProtocolType.LOGIN, createdAt, userId, null, null, null, null, null)
})

eventProtocol.on(
  EventProtocolType.REDEEM_LOGIN,
  async (createdAt: Date, userId: number, transactionId: number, contributionId: number) => {
    logger.info(
      `EventProtocol - ${EventProtocolType.REDEEM_LOGIN}: createdAt=${createdAt}, userId=${userId}, transactionId=${transactionId}, contributionId=${contributionId}`,
    )
    await writeEvent(
      EventProtocolType.REDEEM_LOGIN,
      createdAt,
      userId,
      null,
      null,
      transactionId,
      contributionId,
      null,
    )
  },
)

eventProtocol.on(EventProtocolType.ACTIVATE_ACCOUNT, async (createdAt: Date, userId: number) => {
  logger.info(
    `EventProtocol - ${EventProtocolType.ACTIVATE_ACCOUNT}: createdAt=${createdAt}, userId=${userId}`,
  )
  await writeEvent(
    EventProtocolType.ACTIVATE_ACCOUNT,
    createdAt,
    userId,
    null,
    null,
    null,
    null,
    null,
  )
})

eventProtocol.on(EventProtocolType.PASSWORD_CHANGE, async (createdAt: Date, userId: number) => {
  logger.info(
    `EventProtocol - ${EventProtocolType.PASSWORD_CHANGE}: createdAt=${createdAt}, userId=${userId}`,
  )
  await writeEvent(
    EventProtocolType.PASSWORD_CHANGE,
    createdAt,
    userId,
    null,
    null,
    null,
    null,
    null,
  )
})

eventProtocol.on(EventProtocolType.TRANSACTION_SEND, async (createdAt: Date, userId: number) => {
  logger.info(
    `EventProtocol - ${EventProtocolType.TRANSACTION_SEND}: createdAt=${createdAt}, userId=${userId}`,
  )
  await writeEvent(
    EventProtocolType.TRANSACTION_SEND,
    createdAt,
    userId,
    null,
    null,
    null,
    null,
    null,
  )
})

eventProtocol.on(
  EventProtocolType.TRANSACTION_SEND_REDEEM,
  async (createdAt: Date, userId: number) => {
    logger.info(
      `EventProtocol - ${EventProtocolType.TRANSACTION_SEND_REDEEM}: createdAt=${createdAt}, userId=${userId}`,
    )
    await writeEvent(
      EventProtocolType.TRANSACTION_SEND_REDEEM,
      createdAt,
      userId,
      null,
      null,
      null,
      null,
      null,
    )
  },
)

eventProtocol.on(
  EventProtocolType.TRANSACTION_REPEATE_REDEEM,
  async (createdAt: Date, userId: number) => {
    logger.info(
      `EventProtocol - ${EventProtocolType.TRANSACTION_REPEATE_REDEEM}: createdAt=${createdAt}, userId=${userId}`,
    )
    await writeEvent(
      EventProtocolType.TRANSACTION_REPEATE_REDEEM,
      createdAt,
      userId,
      null,
      null,
      null,
      null,
      null,
    )
  },
)

eventProtocol.on(
  EventProtocolType.TRANSACTION_CREATION,
  async (createdAt: Date, userId: number) => {
    logger.info(
      `EventProtocol - ${EventProtocolType.TRANSACTION_CREATION}: createdAt=${createdAt}, userId=${userId}`,
    )
    await writeEvent(
      EventProtocolType.TRANSACTION_CREATION,
      createdAt,
      userId,
      null,
      null,
      null,
      null,
      null,
    )
  },
)

eventProtocol.on(EventProtocolType.TRANSACTION_RECEIVE, async (createdAt: Date, userId: number) => {
  logger.info(
    `EventProtocol - ${EventProtocolType.TRANSACTION_RECEIVE}: createdAt=${createdAt}, userId=${userId}`,
  )
  await writeEvent(
    EventProtocolType.TRANSACTION_RECEIVE,
    createdAt,
    userId,
    null,
    null,
    null,
    null,
    null,
  )
})

eventProtocol.on(
  EventProtocolType.TRANSACTION_RECEIVE_REDEEM,
  async (createdAt: Date, userId: number) => {
    logger.info(
      `EventProtocol - ${EventProtocolType.TRANSACTION_RECEIVE_REDEEM}: createdAt=${createdAt}, userId=${userId}`,
    )
    await writeEvent(
      EventProtocolType.TRANSACTION_RECEIVE_REDEEM,
      createdAt,
      userId,
      null,
      null,
      null,
      null,
      null,
    )
  },
)

eventProtocol.on(
  EventProtocolType.CONTRIBUTION_CREATE,
  async (createdAt: Date, userId: number, contributionId: number) => {
    logger.info(
      `EventProtocol - ${EventProtocolType.CONTRIBUTION_CREATE}: createdAt=${createdAt}, userId=${userId}, contributionId=${contributionId}`,
    )
    await writeEvent(
      EventProtocolType.CONTRIBUTION_CREATE,
      createdAt,
      userId,
      null,
      null,
      null,
      contributionId,
      null,
    )
  },
)

eventProtocol.on(
  EventProtocolType.CONTRIBUTION_CONFIRM,
  async (
    createdAt: Date,
    userId: number,
    xUserId: number,
    xCommunityId: number,
    contributionId: number,
  ) => {
    logger.info(
      `EventProtocol - ${EventProtocolType.CONTRIBUTION_CONFIRM}: createdAt=${createdAt}, userId=${userId}, xUserId=${xUserId}, xCommunityId=${xCommunityId}, contributionId=${contributionId}`,
    )
    await writeEvent(
      EventProtocolType.CONTRIBUTION_CONFIRM,
      createdAt,
      userId,
      xUserId,
      xCommunityId,
      null,
      contributionId,
      null,
    )
  },
)

eventProtocol.on(
  EventProtocolType.CONTRIBUTION_LINK_DEFINE,
  async (createdAt: Date, userId: number) => {
    logger.info(
      `EventProtocol - ${EventProtocolType.CONTRIBUTION_LINK_DEFINE}: createdAt=${createdAt}, userId=${userId}`,
    )
    await writeEvent(
      EventProtocolType.CONTRIBUTION_LINK_DEFINE,
      createdAt,
      userId,
      null,
      null,
      null,
      null,
      null,
    )
  },
)

eventProtocol.on(
  EventProtocolType.CONTRIBUTION_LINK_ACTIVATE_REDEEM,
  async (createdAt: Date, userId: number) => {
    logger.info(
      `EventProtocol - ${EventProtocolType.CONTRIBUTION_LINK_ACTIVATE_REDEEM}: createdAt=${createdAt}, userId=${userId}`,
    )
    await writeEvent(
      EventProtocolType.CONTRIBUTION_LINK_ACTIVATE_REDEEM,
      createdAt,
      userId,
      null,
      null,
      null,
      null,
      null,
    )
  },
)
*/

export interface EventInterface {
  type: string
  createdAt: Date
  userId: number
  xUserId?: number
  xCommunityId?: number
  transactionId?: number
  contributionId?: number
  amount?: Decimal
}

eventProtocol.on('writeEvents', async (events: EventInterface[]) => {
  for (let i = 0; i < events.length; i++) {
    await writeEvent(events[i])
  }
})

eventProtocol.on('writeEvent', async (event: EventInterface) => {
  await writeEvent(event)
})

const writeEvent = async (event: EventInterface): Promise<void> => {
  // if (!eventProtocol.isEnabled()) return
  logger.info(`writeEvent(${JSON.stringify(event)})`)
  const dbEvent = new EventProtocol()
  dbEvent.type = event.type
  dbEvent.createdAt = event.createdAt
  dbEvent.userId = event.userId
  if (event.xUserId) dbEvent.xUserId = event.xUserId
  if (event.xCommunityId) dbEvent.xCommunityId = event.xCommunityId
  if (event.contributionId) dbEvent.contributionId = event.contributionId
  if (event.transactionId) dbEvent.transactionId = event.transactionId
  if (event.amount) dbEvent.amount = event.amount
  await dbEvent.save()
}
