// AI-GENERATED — not an architecture reference
// CreaChat: the moderator's running exchange with Crea in the admin chat window.
//
// The OpenAI Assistants API kept the conversation on its own servers and handed us
// back a thread id; the Anthropic Messages API is stateless, so the transcript has to
// live here. One row per thread with the whole exchange as a JSON array, because that
// is exactly the shape every read and every write needs: we always load the complete
// thread, always append a pair, and never query a single message.
//
// Part 2 drops openai_threads. It only ever held OpenAI thread ids, which stop
// resolving when the Assistants API is switched off — there is nothing in it worth
// keeping. Running chats are lost, which is the intended trade (decided 06.08.).

export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  await queryFn(`
    CREATE TABLE creachat_threads (
      id char(36) NOT NULL,
      user_id int(10) unsigned NOT NULL,
      messages longtext NOT NULL,
      created_at datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      PRIMARY KEY (id),
      KEY idx_creachat_threads_user_id (user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`)

  await queryFn('DROP TABLE IF EXISTS openai_threads;')
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<Array<any>>) {
  // Recreates openai_threads in the shape migrations 0089 + 0094 left it. Empty, of
  // course — the dropped rows are gone, and they were worthless once the Assistants
  // API stopped answering.
  await queryFn(`
    CREATE TABLE openai_threads (
      id VARCHAR(128) PRIMARY KEY,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
      user_id int(10) unsigned NOT NULL
    ) ENGINE = InnoDB;`)

  await queryFn('DROP TABLE creachat_threads;')
}
