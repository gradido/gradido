import { BaseEntity, Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm'
import { CommunityFederation } from './CommunityFederation'

@Entity('community_api_version')
export class CommunityApiVersion extends BaseEntity {
  @PrimaryGeneratedColumn('increment', { unsigned: true })
  id: number

  @Column()
  communityFederationID: number

  @ManyToOne(() => CommunityFederation)
  @JoinColumn({ name: 'communityFederationID', referencedColumnName: 'id' })
  communityFederation: CommunityFederation

  @Column({ length: 255, nullable: false })
  url: string

  @Column({ length: 255, nullable: false })
  apiVersion: string

  @Column({ nullable: true, default: null })
  validFrom: Date

  @Column({ nullable: true, default: null })
  verifiedAt: Date
}
