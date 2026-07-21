# Crea — design decisions

The *why* behind Crea's design. Code comments reference these by number (`E-019`).
Entries marked ★ are the ones referenced from code; the others are recorded for
completeness. See [README.md](README.md) for the architecture overview.

| # | Decision |
|---|---|
| [E-001](#e-001) | Rebuild on Claude instead of migrating the OpenAI assistant |
| [E-002](#e-002) ★ | Creation rules as data; clean seam between behaviour and rules |
| [E-003](#e-003) | Mention hours only on a logical discrepancy, not on correct capping |
| [E-004](#e-004) ★ | A structured record per contribution (for later statistics/audit) |
| [E-005](#e-005) ★ | Make uncertainty visible, to counter routine confirmation |
| [E-006](#e-006) ★ | Category taxonomy, canonically English, for aggregation |
| [E-007](#e-007) ★ | Persist classification records from day one |
| [E-008](#e-008) ★ | Crea never recommends a rejection; rejecting is a moderator action |
| [E-009](#e-009) ★ | Crea extracts semantically; code supplies the money facts |
| [E-010](#e-010) ★ | Use the member's history as context, never as prejudice |
| [E-011](#e-011) ★ | Structured output; no native citations |
| [E-012](#e-012) ★ | Directional hour discrepancy, special roles, stable rule keys |
| [E-013](#e-013) ★ | Salutation/signature as curated fields; names never reach the model |
| [E-014](#e-014) ★ | Slimmed-down v1 of salutation/signature (revises E-013) |
| [E-015](#e-015) | Bold formatting rendered on display, not a rich-text editor |
| [E-016](#e-016) | Role-dependent visibility of the Crea button (UI guidance only) |
| [E-017](#e-017) ★ | Deviating from Crea's recommendation; context-free regeneration dropped |
| [E-018](#e-018) | One-click "insert draft" via an in-app store |
| [E-019](#e-019) ★ | "Append text": a moderator note on the public contribution, append-only |
| [E-020](#e-020) ★ | Evaluate several contributions of one member together (lean path) |
| [E-021](#e-021) | Crea logo: one CSS-scaled asset |
| [E-022](#e-022) | Gradido colours scoped to Crea for now |
| [E-023](#e-023) | Crea button on the "all" tab, open contributions only |
| [E-024](#e-024) | Crea no longer auto-bolds |
| [E-025](#e-025) ★ | An audible signal when an evaluation arrives |
| [E-026](#e-026) | Three UI refinements (quieter copy, member search, usage hint) |
| [E-027](#e-027) | Search icon in its own column; bulk resubmission reminder |
| [E-028](#e-028) | Model/effort switch stored in the database, admin-only |

---

<a id="e-001"></a>
## E-001 — Rebuild on Claude instead of migrating the OpenAI assistant

The trigger was the OpenAI Assistants sunset: the integration had to be touched anyway, so
a rebuild was not extra work. It also unified control — the persona had been split across
a vector store, a dashboard assistant and a locale `start-prompt`. Risk was low (three
known moderators, copy-and-paste as a fallback). Consequence: a new Anthropic dependency
and `ANTHROPIC_API_KEY`; the Anthropic shape is Messages API + structured output +
caching (there is no "assistant" object and no managed vector store).

<a id="e-002"></a>
## E-002 ★ — Creation rules as data; clean seam between behaviour and rules

The creation rules are treated as a **named, structured document**, not hard-wired into
the prompt. Crea's behaviour (voice, format, procedure) and the rules (what counts as a
contribution to the common good) stay two separate layers.

Why: the mid-term goal is that community admins edit their own creation rules in the
software UI. With this seam that becomes wiring rather than a rewrite — and an admin
editing rules cannot break Crea's behaviour or output format.

<a id="e-003"></a>
## E-003 — Mention hours only on a logical discrepancy

Crea mentions hours or the cap only when the text and the entered value genuinely
disagree — not when the member correctly capped their entry (describing 150 hours but
entering the 50 h / 1000 GDD maximum is fine and gets a warm confirmation). The
arithmetic belongs in code, not in the model. Refined by E-009 and E-012.

<a id="e-004"></a>
## E-004 ★ — A structured record per contribution

Crea returns not only the human-readable reply but a machine-readable record: activity
types, hours per activity, the sum, the entered GDD, a discrepancy flag, the verdict and
the applied rule. v1 uses only the verdict and the reply; the record is stored so that
statistics and audit remain possible later. This is the main argument for structured
output over free text — the previous assistant produced text only, so there was no audit
trail.

<a id="e-005"></a>
## E-005 ★ — Make uncertainty visible

The more convincing a generated answer looks, the more prominently the UI must show where
the moderator still has to intervene — otherwise routine takes over and a shaky passage
gets sent (automation complacency). Fallbacks (for example an unresolved salutation) and
low confidence are marked loudly (inverted text on red) and must be resolved before
sending. Consequence: the structured output carries a confidence field per verdict plus
flags for fallbacks and placeholders; there is no silent full-auto send.

<a id="e-006"></a>
## E-006 ★ — Category taxonomy for aggregation

Every contribution is tagged into a curated category taxonomy (food production, care
work, nature conservation, emergency services, culture, education, …) as a field of the
structured output. The taxonomy is **canonically English** with language-neutral keys, so
contributions in any language map onto the same keys and aggregation works across
communities and countries.

This is classification into fixed buckets, **not** retrieval — no vector database. (For
*matching*, tags were rejected in favour of embeddings elsewhere in the project; for
*aggregation* a fixed taxonomy is the right tool. Both can coexist.)

<a id="e-007"></a>
## E-007 ★ — Persist classification records from day one

The records are written to an additive table from the start — one row per activity —
rather than when the evaluation feature is eventually built, because data not captured is
lost for good. The category definitions stay a versioned configuration file for now.

Consequence for scope: to link a record to the real contribution (community + person
pseudonym), Crea must at least be *input-integrated* — the software passes the
contribution and its metadata to Crea and stores the result. Pure copy-and-paste into a
detached chat cannot do that. Privacy-clean by design: community readable, person a
pseudonym, no name.

<a id="e-008"></a>
## E-008 ★ — Crea never recommends a rejection

Crea's automatic verdict space is **{confirm, inquire}**. For every unclear or borderline
case it goes to an appreciative follow-up question. Rejecting is an explicit moderator
action: only when the moderator clicks "deny" does Crea draft the rejection text.

Why: a human should own every "no". A wrong automatic rejection could turn away a genuine
contribution, while a follow-up question costs nothing and keeps the relationship warm.
It also dissolves the old "when to ask, when to reject" tension — Crea always asks.

This holds for empty or comment-less entries too: Crea asks for a better description
rather than proposing deletion.

<a id="e-009"></a>
## E-009 ★ — Crea extracts semantically; code supplies the money facts

Splitting a contribution into activities is **Crea's** job and its proven strength:
recognising activities in compressed, abbreviated text, assigning (or estimating) hours
per activity, and noticing whether one or several contributions are present.

The **code** supplies only the deterministic money facts per contribution: entered total
hours, GDD amount, the cap, and name/date/status. It cannot split a total across
activities, because members often pack several activities into one entry.

Consequence: the discrepancy check compares Crea's extracted hour sum against the entered
total. Where individual hours are missing, an even split is the fallback, marked with low
confidence (E-005). This corrects the earlier, too-coarse phrasing "Crea does not
calculate".

<a id="e-010"></a>
## E-010 ★ — History as context, not prejudice

A member's earlier contributions, their outcomes, the comments and relevant moderator
dialogue are provided as context for judging a new contribution — pseudonymised, clearly
marked as history versus current.

**Fairness guard rail:** history is context for understanding, never prejudice. An
earlier rejection does not weigh against a new, coherent contribution; Crea judges the
current contribution on its own substance and makes striking patterns visible to the
moderator instead of deciding on them.

Synergy with E-007: the history *is* the body of persisted records. Crea writes a record
today, and that record becomes tomorrow's history — records written (E-007) ↔ history
read (E-010).

<a id="e-011"></a>
## E-011 ★ — Structured output; no native citations

Crea returns structured output via `output_config.format` (`json_schema`): activities
with category key, output type, hours and hour-estimated flag, per-activity and overall
verdict, discrepancy, applied rule, reasoning, reply text, open points and flags.

**Citations clarification:** Anthropic's native citations are incompatible with
`output_config.format` (the API rejects the combination). Structured output is mandatory
for the record and the open-point buttons, so it wins; rule traceability lives in the
self-declared `applied_rule` field plus the reasoning, rather than in hard
document-anchored quotes.

Caching: the rules are sent as a stable, cached prefix; the contribution, history and
code facts follow.

<a id="e-012"></a>
## E-012 ★ — Directional hour discrepancy, special roles, stable rule keys

A review pass that sharpened four seams before implementation:

1. **Directional discrepancy.** Text *below* entered → ask. Text *above* entered → no
   question, appreciate warmly (this also covers correct capping). Roughly equal or no
   figure → no hint. The cap limits submission and is settled on confirmation; the
   monthly sum is computed in code. Crea extracts and writes, the code checks the
   arithmetic deterministically and holds the authoritative flag.
   Schema: `discrepancy ∈ {none, text_below_entered, text_above_entered}`.
2. **Special roles.** Pensioners are always confirmed (with a note about the
   unconditional income); children are appreciated generously and age-appropriately
   without an individual-performance question. Status is only visible from the
   contribution or the history — there is no profile field for it.
3. **Stable rule keys.** `applied_rule` is an append-only enum of semantic keys
   (`confirm_*` / `inquire_*`) rather than free text, so it stays auditable and
   aggregatable across communities and languages.
4. **Field languages.** The reply is in the language of the contribution; the reasoning
   and the rule key are in the moderator's configured software language, passed in per
   call.

<a id="e-013"></a>
## E-013 ★ — Salutation and signature as curated fields; names never reach the model

Guessing a salutation from a first name never becomes clean (initials, multiple given
names, a member who officially is "Petra" but goes by "Paula", a change of name). So the
design uses **moderator-curated, persisted fields** instead of continuous guessing:
`user.gender` (drives the default salutation), `user.salutation` (the free-text form
actually used), and a moderator signature.

**PII stays local:** Crea writes only the placeholders `[ANREDE]` and `[SIGNATUR]`; the
code fills both locally, so neither the member's nor the moderator's name reaches the
model.

**Gender stays code-side and is never sent to the model.** Gender-specific praise was
considered and **rejected**: data protection was not the obstacle, but the effect would
be — stereotyping risk cutting both ways, a contradiction of the principle that a
contribution's worth is independent of the person, and poor controllability at the edges.
Warmth comes from appreciating the *contribution*, not the person's gender.

<a id="e-014"></a>
## E-014 ★ — Slimmed-down v1 of salutation and signature (revises E-013)

After the first live test of the large first-name list, every real name resolved
correctly; only a non-person name fell into the uncertain case, was flagged, and was
trivially fixed in the editable reply text. That made the fuller E-013 build stage
unnecessary for v1:

- No gender buttons and no separate salutation field — the editable reply text plus the
  red "check the salutation" flag cover the rare case.
- The per-member salutation is **not persisted** in v1; the `users.gender` /
  `users.salutation` columns stay additive, nullable and dormant, so nothing has to be
  rolled back if it is ever wanted.
- The signature lives in the browser only; `users.crea_signature` stays dormant.
- The uncertain default became the neutral "Hallo" instead of a gendered form.
- The signature is applied client-side and reactively, which also sharpens E-013's
  privacy line: the moderator's name no longer reaches even our own server.

What remains untouched from E-013: the PII placeholders, the rejection of
gender-specific comments, and making uncertainty visible.

<a id="e-015"></a>
## E-015 — Bold formatting rendered on display

`**bold**` is rendered when a message is displayed, and Cmd/Ctrl+B wraps the selection in
asterisks. Deliberately **not** a WYSIWYG rich-text editor: there is none in the
repository, and introducing one would mean an editor dependency, a storage format other
than plain text, and XSS hardening across two frontends. Safe by construction: the text is
HTML-escaped **first**, then only the bold markers become `<strong>`, so a message can
never inject markup. No database change — the asterisks are plain text.

<a id="e-016"></a>
## E-016 — Role-dependent visibility of the Crea button

A plain moderator sees no Crea column (they do not hold the right); an AI moderator sees
it on the open tab; an administrator sees it on all tabs for testing. This is explicitly
**not** a security boundary — the resolver guard `@Authorized([RIGHTS.AI_SEND_MESSAGE])`
enforces the right; hiding the button is only UI guidance.

<a id="e-017"></a>
## E-017 ★ — Deviating from Crea's recommendation

Two paths: **follow** the recommendation (the draft is already there, no further call) or
**deviate** (which always needs a new text). The UI offers three outcome buttons with
Crea's recommendation preselected, an **optional context field** for the one or two
sentences Crea is missing, and a trigger that appears **only** when deviating.

The same context both turns the verdict and gives the text its warmth, so one field is
enough. Switching buttons is display state only — it costs nothing and does not change
the text; only the explicit trigger calls the model.

**The context-free "regenerate" button was removed:** empirically, without a changed
decision Crea returns nearly the same text, so the button only invited play and cost time
and money. Editing the (editable) field is the better path.

**The upper block freezes.** Crea's first assessment stays visible even when the moderator
deviates — that contrast is the advisory value and the visible warning of E-005. Three
zones, three authors: Crea's voice on top (fixed), the moderator's reason for deviating in
the middle, the joint result below. The follow-up call is a pure writing task; its
reasoning and open points are ignored so they cannot overwrite the frozen block.

For statistics, Crea's **first, uninfluenced** verdict is the meaningful one — the
follow-up call obeys the moderator, so it is worthless as a judgement and must not
overwrite the record.

<a id="e-018"></a>
## E-018 — One-click "insert draft"

Inside the admin, Crea's last draft is held in a small local store and inserted straight
into the reply field — the system clipboard stays untouched. Outside the application
(e-mail, a moderator group) the copy button and the system clipboard remain the only
bridge, because a web application can neither write at another application's caret nor
claim a system-wide shortcut. Sending directly from the modal was **rejected**: it would
skip choosing the tab and editing before sending, which is the moderator's own rule, for
exactly one saved click.

<a id="e-019"></a>
## E-019 ★ — "Append text": a moderator note on the public contribution

Contributions are visible to the community, so a *standing* contribution has to explain
itself — especially when the member's own text is sparse but the moderator knows the
context and confirmed it anyway. Crea therefore has a third output besides the reply and
the internal note: a short **supplement appended to the contribution text**.

**Core principle: append-only — Crea never rewrites the original.** Rewriting a member's
own words would interfere with their personal rights. A clear `💬` marker plus the
moderator's first name shows exactly where a moderator addition was made, so it never
blends into the original.

Details: only on confirmation; the moderator's first name is filled in locally and never
reaches the model; the backend rewrite call returns two texts (reply + supplement). If the
supplement would exceed the memo length limit, the **moderator** shortens it — there is
deliberately no automatic truncation, which follows from the core principle.

<a id="e-020"></a>
## E-020 ★ — Evaluate several contributions of one member together

Some members submit many contributions at once, often similar, with different hours and
dates. The purpose of bundling is **one coherent overall judgement and one reply**,
instead of flooding the member with many near-identical notifications.

Explicitly **not** the monthly cap: the software checks that (it is month-based and also
sees confirmed contributions outside the open list). Crea only checks hour plausibility
per contribution.

**Lean by decision:** a third evaluation path beside single evaluation and rewriting — a
list in, an overall judgement and one reply out — *without* the fine-grained per-activity
records and *without* per-contribution discrepancy. The core benefit does not need them,
and the full granularity can be added later without discarding the lean path.

**No filter symbol** (subtraction): the Crea click uses the row's internal user id to load
that member's open contributions. One contribution → the single case as before; several →
a modal listing them with checkboxes (all preselected, individually deselectable, purely
local state) and one "evaluate" button that starts after the selection.

Deliberately out of scope: bulk setting of status or reminders — that is a separate admin
feature that Crea can dock onto later.

<a id="e-021"></a>
## E-021 — Crea logo

One 256² asset, scaled by CSS at every place it appears, with corners rounded in CSS
rather than baked into the image — one source, easy to adjust.

<a id="e-022"></a>
## E-022 — Gradido colours scoped to Crea

The Gradido palette was defined only in the wallet; the admin loads stock Bootstrap. The
Crea buttons and verdict badge therefore override the Bootstrap variables locally. An
admin-wide unification was deliberately deferred — it has a much larger blast radius and
belongs to the separate design-foundation work.

<a id="e-023"></a>
## E-023 — Crea button on the "all" tab

AI moderators also see the Crea column on the "all" tab, but there the button appears
**only on still-open contributions**, for every role including admin — coherent, because
Crea exists for open processing. Admins keep full test access to closed contributions via
the dedicated status tabs.

<a id="e-024"></a>
## E-024 — Crea no longer auto-bolds

Crea used to be allowed one bold passage per reply and did it routinely, which reads as a
machine tell — a human moderator bolds rarely, and warm short replies seldom carry a word
that deserves it. The instruction was removed. The **capability** stays: display
rendering plus Cmd+B for the moderator, who emphasises when they want to.

<a id="e-025"></a>
## E-025 ★ — An audible signal when an evaluation arrives

Evaluations were sometimes missed, so a short two-tone signal plays when one arrives
(single and bundled mode, on success only). Two pure sine tones a perfect fourth apart
(324 Hz → 432 Hz), generated live via the Web Audio API — **no audio asset** in the
bundle.

<a id="e-026"></a>
## E-026 — Three UI refinements

Copying became a small muted icon (rarely needed since the draft can be inserted
directly); the member search moved from the detail view into the list; and a hint sentence
explains how a draft gets into the contribution — closing an onboarding gap a new
moderator ran into.

<a id="e-027"></a>
## E-027 — Search icon in its own column; bulk resubmission reminder

The search icon moved into its own unlabelled column because it wrapped inside the name
cell. Saving a reminder can offer to apply it to all displayed contributions — but only
for **open** contributions, only within the **displayed** filtered list, and only when the
list shows a **single member** (all rows the same user id). That guard means a reminder
can never spill onto another member's contributions.

<a id="e-028"></a>
## E-028 — Model and effort switch in the database

The model and the effort level moved out of the environment configuration into the
database, so it can be switched in the UI and applies to all moderators immediately, with
the environment value as a fallback — nothing changes until someone switches
deliberately. Global for now, extendable per community. Guarded by a dedicated
`AI_SETTINGS` right, held by AI moderators and admins, rather than borrowing a general
admin right. A "test model" probe catches typos before they would break Crea for everyone.

A model self-report label was **rejected**: models do not reliably know their own
identifier, and a line that merely echoes our own setting would be circular.
