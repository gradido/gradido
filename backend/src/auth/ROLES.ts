import { INALIENABLE_RIGHTS } from './INALIENABLE_RIGHTS'
import { RIGHTS } from './RIGHTS'
import { Role } from './Role'

// TODO from database
export const ROLES = [
  new Role('unauthorized', INALIENABLE_RIGHTS), // inalienable rights
  new Role('user', [
    ...INALIENABLE_RIGHTS,
    RIGHTS.BALANCE,
    RIGHTS.LIST_GDT_ENTRIES,
    RIGHTS.EXIST_PID,
    RIGHTS.GET_KLICKTIPP_USER,
    RIGHTS.GET_KLICKTIPP_TAG_MAP,
    RIGHTS.UNSUBSCRIBE_NEWSLETTER,
    RIGHTS.SUBSCRIBE_NEWSLETTER,
    RIGHTS.TRANSACTION_LIST,
    RIGHTS.SEND_COINS,
    RIGHTS.LOGOUT,
    RIGHTS.UPDATE_USER_INFOS,
    RIGHTS.HAS_ELOPAGE,
  ]),
  new Role('admin', Object.values(RIGHTS)), // all rights
]
