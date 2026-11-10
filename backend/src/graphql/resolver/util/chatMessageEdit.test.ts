// AI-GENERATED — not an architecture reference

// The other community is a client whose answer each test says, and the community lookup is a
// fake: the subject is whom this function asks, what it sends and what it takes for a change.
const mockEditChatMessage = jest.fn()
const mockGetClient = jest.fn()
const mockFindCommunity = jest.fn()

jest.mock('core', () => ({
  ApiClientCache: { getInstance: () => ({ get: mockGetClient }) },
}))
jest.mock('database', () => ({
  dbFindAuthenticatedForeignCommunityByIdentifier: mockFindCommunity,
}))

const HOME = '11111111-1111-4111-8111-111111111111'
const PEER = '22222222-2222-4222-8222-222222222222'
const ANNA = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const MESSAGE = '40000000-0000-4000-8000-000000000001'
const NEW_TEXT = 'Der Hofflohmarkt ist am Samstag ab 10 Uhr.'
const PEER_ROW = { communityUuid: PEER }
const writer = { communityUuid: HOME, gradidoId: ANNA }

let carryChatMessageEditAcrossBorder: typeof import('./chatMessageEdit').carryChatMessageEditAcrossBorder

beforeAll(async () => {
  ;({ carryChatMessageEditAcrossBorder } = await import('./chatMessageEdit'))
})

beforeEach(() => {
  jest.resetAllMocks()
  mockFindCommunity.mockResolvedValue(PEER_ROW)
  mockGetClient.mockReturnValue({ editChatMessage: mockEditChatMessage })
  mockEditChatMessage.mockResolvedValue({ data: true, error: null })
})

const carry = () =>
  carryChatMessageEditAcrossBorder({
    writer,
    otherCommunityUuid: PEER,
    messageUuid: MESSAGE,
    body: NEW_TEXT,
  })

describe('carryChatMessageEditAcrossBorder (E-060)', () => {
  it('sends the writer, the message and the text to the other community', async () => {
    expect(await carry()).toEqual({ success: true })
    expect(mockFindCommunity).toHaveBeenCalledWith(PEER)
    expect(mockGetClient).toHaveBeenCalledWith(PEER_ROW)
    expect(mockEditChatMessage).toHaveBeenCalledWith({
      writer,
      messageUuid: MESSAGE,
      body: NEW_TEXT,
    })
  })

  // A server from before the route answers 404; the caller then leaves its own copy as it is.
  it('hands on the status and what the other server said where it did not change its copy', async () => {
    mockEditChatMessage.mockResolvedValue({
      data: null,
      error: { status: 404, value: 'NOT_FOUND' },
    })
    expect(await carry()).toEqual({
      success: false,
      error: { reason: 'NOT_CONFIRMED', detail: '404: NOT_FOUND' },
    })
  })

  it('finds no way to a community not authenticated here, and sends nothing', async () => {
    mockFindCommunity.mockResolvedValue(null)
    expect(await carry()).toEqual({
      success: false,
      error: { reason: 'NO_WAY_TO_DELIVER', detail: PEER },
    })
    expect(mockEditChatMessage).not.toHaveBeenCalled()
  })
})
