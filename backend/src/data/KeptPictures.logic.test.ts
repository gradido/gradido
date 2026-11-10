// AI-GENERATED — not an architecture reference
import { keptPictureSubjectOf } from './KeptPictures.logic'

describe('keptPictureSubjectOf', () => {
  // One person is one row, however a client spells the uuids: a member of a chat group may come
  // in capitals, a booking row in lower case.
  it('names the person in lower case, as the rows keep them', () => {
    expect(
      keptPictureSubjectOf('AAAAAAAA-aaaa-4aaa-8AAA-aaaaaaaaaaaa', 'HOME-1111-4111-8111-COMMUNITY'),
    ).toEqual({
      communityUuid: 'home-1111-4111-8111-community',
      gradidoId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    })
  })
})
