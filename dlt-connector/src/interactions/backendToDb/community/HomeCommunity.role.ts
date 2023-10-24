import { CommunityDraft } from '@/graphql/input/CommunityDraft'
import { Community } from '@entity/Community'
import { CommunityRole } from './Community.role'
import { QueryRunner } from 'typeorm'
import { Transaction } from '@entity/Transaction'
import { KeyManager } from '@/controller/KeyManager'
import { AccountFactory } from '@/data/Account.factory'
import { CreateTransactionRecipeContext } from '../transaction/CreateTransationRecipe.context'

export class HomeCommunityRole extends CommunityRole {
  private transactionRecipe: Transaction

  public create(communityDraft: CommunityDraft, topic: string): void {
    super.create(communityDraft, topic)
    // generate key pair for signing transactions and deriving all keys for community
    const keyPair = KeyManager.generateKeyPair()
    this.self.rootPubkey = keyPair.publicKey
    this.self.rootPrivkey = keyPair.privateKey
    this.self.rootChaincode = keyPair.chainCode
    // we should only have one home community per server
    KeyManager.getInstance().setHomeCommunityKeyPair(keyPair)

    // create auf account and gmw account
    this.self.aufAccount = AccountFactory.createAufAccount(keyPair, this.self.createdAt)
    this.self.gmwAccount = AccountFactory.createGmwAccount(keyPair, this.self.createdAt)

    const transactionRecipeContext = new CreateTransactionRecipeContext(communityDraft)
    transactionRecipeContext.setCommunity(this.self)
    transactionRecipeContext.run()
    this.transactionRecipe = transactionRecipeContext.getTransactionRecipe()
  }

  public store(): Promise<Community> {

  }

  public async addCommunity(communityDraft: CommunityDraft, topic: string): Promise<Community> {
    const community = createHomeCommunity(communityDraft, topic)

    createCommunityRootTransactionRecipe(communityDraft, community).storeAsTransaction(
      async (queryRunner: QueryRunner): Promise<void> => {
        await queryRunner.manager.save(community)
      },
    )
    return community.save()
  }
}
