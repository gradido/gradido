import { BaseEntity, Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm'

// Per-instance switches for optional modules, flipped by an admin in the admin UI
// instead of by an env variable on the server. A single-row singleton (id = 1), the
// same shape as CreaSetting.
//
// The row may be absent: a fresh install has no row until an admin saves for the
// first time, and an absent row means every module is off. Readers must therefore
// treat "no row" as off rather than as "unknown" - see readModuleSettings.
@Entity('module_settings', {
  engine: 'InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci',
})
export class ModuleSetting extends BaseEntity {
  @PrimaryColumn({ type: 'int', unsigned: true })
  id: number

  // The matching module: the matching entries. Off means the backend refuses their
  // rights outright, not just that the menu hides them. The matching map and search
  // follow in their own delivery; the legacy GMS playground is a different feature and
  // is deliberately not covered by this switch.
  @Column({ name: 'matching_active', type: 'bool', nullable: false, default: false })
  matchingActive: boolean

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime', precision: 3 })
  updatedAt: Date
}
