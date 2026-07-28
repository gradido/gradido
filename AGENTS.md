AGENTS.md – Gradido Constitutional Foundation
This document establishes the inviolable ethical pillars of the Gradido ecosystem. Every architectural decision, data model, and AI integration must operate strictly within these bounds.

Pillar 1: The Gradido Philosophical Core
The system is bound by the Three Natural Laws (Symbiosis & Cooperation, Cycle of Becoming and Passing Away, Support of the Living) and the Triple Good (Individual, Community, Whole). The agency and sovereignty of the Individual are non-negotiable. The system must never sacrifice user autonomy for administrative convenience.

Pillar 2: European Legal Frameworks
The system is built in full alignment with the GDPR (DSGVO) and the EU Charter of Fundamental Rights. Data processing must be fair, transparent, and purpose-limited. The user is always the sovereign of their own data and identity.

Pillar 3: Responsible AI Architecture
Large Language Models are proposal engines, not autonomous decision-makers. They must never synthesize, infer, or guess subjective human attributes (such as identity, orientation, or personal preference) to fill gaps in user profiles.

---

# Architecture Migration (in progress)

The codebase is mid-transition from an old to a new architecture. Both coexist. Affected modules: `backend`, `federation`, `core`, `database`, `shared`. New code follows the new architecture; touched old code moves toward it. Behaviour must be preserved 1:1 during refactorings.

| Concern | Old | New |
| --- | --- | --- |
| ORM | TypeORM (`database/src/entity`, active record) | Drizzle ORM (`database/src/schemas/drizzle.schema.ts`) |
| Queries | scattered across resolvers/services | centralized in `database/src/queries/[tableName].ts` |
| API | type-graphql + Apollo (GraphQL) | ElysiaJS where it fits better; GraphQL stays where it earns its place — **blocked, see below** |
| Validation | single-purpose validation functions | valibot schemas in `*.schema.ts` — **blocked, see below** |
| Logic placement | inline in TypeScript resolvers | `interactions/` for complex use cases, `data/*.logic.ts` for simple logic (see below) |

Reference implementation for the target style: `dlt-connector`.

## Order of work

Two of the five migrations are **not yet actionable**: both ElysiaJS and valibot need TypeScript 5, which is currently blocked by TypeORM and graphql. Removing those unblocks both — so ORM first, then validation and API. Do not start either before the TypeScript 5 upgrade lands; in the meantime, mark intended schema replacements with a TODO (see `queries/openaiThreads.ts`) rather than working around the missing version.

This makes the ORM migration the critical path: it is not just the foundation, it is what unblocks everything else.

Migrating queries proceeds in three separate steps, never merged into one:

1. **Move** the existing TypeORM query into `database/src/queries/[tableName].ts` unchanged.
2. **Translate** it to Drizzle.
3. **Adjust** the caller's types.

Transaction safety while both ORMs coexist: `AppDatabase` holds a TypeORM `DataSource` and a separate Drizzle pool — two connection pools, so **a TypeORM transaction does not cover Drizzle writes**. Anything that must be atomic has to sit on one ORM. Migrate along transaction boundaries, not table by table.

# Conventions

- Naming: DB tables and columns are `snake_case`; the TypeScript representation is `camelCase`. A table `user_contacts` maps to the schema export `userContactsTable` and the query file `database/src/queries/userContacts.ts`. Existing singular file names (e.g. `queries/user.ts` for `users`) are legacy — new files follow the table name.
- Queries: every DB access lives in `database/src/queries/[tableName].ts` — never inline in a resolver, service, or interaction. Co-located tests are `[tableName].test.ts`.
- **A query belongs to the table it selects `from`**, regardless of what it joins or returns. `from users join transactions` is a user query. Specialized projections have no table of their own, so the return type cannot decide this — `from` can, and it is mechanically checkable.
- Naming inside query files: `db…` for functions that execute (`dbInsertDltTransaction`, `dbSelect…`), `…Query` for builders that are returned for a caller to run (`dltTransactionContributionJoinsQuery`).
- Return types, no hard rule — readability decides. Where a type already exists that describes the shape (an object, or later a valibot schema) and is used in more than one place, name it explicitly so the return type is visible at the call site. Infer it (`typeof someTable.$inferSelect`, `Awaited<ReturnType<typeof someJoinsQuery>>[number]`) where spelling it out would mean inventing a type that exists for no other reason — as with the join projections in `queries/dltTransactions.ts`, which are one-off shapes complex enough that a hand-written copy would only drift from the query.
- Use cases go under `src/interactions/[useCase]/`, with `[UseCase].context.ts` as entry point and `[Role].role.ts` per role. The criterion is **not** size: put it here if the use case is *polymorphic* (several variants of one flow, chosen at runtime — `ResolveKeyPair` picks among six key-pair kinds) or *multi-step* (several steps with intermediate state that the context orchestrates). 150 lines of straight-line flow are not an interaction; 20 lines with three variants are.
- Everything else: `src/data/[Object].logic.ts` — plain rules and helpers with one flow and no orchestration (`KeyPairIdentifier.logic.ts` is only getters and predicates). Do not invent an interaction for logic that fits here.
- Third-party APIs are the exception to the two rules above. Everything that deals with a foreign system lives under `src/apis/[service]/` — the client, the foreign system's own data shapes, the operations against it, its logging views. This code does not move to a top-level `interactions/` or `data/`. Complex API logic may well follow the same interaction / `.logic.ts` pattern, but inside that service's folder. The point of the folder is that foreign shapes stay contained and are translated to Gradido types at a visible place.
- `src/apis` is not uniform yet and its final structure is still an open question. Read what is there as the current state, not as a settled convention, and do not generalise a pattern from a single folder. `apis/anthropic/crea/` in particular is vibe-coded and must **not** be used as a model — its documentation is the best in the tree, which makes it far more tempting to copy than it has earned.
- "Context" and "role" are DCI's terms, and the principle is kept: data objects stay plain, behaviour is added per use case instead of living on the model. What differs from textbook DCI is the mechanism — composition instead of inheritance or runtime role-injection. A role takes the object and adds behaviour around it; it does not derive from it. That is deliberate: the models have an externally fixed shape (TypeORM entities today, valibot-validated objects later), so deriving from them to attach behaviour is not an option, and composing behaviour is what the wider move away from deep inheritance hierarchies points to anyway.
- A context is a plain function, not a class — unlike most DCI examples, which come from languages where everything must be a class. 
- Use classes only where an object genuinely carries state and invariants (`GradidoUnit`); reach for functions everywhere else. 
- A TypeScript developer should have an easy time reading and understanding the code.
- Validation: valibot schemas in `*.schema.ts`, kept next to what they validate. Validate at the boundary, then trust the parsed type inward. Export both `v.InferInput` and `v.InferOutput` types where a schema transforms.
- Enums: `src/data/[Name].enum.ts`.
- Tests: co-located `*.test.ts`, run with `bun test`.

# Error handling

This is not throw-vs-return as a blanket rule — it depends on what kind of failure it is. There are no throw-free zones in this codebase; the question is always which kind of failure you are looking at.

The main reason to return expected failures rather than throw them: TypeScript has no checked exceptions. A signature `Promise<User>` does not reveal that the function throws, so nothing forces the caller to handle it and nothing breaks when the failure mode changes. `Promise<Result<User, DBNotFoundError>>` puts the failure in the contract, and the compiler makes the caller deal with it. Secondary, and only relevant in hot paths: `throw` also costs more, because constructing an `Error` captures a stack trace.

**Throw on programmer error.** A function called with parameters it was never meant to receive is a bug in the caller, not a runtime condition. It should crash, loudly and as early as possible — ideally during testing. Do not soften these into return values; a swallowed programmer error is a bug that ships. This applies everywhere, query functions included — a query handed a nonsensical argument may well throw. What matters is the kind of failure, not the layer it happens in.

**Return expected failures.** Anything that can legitimately go wrong at runtime — row not found, insert rejected, unhandled enum value — is an expected result, not an exception. Return the combined result object from `shared`:

```ts
type Result<T, E = Error> = { success: true; value: T } | { success: false; error: E }
type VoidResult<E = Error> = { success: true } | { success: false; error: E }
```

`success: true` carries `value`, `success: false` carries `error`. Use `VoidResult` when there is nothing to return on success.

**Exempt: functions that always succeed on valid input.** If correct parameters always produce the expected result, there is no failure to model — return the value plainly. Do not wrap these in `Result`:

```ts
export const durationInMinutesFromDates = (startDate: Date, endDate: Date): number => {
  const diff = endDate.getTime() - startDate.getTime()
  return Math.floor(diff / (1000 * 60))
}
```

**`try`/`catch` belongs at the edge.** Once the migration is done, catch blocks should sit mainly at the boundaries to the outside world (the API layer), where a crash must be turned into a response. There may be exceptions, but a `try`/`catch` deep inside the call graph is a sign that an expected failure is being thrown instead of returned.

**New error types extend `DomainError`** (`shared/src/errorTypes.ts`, sets `name` from the constructor). Keep them flexible: take the parts as constructor fields and compose the message, rather than accepting one pre-formatted string. This keeps the data inspectable by the caller instead of only readable by a human.

```ts
export class DBNotFoundError extends DomainError {
  constructor(
    public readonly table: string,
    public readonly where: string,
  ) {
    super(`DB_NOT_FOUND in ${table} where: ${where}`)
  }
}
```

Reference implementation: `database/src/queries/dltTransactions.ts` — small error factories at the top of the file, `Result`/`VoidResult` on the functions that execute (the `…Query` builders return the query itself and carry no result type).

**Status:** this approach is new and only applied in a few places so far. Existing code largely still throws. Use it for new code; do not treat throwing code you encounter as the pattern to copy.

**Where this is heading:** once valibot validates input across the board, the many scattered `if`/`else` checks become unnecessary — invalid input is rejected at the boundary, so the code below it can state what it does instead of repeatedly re-checking that it may.

# AI-generated code

When an AI creates a whole new file, that file is marked as AI-generated with a comment on the first line:

```ts
// AI-GENERATED — not an architecture reference
```

This applies to new files written by an AI, not to edits an AI makes to existing human-written files. The marker is a plain, greppable string on purpose: `grep -rn "AI-GENERATED" --include=*.ts` shows at any time which parts of the tree have not been through a human.

**Marked files must not be used as an architecture reference.** Do not copy their structure, their file layout, or their patterns into new code, and do not treat them as evidence of how something is done here. Fluent code and thorough comments are not evidence of a considered design — an AI produces both regardless, which makes generated code more tempting to imitate than it has earned (`apis/anthropic/crea/` is the example in this repo). Take conventions from this document and from the reference implementations it names, never from unreviewed generated code.

Remove the marker once a human has reviewed the file and stands behind it. A marker that is never removed stops meaning anything.

# Judgement calls

- Prefer moving code to the new architecture over duplicating it into both.
- When old and new coexist for the same concern, the new location is the single source of truth; the old path delegates to it rather than reimplementing.
- Pure refactoring means no behaviour change: same inputs, same outputs, same side effects, same errors.
