import {
  BaseEntity,
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  JoinColumn,
  ManyToOne,
} from 'typeorm'
import { Community } from '../Community'
import { CommunityApiVersion } from '../CommunityApiVersion'

@Entity('community_federation')
export class CommunityFederation extends BaseEntity {
  @PrimaryGeneratedColumn('increment', { unsigned: true })
  id: number

  @Column({ name: 'community_id', type: 'int', unsigned: true, nullable: false })
  communityId: number

  @Column({ length: 36, unique: true, nullable: false })
  uuid: string

  @Column({ name: 'remote_flag', type: Boolean, nullable: false, default: false })
  foreign: boolean

  @Column({ name: 'created_at', default: () => 'CURRENT_TIMESTAMP', nullable: false })
  createdAt: Date

  @Column({ name: 'private_key', type: 'binary', length: 80, default: null, nullable: true })
  privateKey: Buffer

  @Column({ name: 'public_key', type: 'binary', length: 32, default: null, nullable: true })
  pubKey: Buffer

  @Column({ name: 'public_key_verified_at', default: null, nullable: true })
  pubKeyVerifiedAt: Date

  @Column({ name: 'authenticated_at', default: null, nullable: true })
  authenticatedAt: Date

  @ManyToOne(() => Community, (community) => community.federations)
  @JoinColumn({ name: 'community_id' })
  community: Community

  @OneToMany(() => CommunityApiVersion, (apiVersion) => apiVersion.communityFederation)
  @JoinColumn({ name: 'communityFederationID' })
  apiVersions: CommunityApiVersion[]
}
