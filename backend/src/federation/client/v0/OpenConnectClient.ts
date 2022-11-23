import { GraphQLClient, gql } from 'graphql-request'
import { backendLogger as logger } from '@/server/logger'
import { FdCommunity } from '@/federation/graphql/v0/model/FdCommunity'
import { SecretKeyCryptographyDecrypt, SecretKeyCryptographyEncrypt } from '@/util/encryptionTools'

export async function requestOpenConnect(
  homeCom: FdCommunity,
  fedCom: FdCommunity,
): Promise<boolean | undefined> {
  let endpoint = fedCom.url.endsWith('/') ? fedCom.url : fedCom.url + '/'
  endpoint = `${endpoint}graphql/${fedCom.apiVersion}_openConnect`
  logger.info(`requestOpenConnect with endpoint='${endpoint}'...`)

  const graphQLClient = new GraphQLClient(endpoint, {
    method: 'GET',
    jsonSerializer: {
      parse: JSON.parse,
      stringify: JSON.stringify,
    },
  })
  logger.info(`graphQLClient=${JSON.stringify(graphQLClient)}`)
  const query = gql`
    query ($pubKey: String!, $encryptedUrl: String!) {
      v0_openConnect(pubKey: $pubKey, encryptedUrl: $encryptedUrl)
    }
  `
  const encryptedUrlBuf = SecretKeyCryptographyEncrypt(
    Buffer.from(homeCom.url),
    Buffer.from(fedCom.publicKey, 'hex'),
  )
  const encryptedUrl = encryptedUrlBuf.toString('hex')
  const variables = { pubKey: homeCom.publicKey, encryptedUrl: encryptedUrl }
  logger.debug(`variables=${JSON.stringify(variables)}`)

  try {
    const { data, errors, extensions, headers, status } = await graphQLClient.rawRequest(
      query,
      variables,
    )
    logger.debug(
      `Response-Data: ${JSON.stringify(
        { data, errors, extensions, headers, status },
        undefined,
        2,
      )}`,
    )
    if (data) {
      logger.debug(`Response-Data: ${data.v0_openConnect}`)
      logger.info(`requestOpenConnect processed successfully`)
      return data.v0_openConnect
    }
    logger.error(`requestOpenConnect processed without response data...`)
  } catch (err) {
    logger.error(`Request-Error: ${JSON.stringify(err)}`)
  }
}

export async function requestOpenConnectRedirect(
  oneTimeCode: string,
  homeComRedirectUrl: string,
  homeCom: FdCommunity,
  fedCom: FdCommunity,
): Promise<boolean | undefined> {
  let endpoint = fedCom.url.endsWith('/') ? fedCom.url : fedCom.url + '/'
  endpoint = `${endpoint}graphql/${fedCom.apiVersion}_openConnectRedirect`
  logger.info(`requestOpenConnectRedirect with endpoint='${endpoint}'...`)

  const graphQLClient = new GraphQLClient(endpoint, {
    method: 'GET',
    jsonSerializer: {
      parse: JSON.parse,
      stringify: JSON.stringify,
    },
  })
  logger.info(`graphQLClient=${JSON.stringify(graphQLClient)}`)
  const query = gql`
    query ($oneTimeCode: String!, $url: String!, $encryptedRedirectUrl: String!) {
      v0_openConnectRedirect(
        oneTimeCode: $oneTimeCode
        url: $url
        encryptedRedirectUrl: $encryptedRedirectUrl
      )
    }
  `
  const encryptedUrl = SecretKeyCryptographyEncrypt(
    Buffer.from(homeComRedirectUrl),
    Buffer.from(fedCom.publicKey, 'hex'),
  ).toString('hex')
  const variables = {
    oneTimeCode: oneTimeCode,
    url: homeCom.url,
    encryptedRedirctUrl: encryptedUrl,
  }

  try {
    const { data, errors, extensions, headers, status } = await graphQLClient.rawRequest(
      query,
      variables,
    )
    logger.debug(
      `Response-Data: ${JSON.stringify(
        { data, errors, extensions, headers, status },
        undefined,
        2,
      )}`,
    )
    if (data) {
      logger.debug(`Response-Data: ${data.v0_openConnectRedirect}`)
      logger.info(`requestOpenConnectRedirect processed successfully`)
      return data.v0_openConnectRedirect
    }
    logger.error(`requestOpenConnectRedirect processed without response data...`)
  } catch (err) {
    logger.error(`Request-Error: ${JSON.stringify(err)}`)
  }
}

export async function requestOpenConnectOneTime(
  homeCom: FdCommunity,
  fedCom: FdCommunity,
  oneTimeCode: string,
  decryptedRemoteUrl: string,
): Promise<string | undefined> {
  const endpoint = decryptedRemoteUrl
  logger.info(`requestOpenConnectOneTime with endpoint='${endpoint}'...`)

  const graphQLClient = new GraphQLClient(endpoint, {
    method: 'GET',
    jsonSerializer: {
      parse: JSON.parse,
      stringify: JSON.stringify,
    },
  })
  logger.info(`graphQLClient=${JSON.stringify(graphQLClient)}`)
  const query = gql`
    query ($oneTimeCode: String!, $uuid: String!) {
      v0_openConnectOneTime(oneTimeCode: $oneTimeCode, encryptedUuid: $uuid) {
      encryptedUuid
    }
  `
  const encryptedUuid = SecretKeyCryptographyEncrypt(
    Buffer.from(homeCom.uuid),
    Buffer.from(fedCom.publicKey, 'hex'),
  ).toString('hex')
  const variables = { oneTimeCode: oneTimeCode, encryptedUuid: encryptedUuid }

  try {
    const { data, errors, extensions, headers, status } = await graphQLClient.rawRequest(
      query,
      variables,
    )
    logger.debug(
      `Response-Data: ${JSON.stringify(
        { data, errors, extensions, headers, status },
        undefined,
        2,
      )}`,
    )
    if (data) {
      const decryptedUuid = SecretKeyCryptographyDecrypt(
        Buffer.from(data.v0_openConnectOneTime.encryptedUuid),
        Buffer.from(homeCom.privKey, 'hex'),
      ).toString('hex')
      logger.debug(`Response-Data: uuid=${decryptedUuid}`)
      logger.info(`requestOpenConnectOneTime processed successfully`)
      return decryptedUuid
    }
    logger.error(`requestOpenConnectOneTime processed without response data`)
  } catch (err) {
    logger.error(`Request-Error: ${JSON.stringify(err)}`)
  }
}
