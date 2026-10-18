import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  type Geometry,
  JoinColumn,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'
import { type FederatedCommunity as FederatedCommunityType } from './FederatedCommunity'
import { GeometryTransformer } from './transformer/GeometryTransformer'
import { type User as UserType } from './User'

@Entity('communities')
export class Community extends BaseEntity {
  @PrimaryGeneratedColumn('increment', { unsigned: true })
  id: number

  @Column({ name: 'foreign', type: 'bool', nullable: false, default: true })
  foreign: boolean

  @Column({ name: 'url', type: 'varchar', length: 255, nullable: false })
  url: string

  @Column({ name: 'public_key', type: 'binary', length: 32, nullable: false, unique: true })
  publicKey: Buffer

  @Column({ name: 'private_key', type: 'binary', length: 64, nullable: true })
  privateKey: Buffer | null

  @Column({
    name: 'community_uuid',
    type: 'char',
    length: 36,
    nullable: false,
  })
  communityUuid: string

  @Column({ name: 'authenticated_at', type: 'datetime', precision: 3, nullable: true })
  authenticatedAt: Date | null

  @Column({ name: 'name', type: 'varchar', length: 40, nullable: true })
  name: string | null

  @Column({ name: 'description', type: 'varchar', length: 255, nullable: true })
  description: string | null

  @CreateDateColumn({ name: 'creation_date', type: 'datetime', precision: 3, nullable: true })
  creationDate: Date | null

  @Column({ name: 'gms_api_key', type: 'varchar', length: 512, nullable: true, default: null })
  gmsApiKey: string | null

  @Column({ name: 'public_jwt_key', type: 'varchar', length: 512, nullable: true })
  publicJwtKey: string | null

  @Column({ name: 'private_jwt_key', type: 'varchar', length: 2048, nullable: true })
  privateJwtKey: string | null

  @Column({ name: 'public_encryption_key', type: 'binary', length: 32, nullable: false })
  publicEncryptionKey: Buffer

  @Column({ name: 'private_encryption_key', type: 'binary', length: 32, nullable: true })
  privateEncryptionKey: Buffer | null

  @Column({
    name: 'location',
    type: 'geometry',
    default: null,
    nullable: true,
    transformer: GeometryTransformer,
  })
  location: Geometry | null

  @Column({ name: 'hiero_topic_id', type: 'varchar', length: 255, nullable: true })
  hieroTopicId: string | null

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

  @OneToMany(
    () => require('./User').User,
    (user: UserType) => user.community,
  )
  @JoinColumn({ name: 'community_uuid', referencedColumnName: 'communityUuid' })
  users: UserType[]

  @OneToMany(
    () => require('./FederatedCommunity').FederatedCommunity,
    (federatedCommunity: FederatedCommunityType) => federatedCommunity.community,
  )
  @JoinColumn({ name: 'public_key', referencedColumnName: 'publicKey' })
  federatedCommunities?: FederatedCommunityType[]
}
