# database

## Bun-Compatibility

This module uses `TypeORM` and `ts-mysql-migrate`. Bun currently has several issues running it:

### Known Issues

1. **`Geometry` type not recognized**  
   `Geometry` must be imported as type:
   ```ts
   import type { Geometry } from 'typeorm'
   ```
2. **Circular imports between entities**
Bun fails when two entities import each other (e.g., via @ManyToOne / @OneToMany). Node.js tolerates this, Bun does not.

3. ts-mysql-migrate **breaks**
Bun crashes due to unsupported module.parent.parent.require():
```ts
TypeError: undefined is not an object (evaluating 'module.parent.parent.require')
```

## Upgrade migrations

```bash
turbo up
```

On a database without any table, `up` does not run the migrations: it builds the tables from
`src/schemas/drizzle.schema.ts` and records every migration in `migrations` as done, so the
next `up` starts after the last one. That takes about a second instead of running all of
them. `migration/createFromSchema.test.ts` holds the result against a database built by the
migrations, so a migration that changes a table has to change the schema with it.

To run every migration on an empty database anyway:

```bash
bun run up --migrations
```

## Downgrade migrations 

```bash
turbo down
```


## Reset database

```bash
turbo reset
```

Runs all down migrations and after this all up migrations.

## Clear database
call truncate for all tables

```bash
turbo clearDB
```


## Tests
Currently written for vitest, but can be transformed into bun test after switching out TypeORM with DrizzleORM