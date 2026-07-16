import gql from 'graphql-tag'

export const creaSettings = gql`
  query {
    creaSettings {
      model
      effort
      defaultModel
    }
  }
`

export const setCreaSettings = gql`
  mutation ($input: CreaSettingsInput!) {
    setCreaSettings(input: $input) {
      model
      effort
      defaultModel
    }
  }
`

export const testCreaModel = gql`
  mutation ($input: CreaSettingsInput!) {
    testCreaModel(input: $input) {
      ok
      message
    }
  }
`
