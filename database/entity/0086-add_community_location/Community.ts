import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  Geometry,
  JoinColumn,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'
import { GeometryTransformer } from '../../src/typeorm/GeometryTransformer'
import { FederatedCommunity } from '../FederatedCommunity'
import { User } from '../User'

@Entity('communities')
export class Community extends BaseEntity {
  @PrimaryGeneratedColumn('increment', { unsigned: true })
  id: number

  @Column({ name: 'foreign', type: 'bool', nullable: false, default: true })
  foreign: boolean

  @Column({ name: 'url', type: 'varchar', length: 255, nullable: false })
  url: string

  @Column({ name: 'public_key', type: 'binary', length: 32, nullable: false })
  publicKey: Buffer

  @Column({ name: 'private_key', type: 'binary', length: 64, nullable: true })
  privateKey: Buffer | null

  @Column({
    name: 'community_uuid',
    type: 'char',
    length: 36,
    nullable: true,
    collation: 'utf8mb4_unicode_ci',
  })
  communityUuid: string | null

  @Column({ name: 'authenticated_at', type: 'datetime', nullable: true })
  authenticatedAt: Date | null

  @Column({ name: 'name', type: 'varchar', length: 40, nullable: true })
  name: string | null

  @Column({ name: 'description', type: 'varchar', length: 255, nullable: true })
  description: string | null

  @CreateDateColumn({ name: 'creation_date', type: 'datetime', nullable: true })
  creationDate: Date | null

  @Column({ name: 'gms_api_key', type: 'varchar', length: 512, nullable: true, default: null })
  gmsApiKey: string | null

  @Column({
    name: 'location',
    type: 'geometry',
    default: null,
    nullable: true,
    transformer: GeometryTransformer,
  })
  location: Geometry | null

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

  @OneToMany(
    () => User,
    (user) => user.community,
  )
  @JoinColumn({ name: 'community_uuid', referencedColumnName: 'communityUuid' })
  users: User[]

  @OneToMany(
    () => FederatedCommunity,
    (federatedCommunity) => federatedCommunity.community,
  )
  @JoinColumn({ name: 'public_key', referencedColumnName: 'publicKey' })
  federatedCommunities?: FederatedCommunity[]
}
