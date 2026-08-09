import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm'

// One moderator conversation with Crea in the admin chat window (CreaChat).
//
// The Anthropic Messages API is stateless — the whole exchange travels with every
// request — so we keep the transcript ourselves. It is stored as a JSON array on the
// thread row rather than as one row per message, because that is the shape every
// access needs: load the complete thread, append a user/assistant pair, save. Nothing
// ever reads or writes a single message.
//
// updated_at carries the expiry: a thread untouched for 60 days is dropped, the same
// lifetime the OpenAI threads had.
@Entity('creachat_threads', {
  engine: 'InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci',
})
export class CreaChatThread extends BaseEntity {
  @PrimaryColumn({ type: 'char', length: 36 })
  id: string

  @Index('idx_creachat_threads_user_id')
  @Column({ name: 'user_id', type: 'int', unsigned: true, nullable: false })
  userId: number

  /** The exchange as a JSON array of `{ role, content }`, oldest first. */
  @Column({ type: 'longtext', nullable: false })
  messages: string

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 3 })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime', precision: 3 })
  updatedAt: Date
}
