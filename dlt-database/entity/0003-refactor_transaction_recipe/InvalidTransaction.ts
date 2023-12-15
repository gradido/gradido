import { Entity, PrimaryGeneratedColumn, Column, BaseEntity } from 'typeorm'

@Entity('invalid_transactions')
export class InvalidTransaction extends BaseEntity {
  @PrimaryGeneratedColumn('increment', { unsigned: true, type: 'bigint' })
  id: number

  @Column({ name: 'iota_message_id', type: 'binary', length: 32 })
  iotaMessageId: Buffer

  @Column({ name: 'error_message', type: 'varchar', length: 255 })
  errorMessage: string
}
