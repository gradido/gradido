// AI-GENERATED — not an architecture reference
import { getGmsMatchingVocabulary, postGmsMatchingVocabulary } from './GmsClient'
import { MatchingVocabulary } from './matchingVocabulary'

jest.mock('./GmsClient', () => ({
  getGmsMatchingVocabulary: jest.fn(),
  postGmsMatchingVocabulary: jest.fn(),
}))

const fetchPage = getGmsMatchingVocabulary as jest.Mock
const postWords = postGmsMatchingVocabulary as jest.Mock

/**
 * The list every keying call is built from, and the two questions it has to keep
 * apart: what the model should see, and what the GMS still has to be told.
 */
describe('the shared matching vocabulary, held locally', () => {
  beforeEach(() => {
    jest.resetAllMocks()
    postWords.mockResolvedValue(0)
  })

  describe('fetching', () => {
    it('walks every page', async () => {
      fetchPage
        .mockResolvedValueOnce({ words: [{ id: 1, word: 'fahrrad' }], hasMore: true })
        .mockResolvedValueOnce({ words: [{ id: 2, word: 'rasen' }], hasMore: false })

      const vocabulary = new MatchingVocabulary()
      await vocabulary.refresh('key')

      expect(vocabulary.current()).toEqual(['fahrrad', 'rasen'])
      expect(vocabulary.hasWholeList()).toBe(true)
    })

    // ⛔ From the beginning, not from where the last walk stopped. Postgres allocates
    // an identity value at INSERT and not at COMMIT, so a slow writer can hold ids
    // 500-600 while a fast one takes 601 and commits first. A cursor moved to 601
    // would never see those hundred words again - and they are exactly the words the
    // GMS's recount had just repaired into existence.
    it('starts from the beginning again on the next pass', async () => {
      fetchPage.mockResolvedValue({ words: [{ id: 700, word: 'fahrrad' }], hasMore: false })
      const vocabulary = new MatchingVocabulary()

      await vocabulary.refresh('key')
      await vocabulary.refresh('key')

      expect(fetchPage.mock.calls[0][1]).toBe(0)
      expect(fetchPage.mock.calls[1][1]).toBe(0)
    })

    it('does not claim the whole list when a page fails', async () => {
      fetchPage
        .mockResolvedValueOnce({ words: [{ id: 1, word: 'fahrrad' }], hasMore: true })
        .mockRejectedValueOnce(new Error('GMS unreachable'))

      const vocabulary = new MatchingVocabulary()
      await expect(vocabulary.refresh('key')).rejects.toThrow('GMS unreachable')

      // What arrived is kept - it is still true - but the caller must be able to tell
      // "half a list" from "the list", because keying against half of it coins
      // duplicates for the other half.
      expect(vocabulary.current()).toEqual(['fahrrad'])
      expect(vocabulary.hasWholeList()).toBe(false)
    })
  })

  describe('reporting what was coined', () => {
    it('sends the words and remembers that the GMS has them', async () => {
      const vocabulary = new MatchingVocabulary()

      await vocabulary.report('key', 'de', ['rasenluefter', 'rasen'])

      expect(postWords).toHaveBeenCalledWith('key', 'de', ['rasenluefter', 'rasen'])
      expect(vocabulary.current()).toEqual(['rasenluefter', 'rasen'])

      await vocabulary.report('key', 'de', ['rasenluefter'])
      expect(postWords).toHaveBeenCalledTimes(1)
    })

    it('does not send back a word the GMS handed us', async () => {
      fetchPage.mockResolvedValue({ words: [{ id: 1, word: 'fahrrad' }], hasMore: false })
      const vocabulary = new MatchingVocabulary()
      await vocabulary.refresh('key')

      await vocabulary.report('key', 'de', ['fahrrad'])

      expect(postWords).not.toHaveBeenCalled()
    })

    it('sends each word once even when ten entries of a batch share it', async () => {
      const vocabulary = new MatchingVocabulary()

      await vocabulary.report('key', 'de', ['fahrrad', 'fahrrad', 'reparatur', 'fahrrad'])

      expect(postWords).toHaveBeenCalledWith('key', 'de', ['fahrrad', 'reparatur'])
    })

    // ⛔ Two properties that pull in opposite directions, and both have to hold.
    describe('when the report does not get through', () => {
      it('still shows the words to the model', async () => {
        postWords.mockRejectedValue(new Error('GMS unreachable'))
        const vocabulary = new MatchingVocabulary()

        await expect(vocabulary.report('key', 'de', ['rasenluefter'])).rejects.toThrow()

        // The next batch of a backlog has to see what this one coined, or a thousand
        // entries coin the same word forty times - and that is true whether or not
        // the GMS answered.
        expect(vocabulary.current()).toEqual(['rasenluefter'])
      })

      it('offers them again on the next report', async () => {
        postWords.mockRejectedValueOnce(new Error('GMS unreachable')).mockResolvedValue(1)
        const vocabulary = new MatchingVocabulary()
        await expect(vocabulary.report('key', 'de', ['rasenluefter'])).rejects.toThrow()

        await vocabulary.report('key', 'de', ['rasenluefter'])

        // A failed report must not retire a word for the life of the process - it
        // would be missing from the shared vocabulary until a restart, and every
        // other community would go on coining their own word for the same thing.
        expect(postWords).toHaveBeenLastCalledWith('key', 'de', ['rasenluefter'])
      })
    })
  })
})
