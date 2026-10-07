# config-schema

Valibot schemas for the environment of every module, and the parser that reads a module's
CONFIG out of `process.env` with them (`parseConfig`). A module describes what its environment
can set, with the value used where it does not, and derives the rest in a transform.

Two entries:

- `config-schema` for Node: the schemas, the parser and the log4js setup.
- `config-schema/schema` for the browser as well: the schemas and the parser only. frontend
  and admin read it, because their config runs in the browser too.

## Bun-Compatibility
Full bun compatible
