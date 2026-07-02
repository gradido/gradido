const { describe, it } = require('node:test')
const { strict } = require('node:assert')
const assert = strict
const {
  GRDT_ADDRESS_TYPES,
  GRDT_TRANSACTION_TYPES,
  GRDT_BALANCE_DERIVATION_TYPES,
  GRDT_CROSS_GROUP_TYPES,
  GRDT_LEDGER_ANCHOR_TYPES,
  GRDT_MEMO_KEY_TYPES,
  grdtAddressToString,
  grdtTransactionToString,
  grdtBalanceDerivationToString,
  grdtCrossGroupToString,
  grdtLedgerAnchorToString,
  grdtMemoKeyToString,
} = require('../')

describe('types', () => {
  describe('GrdtAddressType', () => {
    it('check that all values are the same in C and TypeScript', () => {
      for (let i = 0; i < GRDT_ADDRESS_TYPES.length; i++) {
        assert.equal(grdtAddressToString(i), GRDT_ADDRESS_TYPES[i])
        // console.log(tsType)
      }
    })
  })
  describe('GrdtBalanceDerivationType', () => {
    it('check that all values are the same in C and TypeScript', () => {
      for (let i = 0; i < GRDT_BALANCE_DERIVATION_TYPES.length; i++) {
        assert.equal(grdtBalanceDerivationToString(i), GRDT_BALANCE_DERIVATION_TYPES[i])
        // console.log(tsType)
      }
    })
  })
  describe('GrdtCrossGroupType', () => {
    it('check that all values are the same in C and TypeScript', () => {
      for (let i = 0; i < GRDT_CROSS_GROUP_TYPES.length; i++) {
        assert.equal(grdtCrossGroupToString(i), GRDT_CROSS_GROUP_TYPES[i])
        // console.log(tsType)
      }
    })
  })
  describe('GrdtLedgerAnchorType', () => {
    it('check that all values are the same in C and TypeScript', () => {
      for (let i = 0; i < GRDT_LEDGER_ANCHOR_TYPES.length; i++) {
        if (i === 1) {
          // skip GRDT_LEDGER_ANCHOR_IOTA_MESSAGE_ID
          continue
        }
        assert.equal(grdtLedgerAnchorToString(i), GRDT_LEDGER_ANCHOR_TYPES[i])
        // console.log(tsType)
      }
    })
  })
  describe('GrdtMemoKeyType', () => {
    it('check that all values are the same in C and TypeScript', () => {
      for (let i = 0; i < GRDT_MEMO_KEY_TYPES.length; i++) {
        assert.equal(grdtMemoKeyToString(i), GRDT_MEMO_KEY_TYPES[i])
        // console.log(tsType)
      }
    })
  })
  describe('GrdtTransactionType', () => {
    it('check that all values are the same in C and TypeScript', () => {
      for (let i = 0; i < GRDT_TRANSACTION_TYPES.length; i++) {
        assert.equal(grdtTransactionToString(i), GRDT_TRANSACTION_TYPES[i])
        // console.log(tsType)
      }
    })
  })
})
