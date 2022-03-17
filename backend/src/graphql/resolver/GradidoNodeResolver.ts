import { Arg, Mutation, Resolver } from 'type-graphql'

@Resolver()
export class GradidoNodeResolver {
  @Mutation(() => Boolean)
  async newGradidoBlock(@Arg('transactionJson') transactionJson: string): Promise<boolean> {
    // eslint-disable-next-line no-console
    console.log('gradido transaction from node server: %s', transactionJson)
    return true
  }
}
