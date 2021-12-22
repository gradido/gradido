import gql from 'graphql-tag'

export const sendActivationEmail = gql`
  mutation ($email: String!) {
    sendActivationEmail(email: $email)
  }
`
