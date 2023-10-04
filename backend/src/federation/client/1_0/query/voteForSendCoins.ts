import { gql } from 'graphql-request'

export const voteForSendCoins = gql`
  mutation ($args: SendCoinsArgs!) {
    voteForSendCoins(data: $args) {
      vote
      recipGradidoID
      recipFirstName
      recipLastName
      recipAlias
    }
  }
`
