import { Kind, parse, print, visit } from 'graphql'
import clonedeep from 'lodash.clonedeep'

const setHeadersPlugin = {
  requestDidStart() {
    return {
      willSendResponse(requestContext: any) {
        const { setHeaders = [] } = requestContext.context
        setHeaders.forEach(({ key, value }: Record<string, string>) => {
          if (requestContext.response.http.headers.get(key)) {
            requestContext.response.http.headers.set(key, value)
          } else {
            requestContext.response.http.headers.append(key, value)
          }
        })
        return requestContext
      },
    }
  },
}

const filterVariables = (variables: any) => {
  const vars = clonedeep(variables)
  if (vars?.password) {
    vars.password = '***'
  }
  if (vars?.passwordNew) {
    vars.passwordNew = '***'
  }
  if (vars?.guarantorCode) {
    vars.guarantorCode = '***'
  }
  // What one member writes to another: a chat message (sendChatMessage, `$body` in the wallet's
  // chat.graphql) and the subject of a letter (sendEmail, `$subject`). A chat message may carry
  // the address of a video room, and whoever knows it can join the call. No other document of
  // wallet or admin names a variable so. The letter's text travels as `memo`, like the text of
  // every booking and contribution, and is still written.
  if (vars?.body) {
    vars.body = '***'
  }
  if (vars?.subject) {
    vars.subject = '***'
  }
  // The name of a chat group (createChatGroup, `$title`, P5): what a circle calls itself can say
  // who is in it. No other document of wallet or admin names a variable so; the wallet's has to.
  if (vars?.title) {
    vars.title = '***'
  }
  // A picture in a chat message (sendChatMessage, `$image`): one member's picture for another,
  // and some 80,000 characters of base64 in every line that would carry it. Its size stays
  // readable. The wallet's document has to name the variable so (P7c).
  if (vars?.image?.data) {
    vars.image.data = '***'
  }
  // The two renditions of a member's avatar (setUserAvatar, `$avatarSmall` and `$avatarFull` in
  // the wallet's mutations.js): up to some 95,000 characters of base64, written with every upload
  // until now.
  if (vars?.avatarSmall) {
    vars.avatarSmall = '***'
  }
  if (vars?.avatarFull) {
    vars.avatarFull = '***'
  }
  // "Für wen?" of a thank-you greeting (createTransactionLink, `$greeting`): a name one member
  // writes about somebody else, who has no account here and was never asked. The wallet's
  // document has to name the variable so. The greeting's line stays readable: it is the
  // beginning of `memo`, which is written like the text of every booking.
  if (vars?.greeting?.recipientName) {
    vars.greeting.recipientName = '***'
  }
  // The picture of a thank-you greeting that carries a photo of the member's own, in its two
  // renditions: the small one comes inside `$greeting` (createTransactionLink), the large one
  // as `$picture` (addThankYouGreetingPicture) -- up to some 98,000 characters of base64. Their
  // sizes stay readable. The wallet's documents have to name the variables so.
  if (vars?.greeting?.picture?.data) {
    vars.greeting.picture.data = '***'
  }
  if (vars?.picture?.data) {
    vars.picture.data = '***'
  }
  return vars
}

// The same name on its way back: the answers of createTransactionLink, queryTransactionLink, the
// lists of links and -- with the booking made from the link -- the booking list carry the
// greeting. The field is written as "***" wherever an answer holds it -- no other type of the
// schema names a field so.
const withoutRecipientNames = (key: string, value: unknown): unknown =>
  key === 'recipientName' && typeof value === 'string' ? '***' : value

// A value written into the document itself instead of into a variable -- a picture, a text, a
// password, as a client of its own may send them -- never passes filterVariables (coderabbit on
// #4001). The log gets the document as graphql-js reads it, every string value written as "***"
// and no comment: graphql-js's own parser, so a block string and its escapes end where GraphQL
// says they end. A document it cannot read is written as its length only. The wallet and the
// admin send their values as variables; what a request asks for stays readable.
const withoutStringValues = (document: string | undefined): string => {
  if (!document) {
    return ''
  }
  try {
    return print(
      visit(parse(document, { noLocation: true }), {
        StringValue: () => ({ kind: Kind.STRING, value: '***' }),
      }),
    )
  } catch {
    return `(a document that does not parse, ${document.length} characters)`
  }
}

// An error may quote back what the request carried. A failed check keeps the value it refused --
// class-validator's `value`, the whole picture where its width is out of bounds, however small the
// picture -- and graphql-js prints a variable of the wrong type into its message. The error log
// writes neither: every `value` as "***", a message about an invalid variable only up to the
// value, its reason with it. Any other string longer than this is written as its length.
const LOGGED_STRING_MAX_LENGTH = 1000
const INVALID_VARIABLE = / got invalid value [\s\S]*/
const withoutRequestValues = (key: string, value: unknown): unknown => {
  if (key === 'value') {
    return '***'
  }
  if (typeof value !== 'string') {
    return value
  }
  if (INVALID_VARIABLE.test(value)) {
    return value.replace(INVALID_VARIABLE, ' got invalid value ***')
  }
  return value.length > LOGGED_STRING_MAX_LENGTH ? `*** ${value.length} characters` : value
}

export const logPlugin = {
  requestDidStart(requestContext: any) {
    const { logger } = requestContext
    const { query, mutation, variables, operationName } = requestContext.request
    if (operationName !== 'IntrospectionQuery') {
      logger.debug('requestDidStart:', { operationName, variables: filterVariables(variables) })
      logger.info(`Request:
${withoutStringValues(mutation || query)}
variables: ${JSON.stringify(filterVariables(variables), null, 2)}`)
    }
    return {
      willSendResponse(requestContext: any) {
        if (operationName !== 'IntrospectionQuery') {
          if (requestContext.context.user) {
            logger.info(`User ID: ${requestContext.context.user.id}`)
          }
          if (requestContext.response.data) {
            logger.info('Response Success!')
            // A video room is open to whoever knows its address: the answer of a request that was
            // handed one (chatVideoRoom) stays out of the log. The request's budget counts the
            // rooms, over aliases and every operation of a batch.
            if (requestContext.context.requestBudget?.chatVideoRoomsServed) {
              logger.trace('Response-Data: left out, it holds a video room')
            } else if (
              requestContext.context.requestBudget?.chatImagesServed ||
              requestContext.context.requestBudget?.thankYouGreetingPicturesServed
            ) {
              // A picture of a chat message (chatMessageImage) is one member's for another, and
              // so is the picture of a thank-you greeting (thankYouGreetingPicture).
              logger.trace('Response-Data: left out, it holds a picture')
            } else {
              logger.trace(`Response-Data:
${JSON.stringify(requestContext.response.data, withoutRecipientNames, 2)}`)
            }
          }
          if (requestContext.response.errors) {
            logger.error(`Response-Errors:
${JSON.stringify(requestContext.response.errors, withoutRequestValues, 2)}`)
          }
        }
        return requestContext
      },
    }
  },
}

export const plugins =
  process.env.NODE_ENV === 'development' ? [setHeadersPlugin] : [setHeadersPlugin, logPlugin]
