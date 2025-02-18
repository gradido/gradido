import { Entity, PrimaryGeneratedColumn, Column, BaseEntity } from 'typeorm'

@Entity('project_brandings')
export class ProjectBranding extends BaseEntity {
  @PrimaryGeneratedColumn('increment', { unsigned: true })
  id: number

  @Column({ name: 'name', type: 'varchar', length: 255 })
  name: string

  @Column({ name: 'alias', type: 'varchar', length: 32 })
  alias: string

  @Column({ name: 'description', type: 'text', nullable: true, default: null })
  description: string | null

  @Column({ name: 'space_id', type: 'int', unsigned: true, nullable: true, default: null })
  spaceId: number | null

  @Column({ name: 'space_url', type: 'varchar', length: 255, nullable: true, default: null })
  spaceUrl: string | null

  @Column({ name: 'new_user_to_space', type: 'tinyint', width: 1, default: 0 })
  newUserToSpace: boolean

  @Column({ name: 'logo_url', type: 'varchar', length: 255, nullable: true, default: null })
  logoUrl: string | null
}
