import { BaseEntity, Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm'
import { CommunityFederation } from './CommunityFederation'

@Entity('community_api_version')
export class CommunityApiVersion extends BaseEntity {
  @PrimaryGeneratedColumn('increment', { unsigned: true })
  id: number

  @Column({ name: 'community_federation_id', unsigned: true, nullable: false })
  communityFederationID: number

  @ManyToOne(() => CommunityFederation)
  @JoinColumn({ name: 'community_federation_id', referencedColumnName: 'id' })
  communityFederation: CommunityFederation

  @Column({ length: 255, nullable: false })
  url: string

  @Column({ name: 'api_version', length: 255, nullable: false })
  apiVersion: string

  @Column({ name: 'valid_from', nullable: true, default: null })
  validFrom: Date

  @Column({ name: 'verified_at', nullable: true, default: null })
  verifiedAt: Date
}
