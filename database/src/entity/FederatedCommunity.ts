import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'
import { Community } from './Community'
import { CommunityHandshakeState } from './CommunityHandshakeState'

@Entity('federated_communities')
export class FederatedCommunity extends BaseEntity {
  @PrimaryGeneratedColumn('increment', { unsigned: true })
  id: number

  @Column({ name: 'foreign', type: 'bool', nullable: false, default: true })
  foreign: boolean

  @Column({ name: 'public_key', type: 'binary', length: 32, default: null, nullable: true })
  publicKey: Buffer

  @Column({ name: 'api_version', type: 'varchar', length: 10, nullable: false })
  apiVersion: string

  @Column({ name: 'end_point', type: 'varchar', length: 255, nullable: false })
  endPoint: string

  @Column({ name: 'last_announced_at', type: 'datetime', precision: 3, nullable: true })
  lastAnnouncedAt: Date | null

  @Column({ name: 'verified_at', type: 'datetime', precision: 3, nullable: true })
  verifiedAt: Date | null

  @Column({ name: 'last_error_at', type: 'datetime', precision: 3, nullable: true })
  lastErrorAt: Date | null

  @CreateDateColumn({
    name: 'created_at',
    type: 'datetime',
    precision: 3,
    default: () => 'CURRENT_TIMESTAMP(3)',
    nullable: false,
  })
  createdAt: Date

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'datetime',
    precision: 3,
    onUpdate: 'CURRENT_TIMESTAMP(3)',
    nullable: true,
  })
  updatedAt: Date | null

  @ManyToOne(
    () => Community,
    (community) => community.federatedCommunities,
  )
  @JoinColumn({ name: 'public_key', referencedColumnName: 'publicKey' })
  community?: Community

  @OneToMany(() => CommunityHandshakeState, (communityHandshakeState) => communityHandshakeState.federatedCommunity)
  @JoinColumn({ name: 'public_key', referencedColumnName: 'publicKey' })
  communityHandshakeStates: CommunityHandshakeState[]
}
