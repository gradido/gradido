# DLT Connector

## Overview

This implements the **DLT Connector** using [gradido-blockchain-js](https://github.com/gradido/gradido-blockchain-js) as a Node module.  
[gradido-blockchain-js](https://github.com/gradido/gradido-blockchain-js) builds the native library [gradido_blockchain](https://github.com/gradido/gradido_blockchain) via SWIG, making it accessible to Node.js.

Most of the Logic is handled by gradido-blockchain.
The connector’s purpose is to send Gradido transactions, serialized in blockchain format, through the Hiero SDK into the Hedera Network as Topic Messages.  
The [gradido-node](https://github.com/gradido/gradido_node) listens to these Hedera/Hiero topics, validates the transactions, and stores them efficiently.  
Transactions can then be retrieved via a JSON-RPC 2.0 API from [gradido-node](https://github.com/gradido/gradido_node)

---

## Structure

The module makes extensive use of schema validation with [Valibot](https://valibot.dev/guides/introduction/).  
All objects without internal logic are represented as Valibot schemas, with their corresponding TypeScript types inferred automatically.  
Valibot allows clear separation of *input* and *output* types, reducing the need for repetitive `null | undefined` checks.  
When a function expects an output type, TypeScript ensures that the data has been validated via `parse` or `safeParse`, guaranteeing type safety at runtime.

---

### `src/bootstrap`
Contains initialization code executed once at program startup by `src/index.ts`.

### `src/cache`
Contains code for caching expensive computations or remote data.  
Currently used only by `KeyPairCacheManager`.

### `src/client`
Contains the client implementations for communication with  
[`gradido-node`](https://github.com/gradido/gradido_node), the backend, and the Hiero service.  
Each `<Name>Client` class is a singleton providing:
- configuration and connection management  
- API-call methods mirroring the target service  
Each client may include optional `input.schema.ts` and/or `output.schema.ts` files defining Valibot schemas for its complex data structures.

### `src/config`
Contains the Valibot-based configuration schema, default values, and logic for parsing `process.env`.  
If a required field is missing or invalid, the module prints an error and terminates the process.

### `src/data`
Contains DCI (Data-Context-Interaction) Data Objects:  
simple domain objects that are difficult to express as Valibot schemas, as well as Logic Objects containing core business logic.  
Also includes domain enums.

### `src/interactions`
Contains complex business logic (Interactions in DCI terms).  
Each use case resides in its own subfolder with one Context Object and corresponding Role Objects.

### `src/schemas`
Contains Valibot schemas shared across multiple parts of the program.

### `src/server`
Contains the [Elysia](https://elysiajs.com/at-glance.html)-based REST API used by the backend to submit new Gradido transactions.  
It is intended to integrate with Valibot schemas; currently, it uses `@sinclair/typebox` to convert Valibot schemas to the native format expected by Elysia.

### `src/utils`
Contains small, generic helper functions that do not clearly fit into any of the other directories.

---
