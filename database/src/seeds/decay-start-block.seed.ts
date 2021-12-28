import { Factory, Seeder } from 'typeorm-seeding'
import { Transaction } from '../../entity/Transaction'

export class DecayStartBlockSeed implements Seeder {
  public async run(factory: Factory): Promise<void> {
    await factory(Transaction)({
      transactionTypeId: 9,
      txHash: Buffer.from(
        '9c9c4152b8a4cfbac287eee18d2d262e9de756fae726fc0ca36b788564973fff00000000000000000000000000000000',
        'hex',
      ),
      memo: '',
      received: new Date('2021-11-30T09:13:26'),
      blockchainTypeId: 1,
    }).create()
  }
}
