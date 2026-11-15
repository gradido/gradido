// AI-GENERATED — not an architecture reference
// Whether a matching entry finds only the members who carry the same sentence: the "genau" of
// an entry (Kongress-Anbindung KA-020). A project link sets it; it falls when the member changes
// the sentence or the kind of the entry.
//
// ⭐ Nullable with no default, and for every existing row NULL is the truth: none of them was
// ever decided. 1 is on, 0 is taken off by the member -- kept apart from NULL on purpose, because
// a link sets it only where it was never decided and leaves one the member took off alone.
//
// `IF NOT EXISTS`, as 0126 does: DDL does not roll back, and a retry has to finish what is
// missing instead of dying on `Duplicate column name`.
export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(
    'ALTER TABLE `matching_entries` ADD COLUMN IF NOT EXISTS `exact_sentence` TINYINT(1) DEFAULT NULL;',
  )
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn('ALTER TABLE `matching_entries` DROP COLUMN IF EXISTS `exact_sentence`;')
}
