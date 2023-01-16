import gql from 'graphql-tag'

export const communityStatistics = gql`
  query {
    communityStatistics {
      totalUsers
      deletedUsers
      totalGradidoCreated
      totalGradidoDecayed
      totalAvailable {
        activeUsers
        totalGradidoAvailable
        totalGradidoUnbookedDecayed
      }
    }
  }
`
