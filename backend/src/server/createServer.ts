import 'reflect-metadata'
import 'module-alias/register'

import { ApolloServer } from 'apollo-server-express'
import express, { Express } from 'express'

// database
import connection from '../typeorm/connection'
import { checkDBVersion } from '../typeorm/DBVersion'

// server
import cors from './cors'
import serverContext from './context'
import plugins from './plugins'

// config
import CONFIG from '../config'

// graphql
import schema from '../graphql/schema'

// webhooks
import { elopageWebhook } from '../webhook/elopage'
import { Connection, getRepository } from '@dbTools/typeorm'

// blockchain
import { isCommunityAliasExisting } from '../blockchain/GradidoNodeRequests'
import { registerNewGroup } from '../blockchain/TransactionToIota'
import { User as dbUser } from '@entity/User'
import { ServerUser } from '@entity/ServerUser'

// TODO implement
// import queryComplexity, { simpleEstimator, fieldConfigEstimator } from "graphql-query-complexity";

type ServerDef = { apollo: ApolloServer; app: Express; con: Connection }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const createServer = async (context: any = serverContext): Promise<ServerDef> => {
  // open mysql connection
  const con = await connection()
  if (!con || !con.isConnected) {
    throw new Error(`Fatal: Couldn't open connection to database`)
  }

  // check for correct database version
  const dbVersion = await checkDBVersion(CONFIG.DB_VERSION)
  if (!dbVersion) {
    throw new Error('Fatal: Database Version incorrect')
  }
  // *********** UNICORN ADD ************************
  // check if community alias was registered on blockchain
  if (!(await isCommunityAliasExisting(CONFIG.COMMUNITY_ALIAS))) {
    // is not registered, so we create it
    // load first admin user for signing transaction
    const created = new Date()
    const serverUserRepository = getRepository(ServerUser)
    const serverUserResult = await serverUserRepository.find({
      select: ['email'],
      order: {
        id: 'ASC',
      },
      take: 1,
    })

    if (serverUserResult.length > 0) {
      const userRepository = getRepository(dbUser)
      const user = await userRepository.find({
        where: { email: serverUserResult[0].email },
        take: 1,
      })

      if (!user || user.length <= 0) {
        throw Error('user for first admin user not found')
      }

      registerNewGroup(
        created,
        user[0],
        CONFIG.COMMUNITY_NAME,
        CONFIG.COMMUNITY_ALIAS,
        CONFIG.COMMUNITY_COIN_COLOR,
      )
    }
  }
  // *********** UNICORN ADD END ************************
  // Express Server
  const app = express()

  // cors
  app.use(cors)

  // bodyparser json
  app.use(express.json())
  // bodyparser urlencoded for elopage
  app.use(express.urlencoded({ extended: true }))

  // Elopage Webhook
  app.post('/hook/elopage/' + CONFIG.WEBHOOK_ELOPAGE_SECRET, elopageWebhook)

  // Apollo Server
  const apollo = new ApolloServer({
    schema: await schema(),
    playground: CONFIG.GRAPHIQL,
    introspection: CONFIG.GRAPHIQL,
    context,
    plugins,
  })
  apollo.applyMiddleware({ app, path: '/' })
  return { apollo, app, con }
}

export default createServer
