import { EventEmitter } from 'events'
import { backendLogger as logger } from '@/server/logger'
import { EventProtocolType } from '@/graphql/enum/EventProtocolType'
import { EventProtocol } from '@entity/EventProtocol'
import Decimal from 'decimal.js-light'

export class EventProtocolEmitter extends EventEmitter {}
const eventProtocol = new EventProtocolEmitter()

eventProtocol.on(
  EventProtocolType.ACTIVATE_ACCOUNT,
  (_event: Event, createdAt: Date, userId: number) => {
    logger.info(
      `EventProtocol - ACTIVATE_ACCOUNT: _event=${_event}, createdAt=${createdAt}, userId=${userId}`,
    )
    writeEvent(EventProtocolType.ACTIVATE_ACCOUNT, createdAt, userId, null, null, null, null, null)
  },
)

eventProtocol.on(EventProtocolType.BASIC, (_event: Event, createdAt: Date, userId: number) => {
  logger.info(`EventProtocol - BASIC: _event=${_event}, createdAt=${createdAt}, userId=${userId}`)
  writeEvent(EventProtocolType.BASIC, createdAt, userId, null, null, null, null, null)
})

eventProtocol.on(
  EventProtocolType.CONFIRM_EMAIL,
  (_event: Event, createdAt: Date, userId: number) => {
    logger.info(
      `EventProtocol - CONFIRM_EMAIL: _event=${_event}, createdAt=${createdAt}, userId=${userId}`,
    )
    writeEvent(EventProtocolType.CONFIRM_EMAIL, createdAt, userId, null, null, null, null, null)
  },
)

eventProtocol.on(
  EventProtocolType.CONTRIBUTION_CONFIRM,
  (
    _event: Event,
    createdAt: Date,
    userId: number,
    xUserId: number,
    xCommunityId: number,
    contributionId: number,
  ) => {
    logger.info(
      `EventProtocol - CONTRIBUTION_CONFIRM: _event=${_event}, createdAt=${createdAt}, userId=${userId}, xUserId=${xUserId}, xCommunityId=${xCommunityId}, contributionId=${contributionId}`,
    )
    writeEvent(
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
  EventProtocolType.CONTRIBUTION_CREATE,
  (_event, createdAt, userId, contributionId) => {
    logger.info(
      `EventProtocol - CONTRIBUTION_CREATE: _event=${_event}, createdAt=${createdAt}, userId=${userId}, contributionId=${contributionId}`,
    )
    writeEvent(
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
  EventProtocolType.CONTRIBUTION_LINK_ACTIVATE_REDEEM,
  (_event, createdAt, userId) => {
    logger.info(
      `EventProtocol - CONTRIBUTION_LINK_ACTIVATE_REDEEM: _event=${_event}, createdAt=${createdAt}, userId=${userId}`,
    )
    writeEvent(
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

eventProtocol.on(EventProtocolType.CONTRIBUTION_LINK_DEFINE, (_event, createdAt, userId) => {
  logger.info(
    `EventProtocol - CONTRIBUTION_LINK_DEFINE: _event=${_event}, createdAt=${createdAt}, userId=${userId}`,
  )
  writeEvent(
    EventProtocolType.CONTRIBUTION_LINK_DEFINE,
    createdAt,
    userId,
    null,
    null,
    null,
    null,
    null,
  )
})

eventProtocol.on(EventProtocolType.INACTIVE_ACCOUNT, (_event, createdAt, userId) => {
  logger.info(
    `EventProtocol - INACTIVE_ACCOUNT: _event=${_event}, createdAt=${createdAt}, userId=${userId}`,
  )
  writeEvent(EventProtocolType.INACTIVE_ACCOUNT, createdAt, userId, null, null, null, null, null)
})

eventProtocol.on(EventProtocolType.LOGIN, (_event, createdAt, userId) => {
  logger.info(`EventProtocol - LOGIN: _event=${_event}, createdAt=${createdAt}, userId=${userId}`)
  writeEvent(EventProtocolType.LOGIN, createdAt, userId, null, null, null, null, null)
})

eventProtocol.on(EventProtocolType.PASSWORD_CHANGE, (_event, createdAt, userId) => {
  logger.info(
    `EventProtocol - PASSWORD_CHANGE: _event=${_event}, createdAt=${createdAt}, userId=${userId}`,
  )
  writeEvent(EventProtocolType.PASSWORD_CHANGE, createdAt, userId, null, null, null, null, null)
})

eventProtocol.on(
  EventProtocolType.REDEEM_LOGIN,
  (_event, createdAt, userId, transactionId, contributionId) => {
    logger.info(
      `EventProtocol - REDEEM_LOGIN: _event=${_event}, createdAt=${createdAt}, userId=${userId}, transactionId=${transactionId}, contributionId=${contributionId}`,
    )
    writeEvent(
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

eventProtocol.on(
  EventProtocolType.REDEEM_REGISTER,
  (_event, createdAt, userId, transactionId, contributionId) => {
    logger.info(
      `EventProtocol - REDEEM_REGISTER: _event=${_event}, createdAt=${createdAt}, userId=${userId}, transactionId=${transactionId}, contributionId=${contributionId}`,
    )
    writeEvent(
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

eventProtocol.on(EventProtocolType.REGISTER, (_event, createdAt, userId) => {
  logger.info(
    `EventProtocol - REGISTER: _event=${_event}, createdAt=${createdAt}, userId=${userId}`,
  )
  writeEvent(EventProtocolType.REGISTER, createdAt, userId, null, null, null, null, null)
})

eventProtocol.on(EventProtocolType.REGISTER_EMAIL_KLICKTIPP, (_event, createdAt, userId) => {
  logger.info(
    `EventProtocol - REGISTER_EMAIL_KLICKTIPP: _event=${_event}, createdAt=${createdAt}, userId=${userId}`,
  )
  writeEvent(
    EventProtocolType.REGISTER_EMAIL_KLICKTIPP,
    createdAt,
    userId,
    null,
    null,
    null,
    null,
    null,
  )
})

eventProtocol.on(EventProtocolType.SEND_CONFIRMATION_EMAIL, (_event, createdAt, userId) => {
  logger.info(
    `EventProtocol - SEND_CONFIRMATION_EMAIL: _event=${_event}, createdAt=${createdAt}, userId=${userId}`,
  )
  writeEvent(
    EventProtocolType.SEND_CONFIRMATION_EMAIL,
    createdAt,
    userId,
    null,
    null,
    null,
    null,
    null,
  )
})

eventProtocol.on(EventProtocolType.TRANSACTION_CREATION, (_event, createdAt, userId) => {
  logger.info(
    `EventProtocol - TRANSACTION_CREATION: _event=${_event}, createdAt=${createdAt}, userId=${userId}`,
  )
  writeEvent(
    EventProtocolType.TRANSACTION_CREATION,
    createdAt,
    userId,
    null,
    null,
    null,
    null,
    null,
  )
})

eventProtocol.on(EventProtocolType.TRANSACTION_RECEIVE, (_event, createdAt, userId) => {
  logger.info(
    `EventProtocol - TRANSACTION_RECEIVE: _event=${_event}, createdAt=${createdAt}, userId=${userId}`,
  )
  writeEvent(EventProtocolType.TRANSACTION_RECEIVE, createdAt, userId, null, null, null, null, null)
})

eventProtocol.on(EventProtocolType.TRANSACTION_RECEIVE_REDEEM, (_event, createdAt, userId) => {
  logger.info(
    `EventProtocol - TRANSACTION_RECEIVE_REDEEM: _event=${_event}, createdAt=${createdAt}, userId=${userId}`,
  )
  writeEvent(
    EventProtocolType.TRANSACTION_RECEIVE_REDEEM,
    createdAt,
    userId,
    null,
    null,
    null,
    null,
    null,
  )
})

eventProtocol.on(EventProtocolType.TRANSACTION_REPEATE_REDEEM, (_event, createdAt, userId) => {
  logger.info(
    `EventProtocol - TRANSACTION_REPEATE_REDEEM: _event=${_event}, createdAt=${createdAt}, userId=${userId}`,
  )
  writeEvent(
    EventProtocolType.TRANSACTION_REPEATE_REDEEM,
    createdAt,
    userId,
    null,
    null,
    null,
    null,
    null,
  )
})

eventProtocol.on(EventProtocolType.TRANSACTION_SEND, (_event, createdAt, userId) => {
  logger.info(
    `EventProtocol - TRANSACTION_SEND: _event=${_event}, createdAt=${createdAt}, userId=${userId}`,
  )
  writeEvent(EventProtocolType.TRANSACTION_SEND, createdAt, userId, null, null, null, null, null)
})

eventProtocol.on(EventProtocolType.TRANSACTION_SEND_REDEEM, (_event, createdAt, userId) => {
  logger.info(
    `EventProtocol - TRANSACTION_SEND_REDEEM: _event=${_event}, createdAt=${createdAt}, userId=${userId}`,
  )
  writeEvent(
    EventProtocolType.TRANSACTION_SEND_REDEEM,
    createdAt,
    userId,
    null,
    null,
    null,
    null,
    null,
  )
})

eventProtocol.on(EventProtocolType.VISIT_GRADIDO, (_event, createdAt, userId) => {
  logger.info(
    `EventProtocol - VISIT_GRADIDO: _event=${_event}, createdAt=${createdAt}, userId=${userId}`,
  )
  writeEvent(EventProtocolType.VISIT_GRADIDO, createdAt, userId, null, null, null, null, null)
})

async function writeEvent(
  type: string,
  createdAt: Date,
  userId: number,
  xUserId: number | null,
  xCommunityId: number | null,
  transactionId: number | null,
  contributionId: number | null,
  amount: Decimal | null,
) {
  const event = new EventProtocol()
  // eslint-disable-next-line no-unused-expressions
  amount ? (event.amount = amount) : null
  // eslint-disable-next-line no-unused-expressions
  contributionId ? (event.contributionId = contributionId) : null
  event.createdAt = createdAt
  // eslint-disable-next-line no-unused-expressions
  transactionId ? (event.transactionId = transactionId) : null
  event.type = type
  event.userId = userId
  // eslint-disable-next-line no-unused-expressions
  xCommunityId ? (event.xCommunityId = xCommunityId) : null
  // eslint-disable-next-line no-unused-expressions
  xUserId ? (event.xUserId = xUserId) : null
  // set event values here when having the result ...
  await event.save()
}
