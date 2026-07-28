# Crea — the moderation assistant

Crea helps moderators review community contributions ("Gemeinwohl-Beiträge"). For a
contribution it returns a **decision recommendation** and a **drafted reply** to the
member. It is **advisory only**: confirming, denying and sending always stay with the
moderator.

Crea runs on the Claude API. It is **dormant** unless `ANTHROPIC_ACTIVE=true` and an
`ANTHROPIC_API_KEY` are configured — without them the resolver reports "not enabled" and
the admin UI shows a calm hint instead of an error.

## Why this document exists

Code comments across `backend/src/apis/anthropic/` and the Crea admin components carry
short references like `E-019` or `DO-3`. This folder resolves them:

| Notation | Meaning |
|---|---|
| `E-001` … `E-028` | A recorded **design decision** — the *why* behind a choice. See [decisions.md](decisions.md). |
| `DO-1` … `DO-5` | A **build step** of the original rollout (see below). |
| "Layer 3" | The deterministic code layer — see the three layers below. |

## The three layers

The central design idea (decision **E-002**) is that Crea's *behaviour* and the
*creation rules* are two separate things, and that money arithmetic belongs in neither —
it belongs in code. Keeping them apart means a community admin can one day edit the
rules without being able to break Crea's voice or output format.

| Layer | What it holds | Where it lives |
|---|---|---|
| **1 — Behaviour** | Crea's voice, the answer modes, the output format, how uncertainty is surfaced. Stable, owned by the maintainers. | `backend/src/apis/anthropic/crea/ruleset.ts` |
| **2 — Creation rules** | What counts as a contribution to the common good. Variable, per community in the long run. | `ruleset.ts` (as data; an editable source is the planned next step) |
| **3 — Deterministic code** | Hour arithmetic, the authoritative discrepancy check, the local salutation fill. Never the model's job. | `crea/deterministics.ts`, `crea/postprocess.ts` |

The rule corpus is small (~6k tokens) and is sent as a **cached prefix**, so no retrieval
or vector store is involved (decisions **E-002**, **E-011**).

## Privacy design

Crea never receives the member's or the moderator's name. The model writes the
placeholders `[ANREDE]` (salutation) and `[SIGNATUR]` (signature); the code fills them in
locally, in the browser or the backend, after the API call returns. Persisted evaluation
records are pseudonymous — community readable, person a pseudonym, no name
(decisions **E-005**, **E-010**, **E-013**, **E-014**).

> The placeholder tokens and a few flag names are German for historical reasons.
> New code should use English identifiers throughout.

## Data flow

1. A moderator clicks the Crea button on a contribution row in the admin creation list.
2. The backend assembles: the cached rules prefix, the contribution text, the hard money
   facts from the database (entered hours, GDD, monthly cap, date, status) and — where
   available — the member's pseudonymous history.
3. Claude returns **structured output** (`output_config.format`): the recognised
   activities with hours, a per-activity and an overall verdict, a confidence, the applied
   rule key, a reasoning and the drafted reply.
4. Layer 3 post-processing runs: the code recomputes the hour discrepancy and **overrides**
   the model's suggestion (it is authoritative), and fills `[ANREDE]`.
5. The result is persisted as one pseudonymous record per activity, and shown in the modal.

The verdict space is deliberately **{confirm, inquire}** — Crea never recommends a
rejection on its own (decision **E-008**). A rejection is a moderator action; only then
does Crea draft the rejection text.

## Code map

| Area | Path |
|---|---|
| Claude client, prompt assembly | `backend/src/apis/anthropic/AnthropicClient.ts` |
| Rules (behaviour + creation rules) | `backend/src/apis/anthropic/crea/ruleset.ts` |
| Deterministic layer, salutation | `backend/src/apis/anthropic/crea/deterministics.ts`, `nameGender.ts` |
| Structured output schema | `backend/src/apis/anthropic/crea/outputSchema.ts` |
| Shared post-processing | `backend/src/apis/anthropic/crea/postprocess.ts` |
| Evaluation records | `backend/src/apis/anthropic/crea/records.ts`, `database/src/entity/CreaRecord.ts` |
| Runtime settings (model, effort) | `backend/src/apis/anthropic/crea/settings.ts`, `database/src/entity/CreaSetting.ts` |
| Preview without an API key | `backend/src/apis/anthropic/crea/stub.ts` (opt-in via `CREA_STUB`) |
| GraphQL entry point | `backend/src/graphql/resolver/CreaResolver.ts` |
| Admin modal and settings page | `admin/src/components/CreaEvaluationModal.vue`, `admin/src/pages/CreaSettings.vue` |

## Build steps referenced in comments

| Step | What it delivered |
|---|---|
| **DO-1** | Thin slice: Anthropic client, ruleset seed, output schema, resolver. |
| **DO-2** | Deterministic layer (hours, discrepancy, salutation heuristic). |
| **DO-3** | Data layer: the `crea_records` table and the additive user salutation/signature columns. |
| **DO-4** | Admin UI: the per-row button, the evaluation modal, the settings page. |
| **DO-5** | Production key and configuration — the step that makes Crea live. |

## Taxonomy

Every evaluated activity is tagged into a curated, **canonically English** category
taxonomy (`category_key`), so aggregation works across languages and communities. This is
classification into fixed buckets, not retrieval — no vector database is involved
(decision **E-006**).
