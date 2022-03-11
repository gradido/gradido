import { Arg, Ctx, Mutation, Resolver } from 'type-graphql'

@Resolver()
export class GradidoNodeResolver {
  @Mutation(() => Boolean)
  async newGradidoBlock(
    @Arg('transactionJson') transactionJson: string,
    @Ctx() context: any,
  ): Promise<boolean> {
    console.log("gradido transaction from node server: %s", transactionJson)
    return true
  }
}
