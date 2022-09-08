import gql from 'graphql-tag'

export const communityStatistics = gql`
  query {
    communityStatistics {
      totalUsers
      activeUsers
      deletedUsers
      totalGradidoCreated
      totalGradidoDecayed
      totalGradidoAvailable
      totalGradidoUnbookedDecayed
    }
  }
`
