import gql from 'graphql-tag'

export const communityStatistics = gql`
  query {
    communityStatistics {
      totalUsers
      deletedUsers
      totalGradidoCreated
      totalGradidoDecayed
      dynamicStatisticsFields {
        activeUsers
        totalGradidoAvailable
        totalGradidoUnbookedDecayed
      }
    }
  }
`
