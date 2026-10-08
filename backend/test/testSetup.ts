import { CONFIG } from '@/config'
import { CONFIG as CORE_CONFIG } from 'core'
import { getLogger, printLogs, clearLogs } from 'config-schema/test/testSetup'
import { AppContext, MINIMAL_PASSWORD_HASHING } from 'shared'

CORE_CONFIG.EMAIL = false
CORE_CONFIG.EMAIL_TEST_MODUS = false
CONFIG.HUMHUB_ACTIVE = false
CONFIG.GMS_ACTIVE = false

// Before the server is created: its init then changes nothing, and every password a test
// hashes takes microseconds instead of 32 MiB of argon2id. A hash made this way matches no
// production hash, which no test compares against.
AppContext.getInstance().init({
  appSecret: CONFIG.LOGIN_APP_SECRET,
  serverKey: CONFIG.LOGIN_SERVER_KEY,
  passwordHashing: MINIMAL_PASSWORD_HASHING,
})

jest.setTimeout(1000000)

export { getLogger, printLogs, clearLogs as cleanLogs }
