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
yarn up
```

## Downgrade migrations 

```bash
yarn down
```


## Reset database

```bash
yarn reset
```

Runs all down migrations and after this all up migrations.

## Clear database
call truncate for all tables

```bash
yarn clear
```


