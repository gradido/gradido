import { CommunityHandshakeStateType } from '../enum'
import { BaseEntity, Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'
import { FederatedCommunity } from './FederatedCommunity'

@Entity('community_handshake_states')
export class CommunityHandshakeState extends BaseEntity {
  @PrimaryGeneratedColumn({ unsigned: true })
  id: number

  @Column({ name: 'handshake_id', type: 'int', unsigned: true })
  handshakeId: number

  @Column({ name: 'one_time_code', type: 'int', unsigned: true, default: null, nullable: true })
  oneTimeCode?: number

  @Column({ name: 'public_key', type: 'binary', length: 32 })
  publicKey: Buffer

  @Column({ name: 'api_version', type: 'varchar', length: 255 })
  apiVersion: string

  @Column({
    type: 'varchar',
    length: 255,
    default: CommunityHandshakeStateType.START_COMMUNITY_AUTHENTICATION,
    nullable: false,
  })
  status: CommunityHandshakeStateType

  @Column({ name: 'last_error', type: 'text', nullable: true })
  lastError?: string

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 3 })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime', precision: 3 })
  updatedAt: Date

  @ManyToOne(() => FederatedCommunity, (federatedCommunity) => federatedCommunity.communityHandshakeStates)
  @JoinColumn({ name: 'public_key', referencedColumnName: 'publicKey' })
  federatedCommunity: FederatedCommunity
}