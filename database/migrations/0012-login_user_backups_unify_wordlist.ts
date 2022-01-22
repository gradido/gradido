/* MIGRATION TO CLEAN PRODUCTION DATA
 *
 * the way the passphrases are stored in login_user_backups is inconsistent.
 * we need to try to detect which word list was used and transform it accordingly
 */
import fs from 'fs'

const TARGET_MNEMONIC_TYPE = 2
const PHRASE_WORD_COUNT = 24
const WORDS_MNEMONIC_0 = fs
  .readFileSync('src/config/mnemonic.uncompressed_buffer18112.txt')
  .toString()
  .split(',')
const WORDS_MNEMONIC_1 = fs
  .readFileSync('src/config/mnemonic.uncompressed_buffer18113.txt')
  .toString()
  .split(',')
const WORDS_MNEMONIC_2 = fs
  .readFileSync('src/config/mnemonic.uncompressed_buffer13116.txt')
  .toString()
  .split(',')
const WORDS_MNEMONIC = [WORDS_MNEMONIC_0, WORDS_MNEMONIC_1, WORDS_MNEMONIC_2]

const detectMnemonic = (passphrase: string[]): string[] => {
  if (passphrase.length < PHRASE_WORD_COUNT) {
    throw new Error(
      `Passphrase is not long enough ${passphrase.length}/${PHRASE_WORD_COUNT}; passphrase: ${passphrase}`,
    )
  }

  const passphraseSliced = passphrase.slice(0, PHRASE_WORD_COUNT)

  // Loop through all word lists
  for (let i = 0; i < WORDS_MNEMONIC.length; i++) {
    // Does the wordlist contain all elements of the passphrase
    if (passphraseSliced.every((word) => WORDS_MNEMONIC[i].includes(word))) {
      if (i === TARGET_MNEMONIC_TYPE) {
        return passphraseSliced
      } else {
        return passphraseSliced.map((word) => WORDS_MNEMONIC_2[WORDS_MNEMONIC[i].indexOf(word)])
      }
    }
  }

  throw new Error(`Could not find mnemonic type for passphrase: ${passphrase}`)
}

export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  // Delete data with no reference in login_users table
  // eslint-disable-next-line no-console
  // 663 affected rows
  const userBackups = await queryFn(`SELECT * FROM login_user_backups`)
  let i = 0
  // eslint-disable-next-line no-console
  userBackups.forEach(async (userBackup) => {
    const passphrase = userBackup.passphrase.split(' ')
    const newPassphrase = detectMnemonic(passphrase).join(' ')
    if (newPassphrase !== userBackup.passphrase) {
      await queryFn(
        `UPDATE login_user_backups SET passphrase = ?, mnemonic_type = ? WHERE id = ?`,
        [newPassphrase, TARGET_MNEMONIC_TYPE, userBackup.id],
      )
      i++
      // eslint-disable-next-line no-console
      console.log(
        'Changed passphrase mnemonic type',
        i,
        `"${userBackup.passphrase}"`,
        'TO',
        `"${newPassphrase}"`,
      )
    }
  })
  // Searching for users with a missing password and a backup entry
  // `SELECT * FROM login_user_backups WHERE user_id IN (SELECT id FROM login_users WHERE password = 0)`
  // results in only new users with the proper passphrase scheme - luckily we seem to be good on this one
  // 142 entries in total are found and every entry has type 2 (new one).
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  return [] // cannot transform things back
}
