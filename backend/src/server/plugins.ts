import { Kind } from 'graphql'

const setHeadersPlugin = {
  async requestDidStart() {
    return {
      async willSendResponse(requestContext: any) {
        const { setHeaders = [] } = requestContext.contextValue
        setHeaders.forEach(({ key, value }: Record<string, string>) => {
          requestContext.response.http.headers.set(key, value)
        })
        return requestContext
      },
    }
  },
}

// The same name on its way back: the answers of createTransactionLink, queryTransactionLink, the
// lists of links and -- with the booking made from the link -- the booking list carry the
// greeting. The field is written as "***" wherever an answer holds it -- no other type of the
// schema names a field so.
const withoutRecipientNames = (key: string, value: unknown): unknown =>
  key === 'recipientName' && typeof value === 'string' ? '***' : value

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

// One line per request: what it asked for, by whom, how long it took, and whether it failed --
// `mutation login`, `query transactionList,communityStatistics`. Most documents of wallet and
// admin carry no name, so the line names the root fields; an alias is written by the field it
// stands for. Neither the document nor its variables are written: the document is the client's
// own code, and the variables are what members write (names, addresses, texts, pictures).
const requestSummary = (requestContext: any): string => {
  const { operation, operationName } = requestContext
  if (!operation) {
    // The document did not parse or validate; its errors follow at level error.
    return operationName ?? '(no operation)'
  }
  const fields = operation.selectionSet.selections
    .map((selection: any) => (selection.kind === Kind.FIELD ? selection.name.value : '...'))
    .join(',')
  return `${operation.operation} ${fields}`
}

export const logPlugin = {
  async requestDidStart(requestContext: any) {
    const { logger } = requestContext
    const started = performance.now()
    return {
      async willSendResponse(requestContext: any) {
        if (requestContext.request.operationName === 'IntrospectionQuery') {
          return requestContext
        }
        // What is answered: Apollo Server 5 keeps data and errors one level down, and has
        // neither for an answer that is delivered in parts.
        const { body } = requestContext.response
        const answer = body.kind === 'single' ? body.singleResult : {}
        const userId = requestContext.contextValue?.user?.id ?? '-'
        const duration = Math.round(performance.now() - started)
        logger.info(
          `${requestSummary(requestContext)} user=${userId} ${duration}ms ${answer.errors ? 'errors' : 'ok'}`,
        )
        if (answer.data) {
          // A video room is open to whoever knows its address: the answer of a request that was
          // handed one (chatVideoRoom) stays out of the log. The request's budget counts the
          // rooms, over every alias.
          if (requestContext.contextValue.requestBudget?.chatVideoRoomsServed) {
            logger.trace('Response-Data: left out, it holds a video room')
          } else if (requestContext.contextValue.requestBudget?.userNotesServed) {
            // A member's own notes (userNote, userNotes) are theirs alone.
            logger.trace('Response-Data: left out, it holds a note')
          } else if (requestContext.contextValue.requestBudget?.userRemarksServed) {
            // The moderation's remark on a member (userRemark, setUserRemark) is for the
            // moderators alone -- and so is Crea's answer where she read one (CreaResolver).
            logger.trace('Response-Data: left out, it holds a remark')
          } else if (
            requestContext.contextValue.requestBudget?.chatImagesServed ||
            requestContext.contextValue.requestBudget?.thankYouGreetingPicturesServed ||
            requestContext.contextValue.requestBudget?.transactionPicturesServed ||
            requestContext.contextValue.requestBudget?.senderAvatarsServed ||
            requestContext.contextValue.requestBudget?.keptPicturesServed ||
            requestContext.contextValue.requestBudget?.memberAvatarsFullServed ||
            requestContext.contextValue.requestBudget?.profilePicturesServed
          ) {
            // A picture of a chat message (chatMessageImage) is one member's for another, and
            // so are the picture of a thank-you greeting (thankYouGreetingPicture) and the
            // photo sent with a transfer (transactionPicture) -- and the face of the member
            // who made a link, on the page of an open link (queryTransactionLink). A member's
            // own pictures of their contacts (keptPictures, keptPictureFull) are theirs alone,
            // and so is WHO they keep one of. And a profile picture is a face, whoever's it is:
            // the member's own (avatar, avatarFull) and those of others (memberAvatars,
            // memberAvatarFull).
            logger.trace('Response-Data: left out, it holds a picture')
          } else if (logger.isTraceEnabled()) {
            // Formatted only where it is written: the whole answer as indented text costs the
            // server time on every request, also while the level is off.
            logger.trace(`Response-Data:
${JSON.stringify(answer.data, withoutRecipientNames, 2)}`)
          }
        }
        if (answer.errors) {
          logger.error(`Response-Errors:
${JSON.stringify(answer.errors, withoutRequestValues, 2)}`)
        }
        return requestContext
      },
    }
  },
}

export const plugins =
  process.env.NODE_ENV === 'development' ? [setHeadersPlugin] : [setHeadersPlugin, logPlugin]
