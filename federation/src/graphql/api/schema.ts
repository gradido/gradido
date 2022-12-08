import path from 'path'

export const getApiResolvers = (apiVersion: String) => {
  return path.join(__dirname, `./${apiVersion}/resolver/*Resolver.{ts,js}`) 
}
