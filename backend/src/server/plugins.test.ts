// AI-GENERATED — not an architecture reference
import { inspect } from 'node:util'
import { newRequestBudget } from './context'
import { logPlugin } from './plugins'

/**
 * Everything the request log hands the logger when a request starts, written out as the log
 * would write it: strings as they are, objects through inspect.
 */
const logged = (
  variables: Record<string, unknown>,
  query = 'mutation ($x: String!) { x(y: $x) }',
): string => {
  const logger = { debug: jest.fn(), info: jest.fn() }
  logPlugin.requestDidStart({
    logger,
    request: { query, variables, operationName: null },
  })
  return [...logger.debug.mock.calls, ...logger.info.mock.calls]
    .map((args) =>
      args
        .map((arg: unknown) => (typeof arg === 'string' ? arg : inspect(arg, { depth: 5 })))
        .join(' '),
    )
    .join('\n')
}

const ROOM = 'https://meet.example.org/k7m2x9q4t8wz'

describe('the request log', () => {
  it('writes no chat message -- the text may hold the address of a video room', () => {
    const text = logged({
      ref: { communityUuid: 'c', gradidoID: 'g' },
      body: `Video call: ${ROOM}`,
      notify: 'EMAIL',
    })
    expect(text).not.toContain('k7m2x9q4t8wz')
    expect(text).toContain('"body": "***"')
    // The rest of the request is still there to read.
    expect(text).toContain('"notify": "EMAIL"')
  })

  it("writes no letter's subject", () => {
    const text = logged({
      recipientIdentifier: 'g',
      subject: 'About Saturday',
      memo: 'Shall we meet at ten?',
    })
    expect(text).not.toContain('About Saturday')
    expect(text).toContain('"subject": "***"')
  })

  // P7: one member's picture for another -- and some 80,000 characters in every line that carried
  // it. What is left of it is its size.
  it('writes no picture of a chat message, only its size', () => {
    const picture = Buffer.from('a private picture of Anna and Ben').toString('base64')
    const text = logged({
      ref: { communityUuid: 'c', gradidoID: 'g' },
      body: '',
      notify: 'NONE',
      image: { data: picture, width: 800, height: 600 },
    })
    expect(text).not.toContain(picture)
    expect(text).toContain('"data": "***"')
    expect(text).toContain('"width": 800')
  })

  it('writes no avatar picture either', () => {
    const small = Buffer.from('the small face of Anna').toString('base64')
    const full = Buffer.from('the large face of Anna').toString('base64')
    const text = logged({ avatarSmall: small, avatarFull: full })
    expect(text).not.toContain(small)
    expect(text).not.toContain(full)
    expect(text).toContain('"avatarSmall": "***"')
    expect(text).toContain('"avatarFull": "***"')
  })

  // ⛔ The log masks a copy. The request goes on to the resolver with the picture in it -- a mask
  // on the request itself would hand the resolver three stars for a picture.
  it('leaves the picture in the request itself', () => {
    const variables = { image: { data: 'AAAA', width: 1, height: 1 } }
    logged(variables)
    expect(variables.image.data).toBe('AAAA')
  })

  it('writes no password and no table code, as before', () => {
    const text = logged({
      password: 'Aa12345_',
      passwordNew: 'Bb12345_',
      presenceCode: '1790000000.c2lnbmF0dXJl',
    })
    for (const secret of ['Aa12345_', 'Bb12345_', 'c2lnbmF0dXJl']) {
      expect(text).not.toContain(secret)
    }
  })

  // coderabbit on #4001: a client of its own may write a value into the document itself instead
  // of into a variable, where filterVariables never sees it.
  it('writes no string the document itself carries -- a picture, a text, a password', () => {
    const picture = Buffer.from('a private picture of Anna and Ben').toString('base64')
    const text = logged(
      {},
      `mutation {
  sendChatMessage(ref: { communityUuid: "c", gradidoID: "g" }, body: "Meet \\"Ottilie\\" Tomorrow", notify: EMAIL, image: { data: "${picture}", width: 800, height: 600 }) { id }
  sendEmail(recipientIdentifier: "g", subject: """About
Saturday""", memo: "m")
  login(email: "anna@example.org", password: "Aa12345_") { id }
}`,
    )
    for (const secret of [
      picture,
      'Meet',
      'Ottilie',
      'Tomorrow',
      'Saturday',
      'anna@example.org',
      'Aa12345_',
    ]) {
      expect(text).not.toContain(secret)
    }
    // What the request asked for stays readable.
    expect(text).toContain('sendChatMessage(ref: { communityUuid: "***", gradidoID: "***" }')
    expect(text).toContain('image: { data: "***", width: 800, height: 600 }')
    expect(text).toContain('subject: "***", memo: "***"')
  })

  it('writes a document without strings as it is', () => {
    const text = logged(
      {},
      'query ($ref: MemberAvatarRefInput!) { chatMessagesWithMember(ref: $ref) { hasMore } }',
    )
    expect(text).toContain(
      'query ($ref: MemberAvatarRefInput!) { chatMessagesWithMember(ref: $ref) { hasMore } }',
    )
  })
})

/** What the request log writes at level error when it sends an answer with these errors. */
const errorsLogged = (errors: unknown[]): string => {
  const logger = { debug: jest.fn(), info: jest.fn(), trace: jest.fn(), error: jest.fn() }
  const hooks = logPlugin.requestDidStart({
    logger,
    request: { query: 'mutation { x }', variables: {}, operationName: null },
  })
  hooks.willSendResponse({ context: {}, response: { errors } })
  return logger.error.mock.calls.map((args) => args.join(' ')).join('\n')
}

describe('the errors in the request log', () => {
  // An error quotes back what the request carried: class-validator keeps the value it refused --
  // the whole picture where its width is out of bounds --, and graphql-js prints a variable of
  // the wrong type into its message.
  it('writes a long string an error quotes back as its length only', () => {
    const picture = 'A'.repeat(5000)
    const coercion = `Variable "$image" got invalid value { data: "${picture}", width: "x" }`
    const text = errorsLogged([
      {
        message: 'Argument Validation Error',
        extensions: {
          code: 'INTERNAL_SERVER_ERROR',
          exception: {
            validationErrors: [
              {
                property: 'image',
                value: { data: picture, width: 0, height: 600 },
                children: [{ property: 'width', value: 0, constraints: { min: 'too small' } }],
              },
            ],
          },
        },
      },
      { message: coercion },
    ])
    expect(text).not.toContain(picture)
    expect(text).toContain('"data": "*** 5000 characters"')
    expect(text).toContain(`"message": "*** ${coercion.length} characters"`)
    // The rest of the error is still there to read.
    expect(text).toContain('"message": "Argument Validation Error"')
    expect(text).toContain('"width": 0')
  })

  it('writes an ordinary error as before', () => {
    const text = errorsLogged([{ message: 'CHAT_IMAGE_NOT_ACCEPTED: TOO_LARGE' }])
    expect(text).toContain('"message": "CHAT_IMAGE_NOT_ACCEPTED: TOO_LARGE"')
  })
})

/** What the request log writes at level trace when it sends the answer of a request. */
const answerTraced = (context: Record<string, unknown>, data: unknown): string => {
  const logger = { debug: jest.fn(), info: jest.fn(), trace: jest.fn(), error: jest.fn() }
  const hooks = logPlugin.requestDidStart({
    logger,
    request: { query: 'query { x }', variables: {}, operationName: null },
  })
  hooks.willSendResponse({ context, response: { data } })
  return logger.trace.mock.calls.map((args) => args.join(' ')).join('\n')
}

describe('the answer in the request log', () => {
  it('is left out where the request was handed a video room', () => {
    const traced = answerTraced(
      { requestBudget: { ...newRequestBudget(), chatVideoRoomsServed: 1 } },
      { room0: { url: ROOM, host: 'meet.example.org', operator: null } },
    )
    expect(traced).not.toContain('k7m2x9q4t8wz')
    expect(traced).toBe('Response-Data: left out, it holds a video room')
  })

  it('is left out where the request was handed a picture of a chat message', () => {
    const picture = Buffer.from('a private picture of Anna and Ben').toString('base64')
    const traced = answerTraced(
      { requestBudget: { ...newRequestBudget(), chatImagesServed: 1 } },
      { chatMessageImage: picture },
    )
    expect(traced).not.toContain(picture)
    expect(traced).toBe('Response-Data: left out, it holds a picture')
  })

  it('is written at level trace for every other request, as before', () => {
    const traced = answerTraced(
      { requestBudget: newRequestBudget() },
      { contactList: { contactCount: 3 } },
    )
    expect(traced).toContain('"contactCount": 3')
  })
})
