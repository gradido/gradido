// AI-GENERATED — not an architecture reference
import { parse } from 'graphql'
import { newRequestBudget } from './context'
import { logPlugin } from './plugins'

/** What the request log writes at level info for one request, line by line. */
const summary = async ({
  document,
  variables = {},
  operationName = null,
  user,
  errors,
}: {
  document?: string
  variables?: Record<string, unknown>
  operationName?: string | null
  user?: { id: number }
  errors?: unknown[]
}): Promise<string[]> => {
  const logger = {
    info: jest.fn(),
    trace: jest.fn(),
    error: jest.fn(),
    isTraceEnabled: () => false,
  }
  const request = { query: document, variables, operationName }
  const hooks = await logPlugin.requestDidStart({ logger, request })
  await hooks.willSendResponse({
    request,
    operationName,
    // Apollo sets the operation once the document is parsed and validated.
    operation: document ? parse(document).definitions[0] : undefined,
    contextValue: { user },
    response: {
      body: { kind: 'single', singleResult: errors ? { errors } : { data: { x: true } } },
    },
  })
  return logger.info.mock.calls.map((args) => args.join(' '))
}

describe('the request log', () => {
  it('writes one line per request: the root fields, the member, the time, the outcome', async () => {
    const lines = await summary({
      document:
        'mutation ($email: String!, $password: String!) { login(email: $email, password: $password) { id } }',
      variables: { email: 'anna@example.org', password: 'Aa12345_' },
      user: { id: 101 },
    })
    expect(lines).toHaveLength(1)
    expect(lines[0]).toMatch(/^mutation login user=101 \d+ms ok$/)
  })

  // Neither the document nor the variables: what members write stays out of the log, whatever
  // the variable is called.
  it('writes neither the document nor its variables', async () => {
    const [line] = await summary({
      document:
        'mutation ($anyName: String!) { sendChatMessage(body: $anyName, inline: "Ottilie") { id } }',
      variables: { anyName: 'Meet me at ten' },
    })
    expect(line).not.toContain('Meet me')
    expect(line).not.toContain('Ottilie')
    expect(line).not.toContain('$anyName')
  })

  it('names every root field, an alias by the field it stands for', async () => {
    const [line] = await summary({
      document: 'query { a: balance { x } b: balance { x } transactionList { x } }',
    })
    expect(line).toMatch(/^query balance,balance,transactionList user=- /)
  })

  it('says where the answer carries errors', async () => {
    const [line] = await summary({
      document: 'query { balance { x } }',
      errors: [{ message: 'x' }],
    })
    expect(line).toMatch(/ errors$/)
  })

  // A document that does not parse has no operation; its errors are written at level error.
  it('writes the name the client gave where there is no operation', async () => {
    expect(await summary({ operationName: 'broken', errors: [{ message: 'x' }] })).toEqual([
      expect.stringMatching(/^broken user=- \d+ms errors$/),
    ])
    expect(await summary({ errors: [{ message: 'x' }] })).toEqual([
      expect.stringMatching(/^\(no operation\) user=- /),
    ])
  })

  it('writes nothing for an introspection query', async () => {
    expect(
      await summary({
        document: 'query IntrospectionQuery { __schema { x } }',
        operationName: 'IntrospectionQuery',
      }),
    ).toEqual([])
  })
})

const ROOM = 'https://meet.example.org/k7m2x9q4t8wz'

/** What the request log writes at level error when it sends an answer with these errors. */
const errorsLogged = async (errors: unknown[]): Promise<string> => {
  const logger = { info: jest.fn(), trace: jest.fn(), error: jest.fn() }
  const hooks = await logPlugin.requestDidStart({
    logger,
    request: { query: 'mutation { x }', variables: {}, operationName: null },
  })
  await hooks.willSendResponse({
    request: { operationName: null },
    contextValue: {},
    response: { body: { kind: 'single', singleResult: { errors } } },
  })
  return logger.error.mock.calls.map((args) => args.join(' ')).join('\n')
}

describe('the errors in the request log', () => {
  // A failed check keeps the value it refused -- the whole picture where its width is out of
  // bounds, however small the picture (coderabbit on #4001).
  it('writes no value a check refused, however short', async () => {
    const text = await errorsLogged([
      {
        message: 'Argument Validation Error',
        extensions: {
          code: 'BAD_USER_INPUT',
          validationErrors: [
            {
              property: 'image',
              value: { data: 'SHORTPICTURE', width: 0, height: 600 },
              children: [
                {
                  property: 'width',
                  value: 0,
                  constraints: { min: 'width must not be less than 1' },
                },
              ],
            },
          ],
        },
      },
    ])
    expect(text).not.toContain('SHORTPICTURE')
    expect(text).toContain('"value": "***"')
    // What was refused, and why, is still there to read.
    expect(text).toContain('"property": "width"')
    expect(text).toContain('"min": "width must not be less than 1"')
    expect(text).toContain('"message": "Argument Validation Error"')
  })

  // graphql-js prints a variable of the wrong type into its message, and quotes it in the reason.
  it('writes no value graphql-js quotes of an invalid variable', async () => {
    const text = await errorsLogged([
      {
        message:
          'Variable "$image" got invalid value { data: "SHORTPICTURE", width: "x" } at "image.width"; Int cannot represent non-integer value: "x"',
      },
    ])
    expect(text).not.toContain('SHORTPICTURE')
    expect(text).toContain('"message": "Variable \\"$image\\" got invalid value ***"')
  })

  it('writes any other long string as its length only', async () => {
    const long = 'A'.repeat(5000)
    const text = await errorsLogged([
      { message: 'Something failed', extensions: { exception: { detail: long } } },
    ])
    expect(text).not.toContain(long)
    expect(text).toContain('"detail": "*** 5000 characters"')
    expect(text).toContain('"message": "Something failed"')
  })

  it('writes an ordinary error as before', async () => {
    const text = await errorsLogged([{ message: 'CHAT_IMAGE_NOT_ACCEPTED: TOO_LARGE' }])
    expect(text).toContain('"message": "CHAT_IMAGE_NOT_ACCEPTED: TOO_LARGE"')
  })
})

/** What the request log writes at level trace when it sends the answer of a request. */
const answerTraced = async (context: Record<string, unknown>, data: unknown): Promise<string> => {
  const logger = {
    debug: jest.fn(),
    info: jest.fn(),
    trace: jest.fn(),
    error: jest.fn(),
    isTraceEnabled: () => true,
  }
  const hooks = await logPlugin.requestDidStart({
    logger,
    request: { query: 'query { x }', variables: {}, operationName: null },
  })
  await hooks.willSendResponse({
    request: { operationName: null },
    contextValue: context,
    response: { body: { kind: 'single', singleResult: { data } } },
  })
  return logger.trace.mock.calls.map((args) => args.join(' ')).join('\n')
}

describe('the answer in the request log', () => {
  it('is left out where the request was handed a video room', async () => {
    const traced = await answerTraced(
      { requestBudget: { ...newRequestBudget(), chatVideoRoomsServed: 1 } },
      { room0: { url: ROOM, host: 'meet.example.org', operator: null } },
    )
    expect(traced).not.toContain('k7m2x9q4t8wz')
    expect(traced).toBe('Response-Data: left out, it holds a video room')
  })

  it('is left out where the request was handed a picture of a chat message', async () => {
    const picture = Buffer.from('a private picture of Anna and Ben').toString('base64')
    const traced = await answerTraced(
      { requestBudget: { ...newRequestBudget(), chatImagesServed: 1 } },
      { chatMessageImage: picture },
    )
    expect(traced).not.toContain(picture)
    expect(traced).toBe('Response-Data: left out, it holds a picture')
  })

  it('is left out where the request was handed the picture of a thank-you greeting', async () => {
    const picture = Buffer.from('a private photo of Oma Emma').toString('base64')
    const traced = await answerTraced(
      { requestBudget: { ...newRequestBudget(), thankYouGreetingPicturesServed: 1 } },
      { thankYouGreetingPicture: picture },
    )
    expect(traced).not.toContain(picture)
    expect(traced).toBe('Response-Data: left out, it holds a picture')
  })

  // The budget as thankYouGreetingPicture leaves it where the large rendition was asked for
  // (TransactionLinkResolver): counted as three, and once as a large one.
  it('is left out where the request was handed the large rendition of such a picture', async () => {
    const picture = Buffer.from('a private photo of Oma Emma, at its full size').toString('base64')
    const traced = await answerTraced(
      {
        requestBudget: {
          ...newRequestBudget(),
          thankYouGreetingPicturesServed: 3,
          thankYouGreetingLargePicturesServed: 1,
        },
      },
      { large: picture },
    )
    expect(traced).not.toContain(picture)
    expect(traced).toBe('Response-Data: left out, it holds a picture')
  })

  it('is left out where the request was handed the photo of a transfer', async () => {
    const picture = Buffer.from('a private photo of the bench Dave built').toString('base64')
    const traced = await answerTraced(
      { requestBudget: { ...newRequestBudget(), transactionPicturesServed: 1 } },
      { transactionPicture: picture },
    )
    expect(traced).not.toContain(picture)
    expect(traced).toBe('Response-Data: left out, it holds a picture')
  })

  // The budget as queryTransactionLink leaves it where it looked up the face of the member who
  // made an open link -- the answer holds the link's code next to the face.
  it('is left out where the request looked up the face of the member who made a link', async () => {
    const picture = Buffer.from('the face of Bibi, on the page of her link').toString('base64')
    const traced = await answerTraced(
      { requestBudget: { ...newRequestBudget(), senderAvatarsServed: 1 } },
      { queryTransactionLink: { code: 'a1b2c3d4e5f6a1b2c3d4e5f6', senderAvatar: picture } },
    )
    expect(traced).not.toContain(picture)
    expect(traced).not.toContain('a1b2c3d4e5f6a1b2c3d4e5f6')
    expect(traced).toBe('Response-Data: left out, it holds a picture')
  })

  it("is left out where the request read a member's own note", async () => {
    const traced = await answerTraced(
      { requestBudget: { ...newRequestBudget(), userNotesServed: 1 } },
      { userNote: 'Anna Sonnenberg, Imkerin aus Pankow' },
    )
    expect(traced).not.toContain('Sonnenberg')
    expect(traced).toBe('Response-Data: left out, it holds a note')
  })

  // WHO a member keeps a picture of is theirs alone as well, not only the picture: the list names
  // the people next to their pictures.
  it("is left out where the request read a member's own pictures of their contacts", async () => {
    const picture = Buffer.from("Lena's picture of Anna, taken at the market").toString('base64')
    const traced = await answerTraced(
      { requestBudget: { ...newRequestBudget(), keptPicturesServed: 10 } },
      {
        keptPictures: [
          { communityUuid: 'home-uuid', gradidoID: 'aaaaaaaa-anna-gradido-id', picture },
        ],
      },
    )
    expect(traced).not.toContain(picture)
    expect(traced).not.toContain('aaaaaaaa-anna-gradido-id')
    expect(traced).toBe('Response-Data: left out, it holds a picture')
  })

  // A profile picture is a face, whoever's it is: the member's own (avatar, avatarFull) and those
  // of other members (memberAvatars), counted in their own budget entry.
  it('is left out where the request was handed a profile picture', async () => {
    const picture = Buffer.from('the face of Anna, as she chose it').toString('base64')
    const traced = await answerTraced(
      { requestBudget: { ...newRequestBudget(), profilePicturesServed: 1 } },
      { memberAvatars: [{ gradidoID: 'aaaaaaaa-anna-gradido-id', avatar: picture }] },
    )
    expect(traced).not.toContain(picture)
    expect(traced).toBe('Response-Data: left out, it holds a picture')
  })

  // memberAvatarFull counts in the budget that caps it.
  it('is left out where the request was handed the full size of a member picture', async () => {
    const picture = Buffer.from('the face of Anna, at its full size').toString('base64')
    const traced = await answerTraced(
      { requestBudget: { ...newRequestBudget(), memberAvatarsFullServed: 1 } },
      { memberAvatarFull: picture },
    )
    expect(traced).not.toContain(picture)
    expect(traced).toBe('Response-Data: left out, it holds a picture')
  })

  it("is left out where the request read or wrote the moderation's remark on a member", async () => {
    const traced = await answerTraced(
      { requestBudget: { ...newRequestBudget(), userRemarksServed: 1 } },
      { userRemark: { remark: 'Bürgermeisterin von Lieblingsstadt' } },
    )
    expect(traced).not.toContain('Lieblingsstadt')
    expect(traced).toBe('Response-Data: left out, it holds a remark')
  })

  it("is left out where the request read a member's support request or its thread", async () => {
    const traced = await answerTraced(
      { requestBudget: { ...newRequestBudget(), supportTicketReadsServed: 1 } },
      { listSupportTickets: { tickets: [{ text: 'Meine Tochter heisst Ramona' }] } },
    )
    expect(traced).not.toContain('Ramona')
    expect(traced).toBe('Response-Data: left out, it holds a support request')
  })

  it('is left out where the request wrote in the support', async () => {
    const traced = await answerTraced(
      { requestBudget: { ...newRequestBudget(), supportTicketWritesServed: 1 } },
      { createSupportTicketMessage: { message: 'Meine Tochter heisst Ramona' } },
    )
    expect(traced).not.toContain('Ramona')
    expect(traced).toBe('Response-Data: left out, it holds a support request')
  })

  it('is written where the request was handed no picture of any kind', async () => {
    const traced = await answerTraced({ requestBudget: newRequestBudget() }, { sendCoins: true })
    expect(traced).toContain('"sendCoins": true')
  })

  // The same name comes back in the answers that carry a greeting -- the new link, the link
  // somebody opens, the sender's list, and the booking list with the booking made from the link.
  it('carries no name a thank-you greeting is for, wherever the answer holds one', async () => {
    const greeting = { motif: 'bouquet', line: 'Danke!', recipientName: 'Sarah Wintergrün' }
    const traced = await answerTraced(
      { requestBudget: newRequestBudget() },
      {
        createTransactionLink: { link: 'https://x/redeem/abc', greeting },
        listTransactionLinks: {
          links: [
            { id: 1, greeting },
            { id: 2, greeting: null },
          ],
        },
        transactionList: {
          transactions: [
            { id: 3, greeting },
            { id: 4, greeting: null },
          ],
        },
      },
    )
    expect(traced).not.toContain('Wintergrün')
    expect(traced.match(/"recipientName": "\*\*\*"/g)).toHaveLength(3)
    expect(traced).toContain('"motif": "bouquet"')
    expect(traced).toContain('"greeting": null')
  })

  it('is written at level trace for every other request, as before', async () => {
    const traced = await answerTraced(
      { requestBudget: newRequestBudget() },
      { contactList: { contactCount: 3 } },
    )
    expect(traced).toContain('"contactCount": 3')
  })

  it('is not even formatted while level trace is off', async () => {
    const logger = {
      debug: jest.fn(),
      info: jest.fn(),
      trace: jest.fn(),
      error: jest.fn(),
      isTraceEnabled: () => false,
    }
    const hooks = await logPlugin.requestDidStart({
      logger,
      request: { query: 'query { x }', variables: {}, operationName: null },
    })
    const stringify = jest.spyOn(JSON, 'stringify')
    try {
      await hooks.willSendResponse({
        request: { operationName: null },
        contextValue: { requestBudget: newRequestBudget() },
        response: {
          body: { kind: 'single', singleResult: { data: { contactList: { contactCount: 3 } } } },
        },
      })
      expect(stringify).not.toHaveBeenCalled()
      expect(logger.trace).not.toHaveBeenCalled()
      // The rest of the log goes on as before.
      expect(logger.info).toHaveBeenCalledTimes(1)
    } finally {
      stringify.mockRestore()
    }
  })
})
