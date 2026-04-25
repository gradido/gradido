export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  // rename old gdd storing columns to legacy
  await queryFn(`
    ALTER TABLE transactions 
    CHANGE amount amount_legacy DECIMAL(40,20) NULL DEFAULT NULL, 
    CHANGE balance balance_legacy DECIMAL(40,20) NULL DEFAULT NULL, 
    CHANGE decay decay_legacy DECIMAL(40,20) NULL DEFAULT NULL; `
  )  
  await queryFn(`
    ALTER TABLE pending_transactions 
    CHANGE amount amount_legacy DECIMAL(40,20) NULL DEFAULT NULL, 
    CHANGE balance balance_legacy DECIMAL(40,20) NULL DEFAULT NULL, 
    CHANGE decay decay_legacy DECIMAL(40,20) NULL DEFAULT NULL; `
  )  
  await queryFn(`
    ALTER TABLE contributions 
    CHANGE amount amount_legacy DECIMAL(40,20) NULL DEFAULT NULL; `
  )  
  await queryFn(`
    ALTER TABLE transaction_links
    CHANGE amount amount_legacy DECIMAL(40,20) NULL DEFAULT NULL,
    CHANGE hold_available_amount hold_available_amount_legacy DECIMAL(40,20) NULL DEFAULT NULL; `
  )
  
  // add new columns with gdd storing columns as bigint with gdd4 suffix
  await queryFn(`
    ALTER TABLE transactions 
    ADD COLUMN amount_gdd4 bigint NULL DEFAULT NULL AFTER amount_legacy,
    ADD COLUMN balance_gdd4 bigint NULL DEFAULT NULL AFTER balance_legacy,
    ADD COLUMN decay_gdd4 bigint NULL DEFAULT NULL AFTER decay_legacy; `
  )
  await queryFn(`
    ALTER TABLE pending_transactions 
    ADD COLUMN amount_gdd4 bigint NULL DEFAULT NULL AFTER amount_legacy,
    ADD COLUMN balance_gdd4 bigint NULL DEFAULT NULL AFTER balance_legacy,
    ADD COLUMN decay_gdd4 bigint NULL DEFAULT NULL AFTER decay_legacy; `
  )
  await queryFn(`
    ALTER TABLE contributions 
    ADD COLUMN amount_gdd4 bigint NULL DEFAULT NULL AFTER amount_legacy; `
  )
  await queryFn(`
    ALTER TABLE transaction_links
    ADD COLUMN amount_gdd4 bigint NULL DEFAULT NULL AFTER amount_legacy,
    ADD COLUMN hold_available_amount_gdd4 bigint NULL DEFAULT NULL AFTER hold_available_amount_legacy; `
  )
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  // rename legacy columns back to original names
  await queryFn(`
    ALTER TABLE transactions 
    CHANGE amount_legacy amount DECIMAL(40,20) NULL DEFAULT NULL, 
    CHANGE balance_legacy balance DECIMAL(40,20) NULL DEFAULT NULL, 
    CHANGE decay_legacy decay DECIMAL(40,20) NULL DEFAULT NULL; `
  )
  await queryFn(`
    ALTER TABLE pending_transactions
    CHANGE amount_legacy amount DECIMAL(40,20) NULL DEFAULT NULL, 
    CHANGE balance_legacy balance DECIMAL(40,20) NULL DEFAULT NULL, 
    CHANGE decay_legacy decay DECIMAL(40,20) NULL DEFAULT NULL; `
  )
  await queryFn(`
    ALTER TABLE contributions
    CHANGE amount_legacy amount DECIMAL(40,20) NULL DEFAULT NULL; `
  )
  await queryFn(`
    ALTER TABLE transaction_links
    CHANGE amount_legacy amount DECIMAL(40,20) NULL DEFAULT NULL, 
    CHANGE hold_available_amount_legacy hold_available_amount DECIMAL(40,20) NULL DEFAULT NULL; `
  )

  // remove new columns
  await queryFn(`
    ALTER TABLE transactions 
    DROP COLUMN amount_gdd4, 
    DROP COLUMN balance_gdd4, 
    DROP COLUMN decay_gdd4; `
  )
  await queryFn(`
    ALTER TABLE pending_transactions 
    DROP COLUMN amount_gdd4, 
    DROP COLUMN balance_gdd4, 
    DROP COLUMN decay_gdd4; `
  )
  await queryFn(`
    ALTER TABLE contributions 
    DROP COLUMN amount_gdd4; `
  )
  await queryFn(`
    ALTER TABLE transaction_links 
    DROP COLUMN amount_gdd4, 
    DROP COLUMN hold_available_amount_gdd4; `
  )
}