// AI-GENERATED — not an architecture reference
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  thankYouGreetingPicture,
  transactionPicture as transactionPictureQuery,
} from '@/graphql/queries'
import {
  forgetAllGreetingPictures,
  greetingPicture,
  rememberGreetingPicture,
  requestGreetingPicture,
} from './useGreetingPictures'
import {
  forgetAllTransactionPictures,
  requestTransactionPicture,
  transactionPicture,
} from './useTransactionPictures'

/**
 * The photos sent with transfers, kept by the id of the BOOKING -- beside the photos of
 * thank-you greetings, which are kept by the id of their LINK. Two ranges of numbers: what is
 * kept under the one is never found under the other.
 */
const clientAnswering = (answer) => ({ query: vi.fn(async () => answer) })
const settled = () => new Promise((resolve) => setTimeout(resolve))

describe('useTransactionPictures', () => {
  afterEach(() => {
    forgetAllTransactionPictures()
    forgetAllGreetingPictures()
  })

  it('asks by the id of the booking, with the query of its own, and never into Apollo’s cache', async () => {
    const client = clientAnswering({ data: { transactionPicture: 'QUJD' } })

    requestTransactionPicture(client, 4711)
    await settled()

    expect(client.query).toHaveBeenCalledTimes(1)
    expect(client.query).toHaveBeenCalledWith({
      query: transactionPictureQuery,
      variables: { transactionId: 4711 },
      fetchPolicy: 'no-cache',
    })
    expect(transactionPicture(4711)).toEqual({
      state: 'ready',
      src: 'data:image/jpeg;base64,QUJD',
    })
  })

  it('asks once for a booking, however often its place is drawn', async () => {
    const client = clientAnswering({ data: { transactionPicture: 'QUJD' } })

    requestTransactionPicture(client, 4711)
    requestTransactionPicture(client, 4711)
    await settled()
    requestTransactionPicture(client, 4711)
    await settled()

    expect(client.query).toHaveBeenCalledTimes(1)
  })

  it('marks a booking the server says nothing about as missing, and does not ask again', async () => {
    const client = clientAnswering({ data: { transactionPicture: null } })

    requestTransactionPicture(client, 12)
    await settled()
    requestTransactionPicture(client, 12)
    await settled()

    expect(transactionPicture(12)).toEqual({ state: 'missing', src: null })
    expect(client.query).toHaveBeenCalledTimes(1)
  })

  it('asks for nothing with a number that is no id', async () => {
    const client = clientAnswering({ data: { transactionPicture: 'QUJD' } })

    for (const id of [null, undefined, 0, -1, 1.5, '7']) requestTransactionPicture(client, id)
    await settled()

    expect(client.query).not.toHaveBeenCalled()
  })

  // ⛔ The id of a link and the id of a booking are two ranges of numbers.
  describe('beside the photos of greetings', () => {
    it('does not find under a booking’s id what is kept under the same number as a link’s', () => {
      rememberGreetingPicture(4711, 'R1JFRVRJTkc=')

      expect(greetingPicture(4711)?.state).toBe('ready')
      expect(transactionPicture(4711)).toBeNull()
    })

    it('does not find under a link’s id what was fetched under the same number as a booking’s', async () => {
      requestTransactionPicture(clientAnswering({ data: { transactionPicture: 'QUJD' } }), 4711)
      await settled()

      expect(transactionPicture(4711)?.state).toBe('ready')
      expect(greetingPicture(4711)).toBeNull()
    })

    it('asks each kind with its own query, for the same number', async () => {
      const client = { query: vi.fn(async () => ({ data: {} })) }

      requestTransactionPicture(client, 4711)
      requestGreetingPicture(client, 4711)
      await settled()

      expect(client.query.mock.calls.map(([asked]) => asked.query)).toEqual(
        expect.arrayContaining([transactionPictureQuery, thankYouGreetingPicture]),
      )
      expect(client.query.mock.calls.map(([asked]) => asked.variables)).toEqual(
        expect.arrayContaining([{ transactionId: 4711 }, { linkId: 4711 }]),
      )
    })

    it('lets go of its own photos alone', async () => {
      rememberGreetingPicture(9, 'R1JFRVRJTkc=')
      requestTransactionPicture(clientAnswering({ data: { transactionPicture: 'QUJD' } }), 9)
      await settled()

      forgetAllTransactionPictures()

      expect(transactionPicture(9)).toBeNull()
      expect(greetingPicture(9)?.state).toBe('ready')
    })
  })

  describe('when the member signs out', () => {
    it('lets every photo go', async () => {
      requestTransactionPicture(clientAnswering({ data: { transactionPicture: 'QUJD' } }), 4711)
      await settled()

      forgetAllTransactionPictures()

      expect(transactionPicture(4711)).toBeNull()
    })

    it('drops an answer that lands afterwards: it is not handed to the next member', async () => {
      let answer
      const client = { query: vi.fn(() => new Promise((resolve) => (answer = resolve))) }
      requestTransactionPicture(client, 4711)
      await settled()

      forgetAllTransactionPictures()
      answer({ data: { transactionPicture: 'QUJD' } })
      await settled()

      expect(transactionPicture(4711)).toBeNull()
    })
  })
})
