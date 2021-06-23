import 'reflect-metadata'
import express from 'express'
import { graphqlHTTP } from 'express-graphql'
// import { createConnection } from 'typeorm'
import { buildSchema } from 'type-graphql'
import { BookResolver } from './graphql/resolvers/BookResolver'
// import queryComplexity, { simpleEstimator, fieldConfigEstimator } from "graphql-query-complexity";

async function main() {
  // const connection = await createConnection()
  const schema = await buildSchema({ resolvers: [BookResolver] })
  const server = express()

  server.use(
    '/api',
    graphqlHTTP({
      schema,
      graphiql: true,
      validationRules: [
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
      ],
    }),
  )

  server.listen(4000, () => {
    // eslint-disable-next-line no-console
    console.log(`Server is running, GraphIQL available at http://localhost:4000/api`)
  })
}

main()
