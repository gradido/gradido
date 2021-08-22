import { Migration, MigrationConnection } from 'ts-mysql-migrate';

const run = async () => {
  
/**** mysqljs example ****/

/*
   const poolConfig: PoolConfig = {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,

  };

  const pool = createPool(poolConfig);

  migration = new Migration({
    conn: pool,
    tableName: 'migrations',
    dir: `./src/migrations/`
  });

*/

/**** node-mysql2 example ****/

const poolConfig: ConnectionOptions = {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
  };

  const pool = createPool(poolConfig); // make sure that you are not using mysl2/promise lib

  const migration = new Migration({
    conn: pool as unknown as mysql.Connection,
    tableName: 'migrations',
    dir: `./src/migrations/`
  });

  await migration.initialize();
  
  await migration.up();       // use for upgrade script
  // await migration.down();  // use for downgrade script
  // await migration.reset(); // use for resetting database
};

run().catch((err) => {
  console.log(err);
});
