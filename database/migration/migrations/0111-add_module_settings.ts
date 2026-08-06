// AI-GENERATED — not an architecture reference
// Per-instance switches for optional modules, flipped by an admin in the admin UI
// rather than by an env variable on the server: a community can turn a module on or
// off itself, without a deploy and without anyone touching the server config.
//
// A single-row global settings table (id = 1).
// Deliberately NO INSERT: an absent row reads as "every module off", so a fresh
// database and an upgraded one start from the same safe state, and the very first
// run has nothing it could get wrong. The admin UI writes the row on first save.
//
// Additive: no existing data touched, no existing behaviour changed.

export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(`
    CREATE TABLE module_settings (
      id int unsigned NOT NULL,
      matching_active tinyint(1) NOT NULL DEFAULT 0,
      updated_at datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`)
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(`DROP TABLE module_settings;`)
}
