// Adds the Crea fast-mode switch to the runtime settings (crea_settings, single row).
// Fast mode runs the same model with faster output at premium pricing; it is only
// available on some models, so the backend falls back to a normal call when the API
// rejects it. Additive and off by default: nothing changes until an admin enables it.

export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn('ALTER TABLE `crea_settings` ADD COLUMN `fast_mode` tinyint(1) NOT NULL DEFAULT 0;')
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn('ALTER TABLE `crea_settings` DROP COLUMN `fast_mode`;')
}
