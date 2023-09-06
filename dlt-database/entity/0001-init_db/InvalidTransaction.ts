import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm'

@Entity('invalid_transactions')
export class InvalidTransaction {
  @PrimaryGeneratedColumn('increment', { unsigned: true, type: 'bigint' })
  id: number

  @Column({ name: 'iota_message_id', type: 'binary', length: 32 })
  iotaMessageId: Buffer
}
