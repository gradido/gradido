// AI-GENERATED — not an architecture reference
import { User as DbUser } from 'database'
import { getLogger } from 'log4js'
import { CounterpartyLookups, remoteUserFromBooking } from './counterparty'

const logger = getLogger('counterparty.test')

// Nothing stored for the pair: the model is built from the booking alone. That is the
// path the NU-019 guard lives on, and the one no other test walks.
const nothingStored: CounterpartyLookups = {
  findForeignUser: async () => null,
  communityName: async () => 'Gradido Provence',
}

const booking = (linkedUserName: string | null) => ({
  linkedUserCommunityUuid: '99999999-9999-9999-9999-999999999999',
  linkedUserGradidoID: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
  linkedUserName,
})

describe('remoteUserFromBooking', () => {
  it('names the member by the stored name when it can be an alias', async () => {
    const user = await remoteUserFromBooking(booking('SarahP'), logger, 'test', nothingStored)
    expect(user.alias).toBe('SarahP')
    expect(user.gradidoID).toBe('dddddddd-dddd-dddd-dddd-dddddddddddd')
    expect(user.communityUuid).toBe('99999999-9999-9999-9999-999999999999')
    expect(user.communityName).toBe('Gradido Provence')
  })

  it('keeps a stored real name out of the alias (NU-019), and leaves the split as it was', async () => {
    const user = await remoteUserFromBooking(booking('Anna Müller'), logger, 'test', nothingStored)
    expect(user.alias).toBeUndefined()
    // Still fed, for the moderation, behind the field resolver's guard.
    expect(user.firstName).toBe('Anna')
    expect(user.lastName).toBe(' Müller')
  })

  it('names nobody when the booking carries no name', async () => {
    const user = await remoteUserFromBooking(booking(null), logger, 'test', nothingStored)
    expect(user.alias).toBeUndefined()
    expect(user.firstName).toBeUndefined()
  })

  it('prefers the row the federation stored', async () => {
    const stored = {
      id: 42,
      gradidoID: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
      communityUuid: '99999999-9999-9999-9999-999999999999',
      alias: 'sarah-stored',
      firstName: 'Sarah',
      lastName: 'Provence',
      foreign: true,
    }
    const user = await remoteUserFromBooking(booking('Anna Müller'), logger, 'test', {
      findForeignUser: async () => stored as unknown as DbUser,
      communityName: async () => 'Gradido Provence',
    })
    expect(user.alias).toBe('sarah-stored')
    expect(user.firstName).toBe('Sarah')
  })

  it("refuses a booking without a gradido id -- that is the caller's mistake", async () => {
    await expect(
      remoteUserFromBooking(
        { ...booking('SarahP'), linkedUserGradidoID: null },
        logger,
        'test',
        nothingStored,
      ),
    ).rejects.toThrow('remoteUserFromBooking: booking without a counterparty gradido id')
  })
})
