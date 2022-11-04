import { BaseEntity, Entity, PrimaryGeneratedColumn, Column, OneToMany, JoinColumn } from 'typeorm'
import { CommunityApiVersion } from '../CommunityApiVersion'

@Entity('community_federation')
export class CommunityFederation extends BaseEntity {
  @PrimaryGeneratedColumn('increment', { unsigned: true })
  id: number

  @Column({ length: 36, unique: true, nullable: false })
  uuid: string

  @Column({ type: Boolean, nullable: false, default: false })
  foreign: boolean

  @Column({ name: 'created_at', default: () => 'CURRENT_TIMESTAMP', nullable: false })
  createdAt: Date

  @Column({ name: 'private_key', length: 255, nullable: true, default: null })
  privateKey: string

  @Column({ name: 'public_key', length: 255, nullable: true, default: null })
  pubKey: string

  @Column({ name: 'public_key_verified_at', default: null, nullable: true })
  pubKeyVerifiedAt: Date

  @Column({ name: 'authenticated_at', default: null, nullable: true })
  authenticatedAt: Date

  @OneToMany(() => CommunityApiVersion, (apiVersion) => apiVersion.communityFederation)
  @JoinColumn({ name: 'communityFederationID' })
  apiVersions: CommunityApiVersion[]
}
