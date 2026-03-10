export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(
    `ALTER TABLE project_brandings ADD UNIQUE INDEX project_brandings_alias_unique (alias);`,
  )
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(`ALTER TABLE project_brandings DROP INDEX project_brandings_alias_unique;`)
}
