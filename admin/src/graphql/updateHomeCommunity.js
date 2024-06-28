import gql from 'graphql-tag'

export const updateHomeCommunity = gql`
  mutation ($uuid: String!, $gmsApiKey: String, $location: Location) {
    updateHomeCommunity(uuid: $uuid, gmsApiKey: $gmsApiKey, location: $location) {
      id
    }
  }
`
