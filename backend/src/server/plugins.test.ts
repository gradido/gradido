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

  // P5: the name of a group can say who is in it -- and the text of its messages is a `body`.
  it("writes no chat group's name", () => {
    const text = logged({
      title: 'Selbsthilfe Trauer Amstetten',
      members: [{ communityUuid: 'c', gradidoID: 'g' }],
    })
    expect(text).not.toContain('Trauer')
    expect(text).toContain('"title": "***"')
    expect(text).toContain('"gradidoID": "g"')
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
  // A thank-you greeting names whom it is for: somebody who has no account here and was never
  // asked. The motif and the line stay -- the line is the beginning of the memo anyway.
  it('writes no name a thank-you greeting is for', () => {
    const text = logged({
      amount: '20',
      memo: 'Einfach so — weil es Dich gibt.',
      greeting: { motif: 'morning-light', line: 'Einfach so', recipientName: 'Sarah Wintergrün' },
    })
    expect(text).not.toContain('Wintergrün')
    expect(text).toContain('"recipientName": "***"')
    expect(text).toContain('"motif": "morning-light"')
    expect(text).toContain('"amount": "20"')
  })

  // The picture of a greeting that carries a photo of the member's own: the small rendition comes
  // inside the greeting, the large one in a request of its own.
  it('writes no picture of a thank-you greeting, in either rendition, only its size', () => {
    const small = Buffer.from('a private photo of Oma Emma, small').toString('base64')
    const large = Buffer.from('a private photo of Oma Emma, large').toString('base64')
    const withTheLink = logged({
      amount: '20',
      memo: 'Einfach so',
      greeting: {
        picture: { data: small, width: 831, height: 577 },
        line: 'Einfach so',
        recipientName: 'Sarah Wintergrün',
      },
    })
    expect(withTheLink).not.toContain(small)
    expect(withTheLink).not.toContain('Wintergrün')
    expect(withTheLink).toContain('"data": "***"')
    expect(withTheLink).toContain('"width": 831')
    expect(withTheLink).toContain('"height": 577')
    expect(withTheLink).toContain('"line": "Einfach so"')

    const afterTheLink = logged({ linkId: 7, picture: { data: large, width: 1080, height: 750 } })
    expect(afterTheLink).not.toContain(large)
    expect(afterTheLink).toContain('"data": "***"')
    expect(afterTheLink).toContain('"width": 1080')
    expect(afterTheLink).toContain('"linkId": 7')
  })

  it('leaves the picture of a greeting in the request itself', () => {
    const variables = {
      greeting: { picture: { data: 'AAAA', width: 1, height: 1 } },
      picture: { data: 'BBBB', width: 1, height: 1 },
    }
    logged(variables)
    expect(variables.greeting.picture.data).toBe('AAAA')
    expect(variables.picture.data).toBe('BBBB')
  })

  it('writes a link without a greeting as before', () => {
    const text = logged({ amount: '20', memo: 'Danke für alles' })
    expect(text).toContain('"memo": "Danke für alles"')
    expect(text).not.toContain('greeting')
    expect(logged({ amount: '20', memo: 'Danke für alles', greeting: null })).toContain(
      '"greeting": null',
    )
  })

  it('leaves the picture in the request itself', () => {
    const variables = { image: { data: 'AAAA', width: 1, height: 1 } }
    logged(variables)
    expect(variables.image.data).toBe('AAAA')
  })

  it('writes no password and no guarantor code, as before', () => {
    const text = logged({
      password: 'Aa12345_',
      passwordNew: 'Bb12345_',
      guarantorCode: '1790000000.c2lnbmF0dXJl',
    })
    for (const secret of ['Aa12345_', 'Bb12345_', 'c2lnbmF0dXJl']) {
      expect(text).not.toContain(secret)
    }
  })

  // The place a member pins for the member search (updateUserInfos, `$gmsLocation` in the
  // wallet's mutations.js): theirs alone, and this line is written at level info.
  it("writes no member's position, and the rest of the request as before", () => {
    const text = logged({
      gmsAllowed: true,
      gmsPublishLocation: 'GMS_LOCATION_TYPE_EXACT',
      gmsLocation: { latitude: 49.679437, longitude: 9.573224 },
    })
    expect(text).not.toContain('49.679437')
    expect(text).not.toContain('9.573224')
    expect(text).toContain('"gmsLocation": "***"')
    expect(text).toContain('"gmsAllowed": true')
    expect(text).toContain('"gmsPublishLocation": "GMS_LOCATION_TYPE_EXACT"')
  })

  it('leaves the position in the request itself', () => {
    const variables = { gmsLocation: { latitude: 49.679437, longitude: 9.573224 } }
    logged(variables)
    expect(variables.gmsLocation).toEqual({ latitude: 49.679437, longitude: 9.573224 })
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
    expect(text).toContain('ref: {communityUuid: "***", gradidoID: "***"}')
    expect(text).toContain('image: {data: "***", width: 800, height: 600}')
    expect(text).toContain('subject: "***"')
  })

  // coderabbit on #4001: an escaped triple quote does not end a block string -- what follows it
  // is still inside.
  it('writes nothing of a block string past an escaped triple quote', () => {
    const text = logged(
      {},
      'mutation { sendChatMessage(ref: { gradidoID: "g" }, body: """Meet \\""" Ottilie Tomorrow""", notify: EMAIL) { id } }',
    )
    for (const secret of ['Meet', 'Ottilie', 'Tomorrow']) {
      expect(text).not.toContain(secret)
    }
    expect(text).toContain('body: "***"')
  })

  // A document graphql-js cannot read is refused with an error anyway; the log keeps its length.
  it('writes a document that does not parse as its length only', () => {
    const broken = 'mutation { login(email: "anna@example.org", password: "Aa12345_) { id } }'
    const text = logged({}, broken)
    expect(text).not.toContain('anna@example.org')
    expect(text).not.toContain('Aa12345_')
    expect(text).toContain(`(a document that does not parse, ${broken.length} characters)`)
  })

  it('writes a document without strings in full', () => {
    const text = logged(
      {},
      'query ($ref: MemberAvatarRefInput!) { chatMessagesWithMember(ref: $ref) { hasMore } }',
    )
    expect(text).toContain('query ($ref: MemberAvatarRefInput!) {')
    expect(text).toContain('chatMessagesWithMember(ref: $ref) {')
    expect(text).toContain('hasMore')
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
  // A failed check keeps the value it refused -- the whole picture where its width is out of
  // bounds, however small the picture (coderabbit on #4001).
  it('writes no value a check refused, however short', () => {
    const text = errorsLogged([
      {
        message: 'Argument Validation Error',
        extensions: {
          code: 'INTERNAL_SERVER_ERROR',
          exception: {
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
  it('writes no value graphql-js quotes of an invalid variable', () => {
    const text = errorsLogged([
      {
        message:
          'Variable "$image" got invalid value { data: "SHORTPICTURE", width: "x" } at "image.width"; Int cannot represent non-integer value: "x"',
      },
    ])
    expect(text).not.toContain('SHORTPICTURE')
    expect(text).toContain('"message": "Variable \\"$image\\" got invalid value ***"')
  })

  it('writes any other long string as its length only', () => {
    const long = 'A'.repeat(5000)
    const text = errorsLogged([
      { message: 'Something failed', extensions: { exception: { detail: long } } },
    ])
    expect(text).not.toContain(long)
    expect(text).toContain('"detail": "*** 5000 characters"')
    expect(text).toContain('"message": "Something failed"')
  })

  // The photo sent with a transfer comes as `$picture` too (sendCoins).
  it('writes no photo sent with a transfer, only its size and the motif', () => {
    const photo = Buffer.from('a private photo of the bench Dave built').toString('base64')
    const withPhoto = logged({
      recipientIdentifier: 'dave',
      amount: '50',
      memo: 'Für die Bank.',
      picture: { data: photo, width: 831, height: 577 },
    })
    expect(withPhoto).not.toContain(photo)
    expect(withPhoto).toContain('"data": "***"')
    expect(withPhoto).toContain('"width": 831')
    expect(withPhoto).toContain('"memo": "Für die Bank."')

    const withMotif = logged({ recipientIdentifier: 'dave', amount: '50', motif: 'giving-hands' })
    expect(withMotif).toContain('"motif": "giving-hands"')
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

  it('is left out where the request was handed the picture of a thank-you greeting', () => {
    const picture = Buffer.from('a private photo of Oma Emma').toString('base64')
    const traced = answerTraced(
      { requestBudget: { ...newRequestBudget(), thankYouGreetingPicturesServed: 1 } },
      { thankYouGreetingPicture: picture },
    )
    expect(traced).not.toContain(picture)
    expect(traced).toBe('Response-Data: left out, it holds a picture')
  })

  // The budget as thankYouGreetingPicture leaves it where the large rendition was asked for
  // (TransactionLinkResolver): counted as three, and once as a large one.
  it('is left out where the request was handed the large rendition of such a picture', () => {
    const picture = Buffer.from('a private photo of Oma Emma, at its full size').toString('base64')
    const traced = answerTraced(
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

  it('is left out where the request was handed the photo of a transfer', () => {
    const picture = Buffer.from('a private photo of the bench Dave built').toString('base64')
    const traced = answerTraced(
      { requestBudget: { ...newRequestBudget(), transactionPicturesServed: 1 } },
      { transactionPicture: picture },
    )
    expect(traced).not.toContain(picture)
    expect(traced).toBe('Response-Data: left out, it holds a picture')
  })

  it('is written where the request was handed no picture of any kind', () => {
    const traced = answerTraced({ requestBudget: newRequestBudget() }, { sendCoins: true })
    expect(traced).toContain('"sendCoins": true')
  })

  // The same name comes back in the answers that carry a greeting -- the new link, the link
  // somebody opens, the sender's list, and the booking list with the booking made from the link.
  it('carries no name a thank-you greeting is for, wherever the answer holds one', () => {
    const greeting = { motif: 'bouquet', line: 'Danke!', recipientName: 'Sarah Wintergrün' }
    const traced = answerTraced(
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

  it('is written at level trace for every other request, as before', () => {
    const traced = answerTraced(
      { requestBudget: newRequestBudget() },
      { contactList: { contactCount: 3 } },
    )
    expect(traced).toContain('"contactCount": 3')
  })
})
