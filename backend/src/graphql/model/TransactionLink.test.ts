// AI-GENERATED — not an architecture reference

import { TransactionLink } from '@model/TransactionLink'
import { TransactionLink as DbTransactionLink } from 'database'
import { GradidoUnit } from 'shared'

// The link as the schema hands it out, built from a row. Here only the face of the member who
// made it (senderAvatar, ZE-038): what the model makes of the picture it is handed. Who is
// handed one is the resolver's (TransactionLinkResolver.greeting.test.ts) and the rule's
// (SenderAvatar.logic.test.ts).
describe('TransactionLink', () => {
  const row = () =>
    ({
      id: 7,
      amount: GradidoUnit.fromString('20'),
      holdAvailableAmount: GradidoUnit.fromString('20'),
      memo: 'Danke fürs Reparieren der Gartenbank',
      code: 'a1b2c3d4e5f6a1b2c3d4e5f6',
      createdAt: new Date('2026-11-06T19:00:00.000Z'),
      validUntil: new Date('2026-11-20T19:00:00.000Z'),
      deletedAt: null,
      redeemedAt: null,
    }) as unknown as DbTransactionLink

  // A few bytes that are no text: base64 of them is not the bytes read as a string.
  const PICTURE = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0xff, 0xd9])

  it('carries the picture it is handed as base64, without a data-URI prefix', () => {
    const link = new TransactionLink(row(), undefined, undefined, [], null, PICTURE)

    expect(link.senderAvatar).toBe('/9j/4AAQSkb/2Q==')
  })

  // The lists and createTransactionLink hand in nothing; queryTransactionLink hands in null
  // where the member shows no face.
  it('carries null where it is handed none', () => {
    expect(new TransactionLink(row()).senderAvatar).toBeNull()
    expect(new TransactionLink(row(), undefined, undefined, [], null).senderAvatar).toBeNull()
    expect(new TransactionLink(row(), undefined, undefined, [], null, null).senderAvatar).toBeNull()
  })
})
