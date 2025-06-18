/* MIGRATION TO CLEAN PRODUCTION DATA
 *
 * the way the passphrases are stored in login_user_backups is inconsistent.
 * we need to detect which word list was used and transform it accordingly.
 * This also removes the trailing space
 */

import fs from 'fs'
import path from 'path'

const TARGET_MNEMONIC_TYPE = 2
const PHRASE_WORD_COUNT = 24
const WORDS_MNEMONIC_0 = fs
  .readFileSync(path.resolve(__dirname, '../../src/config/mnemonic.uncompressed_buffer18112.txt'))
  .toString()
  .split(',')
const WORDS_MNEMONIC_1 = fs
  .readFileSync(path.resolve(__dirname, '../../src/config/mnemonic.uncompressed_buffer18113.txt'))
  .toString()
  .split(',')
const WORDS_MNEMONIC_2 = fs
  .readFileSync(path.resolve(__dirname, '../../src/config/mnemonic.uncompressed_buffer13116.txt'))
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
  // Loop through all user backups and update passphrase and mnemonic type if needed
  const userBackups = await queryFn(`SELECT * FROM login_user_backups`)
  userBackups.forEach(async (userBackup) => {
    const passphrase = userBackup.passphrase.split(' ')
    const newPassphrase = detectMnemonic(passphrase).join(' ')
    if (newPassphrase !== userBackup.passphrase) {
      await queryFn(
        `UPDATE login_user_backups SET passphrase = ?, mnemonic_type = ? WHERE id = ?`,
        [newPassphrase, TARGET_MNEMONIC_TYPE, userBackup.id],
      )
    }
  })
}

export async function downgrade(
  /* queryFn: (query: string, values?: any[]) => Promise<Array<any>> */
) {
  // cannot transform things back
}
