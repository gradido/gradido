import { BaseEntity, Entity, PrimaryGeneratedColumn, Column, OneToMany, JoinColumn } from 'typeorm'
import { CommunityFederation } from '../CommunityFederation'

@Entity('community')
export class Community extends BaseEntity {
  @PrimaryGeneratedColumn('increment', { unsigned: true })
  id: number

  @Column({ length: 36, unique: true })
  uuid: string

  @Column({ length: 255 })
  name: string

  @Column({ length: 255 })
  description: string

  @Column({ name: 'created_at', default: () => 'CURRENT_TIMESTAMP', nullable: false })
  createdAt: Date

  @OneToMany(
    () => CommunityFederation,
    (communityFederation: CommunityFederation) => communityFederation.community,
  )
  @JoinColumn({ name: 'community_id' })
  federations?: CommunityFederation[]
}
