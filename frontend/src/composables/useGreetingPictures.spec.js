// AI-GENERATED — not an architecture reference
import { describe, it, expect, afterEach, vi } from 'vitest'
import { thankYouGreetingPicture } from '@/graphql/queries'
import {
  awaitGreetingPicture,
  forgetAllGreetingPictures,
  greetingPicture,
  rememberGreetingPicture,
  requestGreetingPicture,
} from './useGreetingPictures'

/** A promise a test settles when it wants. */
const deferred = () => {
  const settle = {}
  const promise = new Promise((resolve, reject) => Object.assign(settle, { resolve, reject }))
  return { promise, ...settle }
}
const flush = () => new Promise((resolve) => setTimeout(resolve, 0))

/** An Apollo client that answers with what a test hands it, in the order it is asked. */
const clientWith = (...answers) => ({
  query: vi.fn(() => {
    const next = answers.shift()
    return next instanceof Promise ? next : Promise.resolve(next)
  }),
})
const served = (base64) => ({ data: { thankYouGreetingPicture: base64 } })

describe('useGreetingPictures', () => {
  afterEach(() => {
    forgetAllGreetingPictures()
  })

  it('knows nothing of a photo nobody has asked for', () => {
    expect(greetingPicture(4711)).toBeNull()
  })

  it('asks by the id of the link, past Apollo’s cache', async () => {
    const client = clientWith(served('SMALL'))

    requestGreetingPicture(client, 4711)
    await flush()

    expect(client.query).toHaveBeenCalledTimes(1)
    expect(client.query).toHaveBeenCalledWith({
      query: thankYouGreetingPicture,
      variables: { linkId: 4711 },
      // ⛔ A picture has no place in Apollo's cache.
      fetchPolicy: 'no-cache',
    })
  })

  it('is on its way until the answer is there, then an address an <img> can show', async () => {
    const answer = deferred()
    const client = clientWith(answer.promise)

    requestGreetingPicture(client, 4711)
    expect(greetingPicture(4711)).toEqual({ state: 'loading', src: null })

    answer.resolve(served('U01BTEw='))
    await flush()
    expect(greetingPicture(4711)).toEqual({
      state: 'ready',
      src: 'data:image/jpeg;base64,U01BTEw=',
    })
  })

  // Null is the server's answer for "not for you, not there, not any more".
  it('is missing where the server gives nothing, and is not asked for again', async () => {
    const client = clientWith(served(null))

    requestGreetingPicture(client, 4711)
    await flush()
    expect(greetingPicture(4711)).toEqual({ state: 'missing', src: null })

    requestGreetingPicture(client, 4711)
    await flush()
    expect(client.query).toHaveBeenCalledTimes(1)
  })

  // The line, not the picture.
  it('has failed where the line did, and is asked for again the next time', async () => {
    const client = clientWith(Promise.reject(new Error('Network error')), served('SMALL'))

    requestGreetingPicture(client, 4711)
    await flush()
    expect(greetingPicture(4711)).toEqual({ state: 'failed', src: null })

    requestGreetingPicture(client, 4711)
    await flush()
    expect(client.query).toHaveBeenCalledTimes(2)
    expect(greetingPicture(4711)?.state).toBe('ready')
  })

  it('asks once for a photo that is here or on its way', async () => {
    const answer = deferred()
    const client = clientWith(answer.promise)

    requestGreetingPicture(client, 4711)
    requestGreetingPicture(client, 4711)
    await flush()
    expect(client.query).toHaveBeenCalledTimes(1)

    answer.resolve(served('SMALL'))
    await flush()
    requestGreetingPicture(client, 4711)
    await flush()
    expect(client.query).toHaveBeenCalledTimes(1)
  })

  /** One at a time: each request begins when the one before has its answer. */
  it('asks for one photo at a time, in the order they were asked for', async () => {
    const first = deferred()
    const second = deferred()
    const client = clientWith(first.promise, second.promise, served('THIRD'))

    requestGreetingPicture(client, 1)
    requestGreetingPicture(client, 2)
    requestGreetingPicture(client, 3)
    await flush()
    expect(client.query.mock.calls.map(([asked]) => asked.variables.linkId)).toEqual([1])
    expect(greetingPicture(2)).toEqual({ state: 'loading', src: null })

    first.resolve(served('FIRST'))
    await flush()
    expect(client.query.mock.calls.map(([asked]) => asked.variables.linkId)).toEqual([1, 2])

    // A photo that fails does not hold up the ones behind it.
    second.reject(new Error('Network error'))
    await flush()
    expect(client.query.mock.calls.map(([asked]) => asked.variables.linkId)).toEqual([1, 2, 3])
    expect(greetingPicture(1)?.state).toBe('ready')
    expect(greetingPicture(2)?.state).toBe('failed')
    expect(greetingPicture(3)?.state).toBe('ready')
  })

  it.each([
    ['nothing', undefined],
    ['null', null],
    ['zero', 0],
    ['a negative number', -3],
    ['a fraction', 1.5],
    ['a text', '4711'],
  ])('asks nothing for %s in the place of an id', async (name, linkId) => {
    const client = clientWith(served('SMALL'))

    requestGreetingPicture(client, linkId)
    await flush()

    expect(client.query).not.toHaveBeenCalled()
    expect(greetingPicture(linkId)).toBeNull()
  })

  describe('one’s own photo, just sent', () => {
    it('is kept from what the wallet made, and the server is not asked for it', async () => {
      const client = clientWith(served('OTHER'))

      rememberGreetingPicture(4711, 'U01BTEw=')
      requestGreetingPicture(client, 4711)
      await flush()

      expect(greetingPicture(4711)).toEqual({
        state: 'ready',
        src: 'data:image/jpeg;base64,U01BTEw=',
      })
      expect(client.query).not.toHaveBeenCalled()
    })

    it('is not kept without an id, or without a picture', () => {
      rememberGreetingPicture(undefined, 'U01BTEw=')
      rememberGreetingPicture(4711, '')
      rememberGreetingPicture(4711, null)

      expect(greetingPicture(undefined)).toBeNull()
      expect(greetingPicture(4711)).toBeNull()
    })
  })

  /** ⛔ The next member to sign in on this browser must not be handed the photos of the one before. */
  describe('at logout', () => {
    it('lets every photo go', async () => {
      const client = clientWith(served('SMALL'))
      requestGreetingPicture(client, 4711)
      rememberGreetingPicture(4712, 'OWN')
      await flush()

      forgetAllGreetingPictures()

      expect(greetingPicture(4711)).toBeNull()
      expect(greetingPicture(4712)).toBeNull()
    })

    it('drops an answer that was still on its way', async () => {
      const answer = deferred()
      const client = clientWith(answer.promise)
      requestGreetingPicture(client, 4711)
      await flush()

      forgetAllGreetingPictures()
      answer.resolve(served('SMALL'))
      await flush()

      expect(greetingPicture(4711)).toBeNull()
    })

    it('does not ask for what still stood in line', async () => {
      const first = deferred()
      const client = clientWith(first.promise, served('SECOND'))
      requestGreetingPicture(client, 1)
      requestGreetingPicture(client, 2)
      await flush()

      forgetAllGreetingPictures()
      first.resolve(served('FIRST'))
      await flush()

      expect(client.query).toHaveBeenCalledTimes(1)
      expect(greetingPicture(2)).toBeNull()
    })

    // The next member's photos are asked for at once: the line of the one before is not theirs.
    it('asks for the next member’s photos without waiting for the one before', async () => {
      const stuck = deferred()
      const before = clientWith(stuck.promise)
      requestGreetingPicture(before, 1)
      await flush()

      forgetAllGreetingPictures()
      const next = clientWith(served('NEXT'))
      requestGreetingPicture(next, 9)
      await flush()

      expect(next.query).toHaveBeenCalledTimes(1)
      expect(greetingPicture(9)?.state).toBe('ready')
    })
  })

  /**
   * The sheet a greeting is printed on is drawn once and cannot take a photo in later: it waits
   * for what the list holds, or asks for it.
   */
  describe('for whatever has to wait for a photo', () => {
    it('hands over what is here already, without asking', async () => {
      const client = clientWith()
      rememberGreetingPicture(4711, 'SMALL')

      await expect(awaitGreetingPicture(client, 4711)).resolves.toEqual({
        state: 'ready',
        src: 'data:image/jpeg;base64,SMALL',
      })
      expect(client.query).not.toHaveBeenCalled()
    })

    it('asks for one nobody has asked for, and resolves once the answer is there', async () => {
      const answer = deferred()
      const client = clientWith(answer.promise)

      let known
      const waiting = awaitGreetingPicture(client, 4711).then((entry) => (known = entry))
      await flush()
      expect(client.query).toHaveBeenCalledTimes(1)
      expect(known).toBeUndefined()

      answer.resolve(served('ASKED'))
      await waiting
      expect(known).toEqual({ state: 'ready', src: 'data:image/jpeg;base64,ASKED' })
    })

    it('waits for one that is on its way, and does not ask a second time', async () => {
      const answer = deferred()
      const client = clientWith(answer.promise)
      requestGreetingPicture(client, 4711)

      const waiting = awaitGreetingPicture(client, 4711)
      answer.resolve(served('ON-ITS-WAY'))

      await expect(waiting).resolves.toEqual({
        state: 'ready',
        src: 'data:image/jpeg;base64,ON-ITS-WAY',
      })
      expect(client.query).toHaveBeenCalledTimes(1)
    })

    it('says so where the server has none, and where the line fails -- and never rejects', async () => {
      await expect(awaitGreetingPicture(clientWith(served(null)), 1)).resolves.toEqual({
        state: 'missing',
        src: null,
      })
      await expect(
        awaitGreetingPicture(clientWith(Promise.reject(new Error('Network'))), 2),
      ).resolves.toEqual({ state: 'failed', src: null })
    })

    it('knows nothing of a link that has no id', async () => {
      const client = clientWith()

      await expect(awaitGreetingPicture(client, null)).resolves.toBeNull()
      expect(client.query).not.toHaveBeenCalled()
    })
  })
})
