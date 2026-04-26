export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  // rename old gdd storing columns to legacy
  await queryFn(`
    ALTER TABLE transactions 
    CHANGE amount amount_legacy DECIMAL(40,20) NULL DEFAULT NULL, 
    CHANGE balance balance_legacy DECIMAL(40,20) NULL DEFAULT NULL, 
    CHANGE decay decay_legacy DECIMAL(40,20) NULL DEFAULT NULL; `)
  await queryFn(`
    ALTER TABLE pending_transactions 
    CHANGE amount amount_legacy DECIMAL(40,20) NULL DEFAULT NULL, 
    CHANGE balance balance_legacy DECIMAL(40,20) NULL DEFAULT NULL, 
    CHANGE decay decay_legacy DECIMAL(40,20) NULL DEFAULT NULL; `)
  await queryFn(`
    ALTER TABLE contributions 
    CHANGE amount amount_legacy DECIMAL(40,20) NULL DEFAULT NULL; `)
  await queryFn(`
    ALTER TABLE contribution_links 
    CHANGE amount amount_legacy bigint NULL DEFAULT NULL, 
    CHANGE max_amount_per_month max_amount_per_month_legacy bigint NULL DEFAULT NULL,
    CHANGE max_account_balance max_account_balance_legacy bigint NULL DEFAULT NULL; `)
  await queryFn(`
    ALTER TABLE transaction_links
    CHANGE amount amount_legacy DECIMAL(40,20) NULL DEFAULT NULL,
    CHANGE hold_available_amount hold_available_amount_legacy DECIMAL(40,20) NULL DEFAULT NULL; `)
  await queryFn(`
    ALTER TABLE events 
    CHANGE amount amount_legacy bigint NULL DEFAULT NULL; `)

  // add new columns with gdd storing columns as bigint with gdd4 suffix
  await queryFn(`
    ALTER TABLE transactions 
    ADD COLUMN amount_gdd4 bigint NULL DEFAULT NULL AFTER amount_legacy,
    ADD COLUMN balance_gdd4 bigint NULL DEFAULT NULL AFTER balance_legacy,
    ADD COLUMN decay_gdd4 bigint NULL DEFAULT NULL AFTER decay_legacy; `)
  await queryFn(`
    ALTER TABLE pending_transactions 
    ADD COLUMN amount_gdd4 bigint NULL DEFAULT NULL AFTER amount_legacy,
    ADD COLUMN balance_gdd4 bigint NULL DEFAULT NULL AFTER balance_legacy,
    ADD COLUMN decay_gdd4 bigint NULL DEFAULT NULL AFTER decay_legacy; `)
  await queryFn(`
    ALTER TABLE contributions 
    ADD COLUMN amount_gdd4 bigint NULL DEFAULT NULL AFTER amount_legacy; `)
  await queryFn(`
    ALTER TABLE contribution_links 
    ADD COLUMN amount_gdd4 bigint NULL DEFAULT NULL AFTER amount_legacy, 
    ADD COLUMN max_amount_per_month_gdd4 bigint NULL DEFAULT NULL AFTER max_amount_per_month_legacy, 
    ADD COLUMN max_account_balance_gdd4 bigint NULL DEFAULT NULL AFTER max_account_balance_legacy; `)
  await queryFn(`
    ALTER TABLE transaction_links
    ADD COLUMN amount_gdd4 bigint NULL DEFAULT NULL AFTER amount_legacy,
    ADD COLUMN hold_available_amount_gdd4 bigint NULL DEFAULT NULL AFTER hold_available_amount_legacy; `)
  await queryFn(`
    ALTER TABLE events
    ADD COLUMN amount_gdd4 bigint NULL DEFAULT NULL AFTER amount_legacy; `)

  // transform values from legacy to gdd4
  await queryFn(`
    UPDATE transactions 
    SET amount_gdd4 = CAST(ROUND(amount_legacy * 10000) AS SIGNED),
        balance_gdd4 = CAST(ROUND(balance_legacy * 10000) AS SIGNED),
        decay_gdd4 = CAST(ROUND(decay_legacy * 10000) AS SIGNED); `)
  await queryFn(`
    UPDATE pending_transactions 
    SET amount_gdd4 = CAST(ROUND(amount_legacy * 10000) AS SIGNED),
        balance_gdd4 = CAST(ROUND(balance_legacy * 10000) AS SIGNED),
        decay_gdd4 = CAST(ROUND(decay_legacy * 10000) AS SIGNED); `)
  await queryFn(`
    UPDATE contributions 
    SET amount_gdd4 = CAST(ROUND(amount_legacy * 10000) AS SIGNED); `)
  await queryFn(`
    UPDATE contribution_links
    SET amount_gdd4 = CAST(ROUND(amount_legacy * 10000) AS SIGNED),
        max_amount_per_month_gdd4 = CAST(ROUND(max_amount_per_month_legacy * 10000) AS SIGNED),
        max_account_balance_gdd4 = CAST(ROUND(max_account_balance_legacy * 10000) AS SIGNED); `)
  await queryFn(`
    UPDATE transaction_links
    SET amount_gdd4 = CAST(ROUND(amount_legacy * 10000) AS SIGNED),
        hold_available_amount_gdd4 = CAST(ROUND(hold_available_amount_legacy * 10000) AS SIGNED); `)
  await queryFn(`
    UPDATE events
    SET amount_gdd4 = CAST(ROUND(amount_legacy * 10000) AS SIGNED); `)

  // validate that transformation take place without precision lost at the first 4 decimal places
  const tableValuePairs = {
    transactions: ['amount', 'balance', 'decay'],
    pending_transactions: ['amount', 'balance', 'decay'],
    contributions: ['amount'],
    contribution_links: ['amount', 'max_amount_per_month', 'max_account_balance'],
    transaction_links: ['amount', 'hold_available_amount'],
    events: ['amount'],
  }
  for (const [table, columns] of Object.entries(tableValuePairs)) {
    for (const column of columns) {
      const result = await queryFn(`
        SELECT 
          ${column}_legacy,
          ${column}_gdd4,
          ${column}_gdd4 / 10000 AS reconstructed
        FROM ${table}
        WHERE ABS(${column}_legacy - (${column}_gdd4 / 10000)) > 0.00005
        ;`)
      if (result.length > 0) {
        // biome-ignore lint/suspicious/noConsole: no logger in migration
        console.error(
          `Precision lost in ${table}.${column} in ${result.length} rows, first 10 rows: ${JSON.stringify(result.slice(0, 10), null, 2)}`,
        )
      }
    }
  }
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  // transform values from gdd4 to legacy
  await queryFn(`
    UPDATE transactions 
    SET amount_legacy = CAST(amount_gdd4 / 10000 AS DECIMAL(40,20)),
        balance_legacy = CAST(balance_gdd4 / 10000 AS DECIMAL(40,20)),
        decay_legacy = CAST(decay_gdd4 / 10000 AS DECIMAL(40,20)); `)
  await queryFn(`
    UPDATE pending_transactions 
    SET amount_legacy = CAST(amount_gdd4 / 10000 AS DECIMAL(40,20)),
        balance_legacy = CAST(balance_gdd4 / 10000 AS DECIMAL(40,20)),
        decay_legacy = CAST(decay_gdd4 / 10000 AS DECIMAL(40,20)); `)
  await queryFn(`
    UPDATE contributions 
    SET amount_legacy = CAST(amount_gdd4 / 10000 AS DECIMAL(40,20)); `)
  await queryFn(`
    UPDATE contribution_links
    SET amount_legacy = CAST(amount_gdd4 / 10000 AS SIGNED), 
        max_amount_per_month_legacy = CAST(max_amount_per_month_gdd4 / 10000 AS SIGNED), 
        max_account_balance_legacy = CAST(max_account_balance_gdd4 / 10000 AS SIGNED); `)
  await queryFn(`
    UPDATE transaction_links
    SET amount_legacy = CAST(amount_gdd4 / 10000 AS DECIMAL(40,20)),
        hold_available_amount_legacy = CAST(hold_available_amount_gdd4 / 10000 AS DECIMAL(40,20)); `)
  await queryFn(`
    UPDATE events
    SET amount_legacy = CAST(amount_gdd4 / 10000 AS SIGNED); `)
  // rename legacy columns back to original names
  await queryFn(`
    ALTER TABLE transactions 
    CHANGE amount_legacy amount DECIMAL(40,20) NULL DEFAULT NULL, 
    CHANGE balance_legacy balance DECIMAL(40,20) NULL DEFAULT NULL, 
    CHANGE decay_legacy decay DECIMAL(40,20) NULL DEFAULT NULL; `)
  await queryFn(`
    ALTER TABLE pending_transactions
    CHANGE amount_legacy amount DECIMAL(40,20) NULL DEFAULT NULL, 
    CHANGE balance_legacy balance DECIMAL(40,20) NULL DEFAULT NULL, 
    CHANGE decay_legacy decay DECIMAL(40,20) NULL DEFAULT NULL; `)
  await queryFn(`
    ALTER TABLE contributions
    CHANGE amount_legacy amount DECIMAL(40,20) NULL DEFAULT NULL; `)
  await queryFn(`
    ALTER TABLE contribution_links
    CHANGE amount_legacy amount bigint NULL DEFAULT NULL, 
    CHANGE max_amount_per_month_legacy max_amount_per_month bigint NULL DEFAULT NULL, 
    CHANGE max_account_balance_legacy max_account_balance bigint NULL DEFAULT NULL; `)
  await queryFn(`
    ALTER TABLE transaction_links
    CHANGE amount_legacy amount DECIMAL(40,20) NULL DEFAULT NULL, 
    CHANGE hold_available_amount_legacy hold_available_amount DECIMAL(40,20) NULL DEFAULT NULL; `)
  await queryFn(`
    ALTER TABLE events
    CHANGE amount_legacy amount bigint NULL DEFAULT NULL; `)
  // remove new columns
  await queryFn(`
    ALTER TABLE transactions 
    DROP COLUMN amount_gdd4, 
    DROP COLUMN balance_gdd4, 
    DROP COLUMN decay_gdd4; `)
  await queryFn(`
    ALTER TABLE pending_transactions 
    DROP COLUMN amount_gdd4, 
    DROP COLUMN balance_gdd4, 
    DROP COLUMN decay_gdd4; `)
  await queryFn(`
    ALTER TABLE contributions 
    DROP COLUMN amount_gdd4; `)
  await queryFn(`
    ALTER TABLE contribution_links 
    DROP COLUMN amount_gdd4, 
    DROP COLUMN max_amount_per_month_gdd4, 
    DROP COLUMN max_account_balance_gdd4; `)
  await queryFn(`
    ALTER TABLE transaction_links 
    DROP COLUMN amount_gdd4, 
    DROP COLUMN hold_available_amount_gdd4; `)
  await queryFn(`
    ALTER TABLE events 
    DROP COLUMN amount_gdd4; `)
}
