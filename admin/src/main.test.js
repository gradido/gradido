import { ApolloClient, ApolloLink, InMemoryCache, HttpLink } from 'apollo-boost'
import './main'

jest.mock('apollo-boost')

describe('main', () => {
  it('is there', () => {
    expect(true).toBeTruthy()
  })
})
