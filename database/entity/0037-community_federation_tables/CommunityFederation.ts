import { BaseEntity, Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm'
import { CommunityApiVersion } from './CommunityApiVersion'

@Entity('community_federation')
export class CommunityFederation extends BaseEntity {
  @PrimaryGeneratedColumn('increment', { unsigned: true })
  id: number

  @Column({ length: 36, unique: true, nullable: false })
  uuid: string

  @Column({ type: 'bool', nullable: false, default: false })
  foreign: string

  @Column({ default: () => 'CURRENT_TIMESTAMP', nullable: false })
  createdAt: Date

  @Column({ length: 255, nullable: true, default: null })
  privateKey: string

  @Column({ name: 'publicKey', length: 255, nullable: true, default: null })
  pubKey: string

  @Column({ default: null, nullable: true })
  pubKeyVerifiedAt: Date

  @Column({ default: null, nullable: true })
  authenticatedAt: Date

  @OneToMany(() => CommunityApiVersion, (apiVersion) => apiVersion.communityFederation)
  apiVersions: CommunityApiVersion[]
}
