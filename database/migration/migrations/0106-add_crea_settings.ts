// DO-4: Crea runtime settings. A single-row global settings table (id = 1) that lets
// an admin switch Crea's Claude model + effort level from the admin UI, applied for
// all moderators. Both value columns nullable (null model = the ANTHROPIC_MODEL env
// default; null effort = 'disabled'). Additive: no existing data touched. Global for
// now; a community_id column can extend it to per-community later.

export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(`
    CREATE TABLE crea_settings (
      id int unsigned NOT NULL,
      model varchar(64) DEFAULT NULL,
      effort varchar(12) DEFAULT NULL,
      updated_at datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`)
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(`DROP TABLE crea_settings;`)
}
