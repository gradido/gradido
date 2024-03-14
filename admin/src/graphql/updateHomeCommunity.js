import gql from 'graphql-tag'

export const updateHomeCommunity = gql`
  mutation ($uuid: String!, $gmsApiKey: String!) {
    updateHomeCommunity(uuid: $uuid, gmsApiKey: $gmsApiKey) {
      id
    }
  }
`
