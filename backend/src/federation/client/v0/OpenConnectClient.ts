import { GraphQLClient, gql } from 'graphql-request'
import { backendLogger as logger } from '@/server/logger'
import { FdCommunity } from '@/federation/graphql/v0/model/FdCommunity'
import { SecretKeyCryptographyEncrypt } from '@/util/encryptionTools'

export async function requestOpenConnect(
  homeCom: FdCommunity,
  fedCom: FdCommunity,
): Promise<boolean | undefined> {
  let endpoint = fedCom.url.endsWith('/') ? fedCom.url : fedCom.url + '/'
  endpoint = `${endpoint}graphql/v${fedCom.apiVersion}_openConnect`
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
      openConnect(pubKey: $pubKey, encryptedUrl: $encryptedUrl)
    }
  `
  const encryptedUrl = SecretKeyCryptographyEncrypt(
    Buffer.from(homeCom.url),
    Buffer.from(fedCom.publicKey),
  )
  const variables = { pubKey: homeCom.publicKey, encryptedUrl: encryptedUrl }

  try {
    const data = await graphQLClient.request(query, variables)
    logger.info(`Response-Data: ${JSON.stringify(data)}`)
    if (data) {
      const json = JSON.parse(data.toString('ascii'))
      logger.info(`Response-Data: ${json}`)
      return json.openConnect
    }
    logger.info(`requestOpenConnect processed successfully`)
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
  endpoint = `${endpoint}graphql/v${fedCom.apiVersion}_openConnectRedirect`
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
    query ($oneTimeCode: String!, $url: String!, $encryptedRedirctUrl: String!) {
      openConnectRedirect(
        oneTimeCode: $oneTimeCode
        url: $url
        encryptedRedirctUrl: $encryptedRedirctUrl
      )
    }
  `
  const encryptedUrl = SecretKeyCryptographyEncrypt(
    Buffer.from(homeComRedirectUrl),
    Buffer.from(fedCom.publicKey),
  )
  const variables = {
    oneTimeCode: oneTimeCode,
    url: homeCom.url,
    encryptedRedirctUrl: encryptedUrl,
  }

  try {
    const data = await graphQLClient.request(query, variables)
    logger.info(`Response-Data: ${JSON.stringify(data)}`)
    if (data) {
      const json = JSON.parse(data.toString('ascii'))
      logger.info(`Response-Data: ${json}`)
      return json.openConnectRedirect
    }
    logger.info(`requestOpenConnectRedirect processed successfully`)
  } catch (err) {
    logger.error(`Request-Error: ${JSON.stringify(err)}`)
  }
}

export async function requestOpenConnectOneTime(
  homeCom: FdCommunity,
  fedCom: FdCommunity,
  oneTimeCode: string,
  decryptedRemoteUrl: string,
): Promise<boolean | undefined> {
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
      openConnectOneTime(oneTimeCode: $oneTimeCode, encryptedUuid: $uuid) {
      encryptedUuid
    }
  `
  const encryptedUuid = SecretKeyCryptographyEncrypt(
    Buffer.from(homeCom.uuid),
    Buffer.from(fedCom.publicKey),
  )
  const variables = { oneTimeCode: oneTimeCode, encryptedUuid: encryptedUuid }

  try {
    const data = await graphQLClient.request(query, variables)
    logger.info(`Response-Data: ${JSON.stringify(data)}`)
    if (data) {
      const json = JSON.parse(data.toString('ascii'))
      logger.info(`Response-Data: ${json}`)
      return json.encryptedUuid
    }
    logger.info(`requestOpenConnectOneTime processed successfully`)
  } catch (err) {
    logger.error(`Request-Error: ${JSON.stringify(err)}`)
  }
}
