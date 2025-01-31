import {
  BaseEntity,
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm'
import type { Community as CommunityType } from '../Community'
import { Community } from '../Community'

@Entity('federated_communities')
export class FederatedCommunity extends BaseEntity {
  @PrimaryGeneratedColumn('increment', { unsigned: true })
  id: number

  @Column({ name: 'foreign', type: 'bool', nullable: false, default: true })
  foreign: boolean

  @Column({ name: 'public_key', type: 'binary', length: 32, default: null, nullable: true })
  publicKey: Buffer

  @Column({ name: 'api_version', length: 10, nullable: false })
  apiVersion: string

  @Column({ name: 'end_point', length: 255, nullable: false })
  endPoint: string

  @Column({ name: 'last_announced_at', type: 'datetime', nullable: true })
  lastAnnouncedAt: Date | null

  @Column({ name: 'verified_at', type: 'datetime', nullable: true })
  verifiedAt: Date | null

  @Column({ name: 'last_error_at', type: 'datetime', nullable: true })
  lastErrorAt: Date | null

  @CreateDateColumn({
    name: 'created_at',
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP(3)',
    nullable: false,
  })
  createdAt: Date

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'datetime',
    onUpdate: 'CURRENT_TIMESTAMP(3)',
    nullable: true,
  })
  updatedAt: Date | null

  @ManyToOne(() => Community, (community) => community.federatedCommunities)
  @JoinColumn({ name: 'public_key', referencedColumnName: 'publicKey' })
  community?: CommunityType
}
