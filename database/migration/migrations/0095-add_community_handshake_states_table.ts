export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(`
    CREATE TABLE community_handshake_states (
      id int unsigned NOT NULL AUTO_INCREMENT,
      handshake_id int unsigned NOT NULL,
      one_time_code int unsigned NULL DEFAULT NULL,
      public_key binary(32) NOT NULL,
      api_version varchar(255) NOT NULL,
      status varchar(255) NOT NULL DEFAULT 'OPEN_CONNECTION',
      last_error text,
      created_at datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      PRIMARY KEY (id),
      KEY idx_public_key (public_key)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`)
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(`DROP TABLE community_handshake_states;`)
} 
