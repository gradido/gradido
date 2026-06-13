const { describe, it } = require('node:test')
const { strict } = require('node:assert')
const { CompleteTransaction, MonotonicTimer } = require('../')
const assert = strict

// full, valid blockchain with community root tx at start
const transactions = [
  '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',
]
/*
 json represantation of transactions: 
 "./CompleteTransactions.fixture.json"
 */
const communityUuid = '019e347c-540a-73d2-9886-7fece00d5a2e'

function toHex(buffer) {
  return buffer ? Buffer.from(buffer).toString('hex') : null
}

describe('CompleteTransaction', () => {
  it('Register Address Tx', () => {
    const tx = new CompleteTransaction()
    tx.initFromProtobuf(Buffer.from(transactions[1], 'base64'), communityUuid)
    tx.validate()
    assert.equal(
      toHex(tx.getRegisteredAccount()),
      'eff2919350a53ac80f898062b7c67ff8028245f4cc44e08ef22f885171554f3b',
    )
    assert.equal(tx.getCreatedAt().toISOString(), '2022-01-09T02:43:21.000Z')
    assert.equal(tx.getConfirmedAt().toISOString(), '2022-01-09T02:44:21.000Z')
    const ledgerAnchor = tx.getLedgerAnchor()
    assert.equal(ledgerAnchor.isHieroTransactionId(), true)
    assert.equal(ledgerAnchor.getHieroTransactionId(), '0.0.121@1641696201.0')
    assert.equal(tx.getTransactionType(), 'GRDT_TRANSACTION_REGISTER_ADDRESS')
    assert.equal(tx.getSenderPublicKey(), null)
    assert.equal(tx.getRecipientPublicKey(), null)
    assert.equal(tx.getTargetDate(), null)
    assert.equal(tx.getTimeoutDuration(), 0n)
    assert.equal(tx.getAmount(), 0n)
    assert.equal(tx.getSenderCommunityUuid(), communityUuid)
    assert.equal(tx.getRecipientCommunityUuid(), communityUuid)
    assert.ok(tx)
  })

  it('Contribution Transaction', () => {
    const tx = new CompleteTransaction()
    tx.initFromProtobuf(Buffer.from(transactions[4], 'base64'), communityUuid)
    tx.validate()
    assert.equal(tx.getConfirmedAt().toISOString(), '2022-01-12T14:35:58.000Z')
    assert.equal(tx.getCreatedAt().toISOString(), '2022-01-12T14:34:58.000Z')
    assert.equal(tx.getRegisteredAccount(), null)
    const ledgerAnchor = tx.getLedgerAnchor()
    assert.equal(ledgerAnchor.isHieroTransactionId(), true)
    assert.equal(ledgerAnchor.getHieroTransactionId(), '0.0.121@1641998098.0')
    assert.equal(tx.getTransactionType(), 'GRDT_TRANSACTION_CREATION')
    assert.equal(tx.getSenderPublicKey(), null)
    assert.equal(
      toHex(tx.getRecipientPublicKey()),
      'cb2dd774520a41d98ea3ace740eeb33fa1799d7732adb776e3ddf4c063d601bc',
    )
    assert.equal(tx.getTargetDate().toISOString(), '2021-12-12T00:00:00.000Z')
    assert.equal(tx.getTimeoutDuration(), 0n)
    assert.equal(tx.getAmount(), 10000000n)
    assert.equal(tx.getSenderCommunityUuid(), communityUuid)
    assert.equal(tx.getRecipientCommunityUuid(), communityUuid)
    assert.ok(tx)
  })

  it('Deferred Transfer', () => {
    const tx = new CompleteTransaction()
    tx.initFromProtobuf(Buffer.from(transactions[5], 'base64'), communityUuid)
    tx.validate()
    assert.equal(tx.getConfirmedAt().toISOString(), '2022-01-13T00:35:58.000Z')
    assert.equal(tx.getCreatedAt().toISOString(), '2022-01-13T00:34:58.000Z')
    assert.equal(tx.getRegisteredAccount(), null)
    const ledgerAnchor = tx.getLedgerAnchor()
    assert.equal(ledgerAnchor.isHieroTransactionId(), true)
    assert.equal(ledgerAnchor.getHieroTransactionId(), '0.0.121@1641998098.0')
    assert.equal(tx.getTransactionType(), 'GRDT_TRANSACTION_DEFERRED_TRANSFER')
    assert.equal(
      toHex(tx.getSenderPublicKey()),
      'cb2dd774520a41d98ea3ace740eeb33fa1799d7732adb776e3ddf4c063d601bc',
    )
    assert.equal(
      toHex(tx.getRecipientPublicKey()),
      '3a2c6dd12b203026b20e61e0cc5871e14540a06ec8193ad95b0f287d92d9c670',
    )
    assert.equal(tx.getTargetDate(), null)
    assert.equal(tx.getTimeoutDuration(), 60n * 24n * 60n * 60n) // 60 days
    assert.equal(tx.getAmount(), 5604132n)
    assert.equal(tx.getSenderCommunityUuid(), communityUuid)
    assert.equal(tx.getRecipientCommunityUuid(), communityUuid)
    assert.ok(tx)
  })

  it('Redeem Deferred Transfer', () => {
    const tx = new CompleteTransaction()
    tx.initFromProtobuf(Buffer.from(transactions[6], 'base64'), communityUuid)
    tx.validate()
    assert.equal(tx.getConfirmedAt().toISOString(), '2022-01-14T12:36:58.000Z')
    assert.equal(tx.getCreatedAt().toISOString(), '2022-01-14T12:35:58.000Z')
    assert.equal(tx.getRegisteredAccount(), null)
    const ledgerAnchor = tx.getLedgerAnchor()
    assert.equal(ledgerAnchor.isHieroTransactionId(), true)
    assert.equal(ledgerAnchor.getHieroTransactionId(), '0.0.121@1642163758.0')
    assert.equal(tx.getTransactionType(), 'GRDT_TRANSACTION_REDEEM_DEFERRED_TRANSFER')
    assert.equal(
      toHex(tx.getSenderPublicKey()),
      '3a2c6dd12b203026b20e61e0cc5871e14540a06ec8193ad95b0f287d92d9c670',
    )
    assert.equal(
      toHex(tx.getRecipientPublicKey()),
      'cb2dd774520a41d98ea3ace740eeb33fa1799d7732adb776e3ddf4c063d601bc',
    )
    assert.equal(tx.getTargetDate(), null)
    assert.equal(tx.getTimeoutDuration(), 0n)
    assert.equal(tx.getAmount(), 4830000n)
    assert.equal(tx.getSenderCommunityUuid(), communityUuid)
    assert.equal(tx.getRecipientCommunityUuid(), communityUuid)
    assert.ok(tx)
  })

  it('Transfer Transaction', () => {
    const timeUsed = new MonotonicTimer()
    const tx = new CompleteTransaction()
    tx.initFromProtobuf(Buffer.from(transactions[9], 'base64'), communityUuid)
    tx.validate()
    assert.equal(tx.getConfirmedAt().toISOString(), '2022-01-14T22:37:40.000Z')
    assert.equal(tx.getCreatedAt().toISOString(), '2022-01-14T22:36:40.000Z')
    assert.equal(tx.getRegisteredAccount(), null)
    const ledgerAnchor = tx.getLedgerAnchor()
    assert.equal(ledgerAnchor.isHieroTransactionId(), true)
    assert.equal(ledgerAnchor.getHieroTransactionId(), '0.0.121@1642199800.0')
    assert.equal(tx.getTransactionType(), 'GRDT_TRANSACTION_TRANSFER')
    assert.equal(
      toHex(tx.getSenderPublicKey()),
      'cb2dd774520a41d98ea3ace740eeb33fa1799d7732adb776e3ddf4c063d601bc',
    )
    assert.equal(
      toHex(tx.getRecipientPublicKey()),
      '7ef57ee34e4cae5e014034b7f8043ba640d1a26f07d622ac342e64ad75b9f60d',
    )
    assert.equal(tx.getTargetDate(), null)
    assert.equal(tx.getTimeoutDuration(), 0n)
    assert.equal(tx.getAmount(), 2372100n)
    assert.equal(tx.getSenderCommunityUuid(), communityUuid)
    assert.equal(tx.getRecipientCommunityUuid(), communityUuid)
    assert.ok(tx)
    // biome-ignore lint/suspicious/noConsole: measure time
    console.log(timeUsed.toString())
  })
})
