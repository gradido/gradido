import { BaseEntity, Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm'

// Global Crea runtime settings (DO-4): the Claude model and effort level an admin
// picks in the admin UI, applied for all moderators. A single-row singleton
// (id = 1). Both value columns nullable: null model = fall back to the
// ANTHROPIC_MODEL env default; null effort = 'disabled' (no adaptive thinking).
// Global for now; a community_id column can extend this to per-community later.
@Entity('crea_settings', {
  engine: 'InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci',
})
export class CreaSetting extends BaseEntity {
  @PrimaryColumn({ type: 'int', unsigned: true })
  id: number

  @Column({
    type: 'varchar',
    length: 64,
    nullable: true,
    default: null,
    collation: 'utf8mb4_unicode_ci',
  })
  model: string | null

  @Column({
    type: 'varchar',
    length: 12,
    nullable: true,
    default: null,
    collation: 'utf8mb4_unicode_ci',
  })
  effort: string | null

  // Fast mode: the same model with faster output at premium pricing. Only some models
  // support it, so the backend retries without it when the API rejects the request.
  @Column({ name: 'fast_mode', type: 'bool', nullable: false, default: false })
  fastMode: boolean

  // Who confirms every first creation in their name (ES-005). NULL means no signer,
  // and no signer means the first-creation window is switched off (migration 0131).
  @Column({
    name: 'first_creation_signer_user_id',
    type: 'int',
    unsigned: true,
    nullable: true,
    default: null,
  })
  firstCreationSignerUserId: number | null

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime', precision: 3 })
  updatedAt: Date
}
