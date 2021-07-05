import 'reflect-metadata'
import express from 'express'
import { graphqlHTTP } from 'express-graphql'
import { buildSchema } from 'type-graphql'
import { ClientBuilder } from '@iota/client'
import atob from 'atob'
// import { Blob } from 'node-blob'

// import { createConnection } from 'typeorm'
import CONFIG from './config'

// TODO move to extern
import { BookResolver } from './graphql/resolvers/BookResolver'
import { ed25519Resolver } from './graphql/resolvers/ed25519AddressResolver'
import { graphql } from 'graphql'
// import { UserResolver } from './graphql/resolvers/UserResolver'
// import { GroupResolver } from './graphql/resolvers/GroupResolver'
// TODO implement
// import queryComplexity, { simpleEstimator, fieldConfigEstimator } from "graphql-query-complexity";

async function main() {
  // const connection = await createConnection()
  const schema = await buildSchema({
    resolvers: [BookResolver, ed25519Resolver /*, GroupResolver, UserResolver */],
  })
  const server = express()
  const validationRules: [] = [
    /**
     * This provides GraphQL query analysis to reject complex queries to your GraphQL server.
     * This can be used to protect your GraphQL servers
     * against resource exhaustion and DoS attacks.
     * More documentation can be found (here)[https://github.com/ivome/graphql-query-complexity]
     */
    /* queryComplexity({
    // The maximum allowed query complexity, queries above this threshold will be rejected
    maximumComplexity: 20,
    // The query variables. This is needed because the variables are not available
    // in the visitor of the graphql-js library
    variables: params!.variables!,
    // Optional callback function to retrieve the determined query complexity
    // Will be invoked weather the query is rejected or not
    // This can be used for logging or to implement rate limiting
    onComplete: (complexity: number) => {
      console.log("Query Complexity:", complexity);
    },
    // Add any number of estimators. The estimators are invoked in order, the first
    // numeric value that is being returned by an estimator is used as the field complexity.
    // If no estimator returns a value, an exception is raised.
    estimators: [
      fieldConfigEstimator(),
      // Add more estimators here...
      // This will assign each field a complexity of 1 if no other estimator
      // returned a value.
      simpleEstimator({
        defaultComplexity: 1,
      }),
    ],
  }), */
  ]

  // TODO Versioning?
  server.use(
    '/api',
    graphqlHTTP({
      schema,
      graphiql: false,
      validationRules,
    }),
  )

  // Graphiql interface
  if (CONFIG.GRAPHIQL) {
    server.use(
      '/graphiql',
      graphqlHTTP({
        schema,
        graphiql: true,
        validationRules,
      }),
    )
  }

  server.listen(CONFIG.PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`Server is running, GraphIQL available at http://localhost:${CONFIG.PORT}/graphiql`)
  })

  // listening on iota messages
  // client connects to a node that has MQTT enabled
  const client = new ClientBuilder().node('https://api.hornet-0.testnet.chrysalis2.com').build()

  client
    .subscriber()
    .topics(['messages/indexation/GRADIDO.gdd1'])
    .subscribe((err: any, data: any) => {
      if (err) {
        // eslint-disable-next-line no-console
        console.log('err: %o', err)
      } else {
        // eslint-disable-next-line no-console
        console.log(String.fromCharCode.apply(null, JSON.parse(data.payload).payload.data.data))
      }
      // To get the message id `client.getMessageId(data.payload)` can be used
    })
}

main()
