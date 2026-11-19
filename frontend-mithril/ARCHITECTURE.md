# The wallet in Mithril: architecture

**A draft.** It was written before any page was ported, from reading the old wallet. It is
corrected once after step 2 (the base) and step 3 (the sign-in pages) of `todo.md`, and binding
from then on. Until then: where the code of those two steps shows a rule here to be wrong, the
rule is changed in the same pull request, not worked around.

The picture in the browser and what the wallet does stay as they are, with one exception that
is named where it stands: how a wait is shown ("Waiting"). This is about how the
code is cut.

## 1. The old wallet, as it is built

| Layer | Where | Size | What it really does |
| --- | --- | --- | --- |
| Views | `components/`, `pages/`, `layouts/` | 226 files, 54,800 lines | Markup, and most of the behaviour: a page asks the server, keeps the answer, validates, navigates. |
| Composables | `composables/` | 67 files, 9,000 lines | Three different things under one name: wrappers Vue or Apollo need (32), real logic (28), and module-level state that outlives a component (7, the large ones). |
| Utils | `utils/` | 94 files, 11,100 lines | Pure logic, 88 of them without Vue. The healthiest layer. |
| Store | `store/` | 580 lines | One Pinia store: who is signed in, their settings, some passing UI state. Written whole to `localStorage` on every change. |
| Server | `plugins/apollo*`, `graphql/` | 139 operations | Apollo with a normalised cache; 81 places ask, 92 change. |
| Routes | `routes/` | 890 lines | A table with layout flags in `meta`, and one guard function with seven steps. |
| Forms | `validation-rules.js`, `validationSchemas.js` | 300 lines | vee-validate rules for four forms, yup schemas for five, hand-written checks for the rest. |

### What reading it showed

**The Apollo cache is hardly used as a cache.** Of the 81 places that ask:

- 58 switch it off (`no-cache`, `network-only`).
- 13 use `cache-and-network`: show the last answer at once, then the new one. These are a
  handful of facts about the member that several places read: `firstCreationStatus` (three
  places), `aliasStatus` (two), the lists of contributions and support requests, the matching
  entries, the address being changed, the tile of friends.
- About 10 use the default and with it share an answer between two places on purpose: the two
  copies of the settings menu (`thankYouCardSettings`, `thankYouCards`), the community switch
  and the send page (`reachableCommunities`, read back with `readQuery`), the lists of creation
  groups.
- Two places write into it so that another page sees a change: the map's ticks into
  `listMatchingEntries`, and the chat thread.

So the wallet needs **one small thing** in the cache's place: a fact about the member that is
asked once, shared, and can be asked again. Not a cache.

**The chat thread uses the cache as its own variable.** `ChatThread.tsx` asks with
`network-only` at every opening, lives only while its window is open, and then patches the
cached answer in five places (`cache.updateQuery`) with pure functions that already exist
(`withOlderPage`, `withArrivals`, `withOwnCopy`, `withChatMessagesEdited`,
`withChatMessagesReacted`). Nothing else reads that entry. In Mithril this is an array in the
component, and the same five functions. No thread store.

**The chat's beat is already independent.** `useChatUpdates.js` is a module with one timer
(15 s, backing off to 120 s, paused while the tab is hidden), `no-cache`, `renewSession: false`,
and four lists of listeners. It ports as a store, nearly unchanged.

**The three picture caches are one design, three times.** `useMemberAvatars` (503 lines,
`localStorage`, 200 entries), `useKeptPictures` (302, keys in `localStorage`, pictures in
memory), `useChatImages` / `memoryPictures` (memory only, three requests at once). Each has a
map by key, a request that is not repeated while it runs, a limit, an "epoch" counter that
throws away answers arriving after a sign-out, and its own `forget…`. None uses Apollo's cache.

**The first-login windows are one rule.** `useFirstLoginWindow.js` is an order of six names and
three sets of flags (`wanted`, `undecided`, `held`); the first name that is not held and wanted
wins, and an undecided one blocks those after it. Twelve lines of logic under 190 lines of
reasons. It ports as it is, as `FirstLoginWindow.logic.ts` and a store of the three sets.

**Signing out is a list.** `useWalletStore.logout` calls twenty `forget…` and `clear…`
functions, one per module that keeps state. Every new module has to be added to it.

## 2. The new wallet

### Folders

```
src/
  main.ts              start: styles, theme, language, routes
  routes.ts            the route table, and what may open a page
  graphql/client.ts    request(): the one way to the server
  data/                *.schema.ts (valibot), *.logic.ts (pure), each with its *.test.ts
  store/               *.store.ts: state that outlives a page
  components/          building blocks, by feature folder as today
  pages/               one file per route, loaded on demand
tests/                 Playwright specs and fixtures
```

Names as in the admin: `Thing.schema.ts`, `Thing.logic.ts`, `thing.store.ts`, components in
`PascalCase.ts`. No `composables/`, no `utils/`: a file is a schema, logic, a store or a
component. What does not fit is a sign that it does two things.

### From the server to the screen

One function: `request`, the wallet's own wrapper around the admin's `graphqlRequest`, which
takes the schema as an argument so that no call can forget it. The admin's client stays as it is.

```ts
const answer = await request(listContributions, variables, contributionListSchema)
if (!answer.success) return toastError(answer.error.message)
this.contributions = answer.value.listContributions
```

- `request` returns `Result<T, GraphqlRequestError>`; it never throws.
- The schema describes what the page uses of the answer, with defaults where the server may
  send null. An answer that does not fit is a failure like any other, and is reported once in
  `request` — not checked field by field afterwards.
- Options: `renewSession: false` (the beat, the panels: a question the member did not ask keeps
  the session's clock where it was), `background: true` (no redraw).
- `request` handles what the Apollo link handled: the token header and its renewal, the revoked
  session, the outdated app. Nothing of that in a page.

### Four kinds of state

Before writing a variable, decide which it is. Most mistakes of the old wallet are a variable of
one kind kept as another.

| Kind | Lives | Where | Example |
| --- | --- | --- | --- |
| **View** | while the component is on screen | a field of the component | the open tab, what is typed, the page of a list, a list a single page shows, the chat thread |
| **Shared fact** | while the member is signed in | `store/*.store.ts`, a `resource` | first-creation status, alias status, balance, reachable communities, the member's own matching entries |
| **Session** | until sign-out, across reloads | `store/wallet.store.ts` | who is signed in, their settings, the token |
| **Device** | until deleted, per member or per device | `data/DeviceValue.logic.ts` | theme, calculator settings, drafts, window size |

Mithril redraws after every event handler and every `request`. A store is therefore a plain
object, and a component reads it in `view`. No subscription, no setter that only assigns, no
copy of a store value in a component. Only what changes outside of Mithril (a timer, another
tab, an observer) calls `m.redraw()`.

**A shared fact** is the one new primitive, in the cache's place:

```ts
export const firstCreation = resource(firstCreationStatus, firstCreationStatusSchema)

firstCreation.value        // the last answer, or undefined
firstCreation.load()       // asks once; a second caller gets the same request
firstCreation.refresh()    // asks again; value stays on screen meanwhile
```

On every visit after the first in a session the last value is drawn at once and replaced when
the new answer comes, without a loading state in between. What is shown on the first visit is
the next section.

`load()` in `oninit` of whoever reads it is "cache-first"; `refresh()` is "cache-and-network";
a page that changed the fact assigns `value` or calls `refresh()`. About 25 lines, in
`store/resource.ts`. Anything asked by one place only is view state and uses `request` directly.

**A device value** is read through its schema and written whole:

```ts
const prefs = deviceValue('calculator-prefs', calculatorPrefsSchema, { perMember: true })
prefs.get()   // parsed, or the schema's defaults where the stored text does not fit
prefs.set(v)
```

It replaces the 33 hand-written `try { JSON.parse(localStorage…) }` with their `typeof` chains.
The stored keys and shapes of today stay readable: a member must not lose a draft by the switch.

### Waiting

**The one place where the new wallet shows something else than the old one, on purpose.** The
old wallet shows the wait differently in every place (nothing, a spinner, a skeleton, the page
without the part). The new one has one way, for a `resource` and for a page's own `request`
alike:

- **Content that is on its way is a `Placeholder`**: a grey shape with a faint shimmer, in the
  form and the size of what comes — `line`, `block` or `row` (a list row with its avatar). The
  space is taken at once, so nothing moves when the answer arrives.
- **It is seen only after 150 ms.** The shape fades in by a CSS delay; an answer faster than
  that shows no placeholder at all, instead of a flicker.
- **Only on the first load.** Where there is a last value, that is drawn (see "A shared fact").
- **A failure is not a wait.** Without an answer the placeholder gives way to a short message
  and "try again". Nothing shimmers for ever.
- **An action gets no placeholder.** The button that was pressed (send, save) is locked and
  carries a small spinner until the answer is here. Placeholders are for content, spinners for
  something the member started.
- The shimmer stands still under `prefers-reduced-motion`, and the region says `aria-busy`
  while it waits.

`Placeholder` takes over the styles of the old `SkeletonLoaderElement`. The old wallet is not
changed for this. For the specs: `samePicture` is taken once the content is there, which is the
same in both wallets; the wait itself has pictures of its own, checked in, for the projects
`new` and `new-phone` only.

### The end of a session

**Before it ends, the member is asked.** 75 seconds before the token runs out a window opens
that cannot be closed by a click beside it: the warning, the seconds counting down, "extend" and
"sign out" (`SessionLogoutTimeout`, as today). Extending asks `verifyLogin`, whose answer carries
a fresh token; if that fails, the session ends with a toast saying so.

**When it ends** — the countdown ran out, "sign out", a revoked session, another member's token
arriving from another tab — the token is removed from `localStorage` and the page is loaded
anew at `/login`. With that every store, every resource, every timer and every request under way
is gone. The list of twenty `forget…` functions and the epoch counters go.

**No flash of the wrong theme or language**, which the reload must not cost:

- The theme is set by the script in `index.html` before the first paint, from
  `gradido-theme-mode`. That key is the device's and is never removed at a sign-out.
- The language stays in the wallet's stored state across a sign-out, as today. `main.ts` reads
  it, fetches its texts, and only then mounts: nothing is drawn in another language first.
- A spec signs out in dark mode and in a language other than the browser's, and holds the first
  frame of the sign-in page to both (step 3 of `todo.md`).

What has to reach the next page (why the session ended, the address to return to) crosses in
`sessionStorage` through the hand-over helper. What is kept on the device per member stays, as
today; what must not stay for the next member on this device is removed in one place,
`wallet.store.ts`, by key.

### Components

- A component is a class with `view`, as in the admin. Its arguments are `attrs`; what it tells
  its parent is a function in `attrs` (`onsaved`, `onclose`). No events, no `expose`: a parent
  that has to reach into a child holds the state itself and hands it down.
- Plain Bootstrap markup is written as markup (`m('.row', m('.col-md-6', …))`). A component
  exists where there is behaviour: `Modal`, `Dropdown`, `Tabs`, `Collapse`, `Carousel`,
  `Popover`, `Pagination`, `Toasts`, `Field`.
- Values that the old wallet handed down through `provide` / `inject` (six, all for the video
  call) are attributes or a store.
- A page reads its route through `m.route.param()`, and the flags the layout needs from the
  route table, not from the page.
- **What runs on a clock uses `every(ms, fn)`**, which pauses while the tab is hidden and
  returns its stop. No `setInterval` in a component or store.
- **What starts in `oncreate` stops in `onremove`**: a timer, the camera, the map, a listener on
  `window`, `document` or `visualViewport`, an observer. One line each, next to each other. A
  request needs no stopping; an answer for a component that is gone assigns to an object nobody
  draws.
- Two pieces of the wallet draw outside the page (`AppModal`, `AvatarZoom`, via `Teleport`):
  they are mounted on `body` once, by the layout, and shown from a store.

### Forms

One schema per form, one `Field` per input. The schema gives the type of the values, the rule
and the key of the message; the field shows the message once it was touched, as today.

```ts
const form = formOf(sendSchema, { identifier: '', amount: '', memo: '' })

m(Field, { form, name: 'amount', label: t('form.amount'), inputmode: 'decimal' })
m('button.btn', { disabled: !form.valid, onclick: () => form.submit(send) })
```

- `form.values`, `form.errors`, `form.valid`, `form.touched`; `submit` parses, and calls with
  the parsed values only where they fit.
- The rules come from `shared` where they exist there (`emailSchema`, `passwordSchema`,
  `aliasSchema`), and from one `data/Form.schema.ts` for amount, memo, message.
- A rule that asks the server (the user name is taken) is not part of the schema: the page asks
  after the schema passed, and sets the field's error.
- Messages stay the i18n keys of today, so the texts under the fields do not change.

### Routes

One table. Each row: path, the page (as `() => import(…)`), and the flags of today's `meta`
(`requiresAuth`, the layout's flags). `routes.ts` turns it into Mithril's `RouteResolver`s:

- `onmatch` runs the guard — the steps of `guards.js` in their order (without the publisher
  id, which is not ported), as one pure
  function `whereTo(route, session) → path | null` in `data/Guard.logic.ts`, tested with the
  cases of `guards.test.js`;
- `render` wraps the page in its layout, so the layout stays mounted from page to page.

### Stores that are more than a value

| Store | Replaces | Shape |
| --- | --- | --- |
| `wallet.store.ts` | `useWalletStore.js`, `store.js` | the session, parsed by one schema at start and at sign-in |
| `chatBeat.store.ts` | `useChatUpdates.js` | timer, unread counts, `onMessages` / `onEdited` / `onReacted` / `watchRead` |
| `pictures.store.ts` | `useMemberAvatars`, `useKeptPictures`, `useChatImages`, `memoryPictures` | `pictureCache({ fetch, atOnce, max, persistKey? })`, used three times |
| `firstLoginWindow.store.ts` | `useFirstLoginWindow.js` | `wanted`, `undecided`, `held`, and `onScreen()` from the logic file |
| `contactWindow.store.ts` | `useContactWindow`, `useContactsPanelHost` | which conversation is open; the window is drawn once, by the layout |
| `appOutdated.store.ts`, theme, viewport | their composables | the admin's |

The chat thread is not in this list: it is view state of `ChatThread` (above).

### Texts, styles, tests

- **Texts:** `t`, `n`, `d` from one `i18n.ts`; a language is fetched when chosen. The keys and
  the JSON files stay.
- **Styles:** the files of the old wallet, through `@frontend`, with the classes they are
  written for. A `*.module.scss` is imported by the component that replaces its Vue component.
- **Tests:** logic and schemas with `bun test` beside the file. Behaviour and picture with
  Playwright against both wallets (`todo.md`, rules 1 and 6). No test mounts a component in a
  made-up DOM.

### How the code is written

The measure: somebody who knows the wallet reads a file from top to bottom once and has
nothing to look up and nothing to skip. Fewer lines are also fewer bytes to download.

- **No function for one line used once.** A function exists because it is called from two
  places, because it is tested on its own, or because its name says what the line cannot. The
  same for a constant, a type and a component.
- **No layer that only passes on.** No wrapper around `request`, a store or a building block
  that adds nothing; no file that only re-exports; no component whose `view` is one other
  component.
- **One way to do a thing**, the one in this document. A second way needs a reason written
  next to it.
- **Types come from the schema** (`v.InferOutput`), written once. No interface beside a schema,
  no enum beside a `picklist`.
- **Trust what was checked.** After the schema, no `?.`, `?? ''` or `typeof` on its fields. No
  `try` around what cannot throw, no `catch` that only logs or throws again.
- **Nothing for later.** No option nobody sets, no parameter with one value, no branch for a
  case the wallet does not have.
- **State once.** Nothing that can be computed is stored; nothing from `attrs` or a store is
  copied into the component.
- **Straight down.** Early `return` instead of nesting; no variable that is used once on the
  next line, unless its name explains the value.
- **Comments say why**, in a line or two, where the code cannot. Not what the line does, not
  how it came to be — that is the commit message. No commented-out code.
- **Names from the wallet's words** (thread, contribution, redeem link), the same word for the
  same thing everywhere, no `data`, `item`, `handle…`, `…Manager`, `…Helper`.
- **A test per behaviour**, not per function, and none that reads source files as text.

The helpers this document introduces had to pass the first rule themselves: `request` (about
170 callers), `deviceValue` (33), `resource` (about 10 facts), `formOf` and `Field` (about 10
forms), `every` (5). A helper that turns out to have one caller in the end is put back inline.

Every pull request names in its description the lines of the old code it replaces and the lines
it adds, tests apart. Where it is not clearly less, it says why.

## 3. Where the old code goes

| Old | New |
| --- | --- |
| a page or component (`.tsx`) | `pages/` or `components/`; its asking and keeping stay in it, its rules move to `data/` |
| a composable that wraps Apollo or Vue (32) | gone: `request`, a `resource`, or a field of the component |
| a composable with logic (28) | `data/*.logic.ts`; the part that keeps state, a store |
| a composable with module state (7) | a store from the table above |
| a util (88 pure) | `data/*.logic.ts`, moved with its test; imported through `@frontend` until its step |
| `useQuery` with `no-cache` / `network-only` | `request` in `oninit` or a handler |
| `useQuery` with the default or `cache-and-network` | a `resource` where two places read it, else `request` |
| `cache.updateQuery`, `readQuery` | assign to the resource or to the component's field |
| `useMutation` | `request` |
| `emit`, `v-model`, `expose` | a function or the value in `attrs` |
| `watch` that mirrors a prop or a store | nothing: `view` reads the source |
| `watch` that starts something | the handler that caused the change |
| `computed` | a getter or a function called in `view` |
| vee-validate, yup | `formOf(schema)` and `Field` |
| `store.setX(v)` | `walletStore.x = v` |
| `useToast` (53 files) | `toastError`, `toastSuccess` from `Toasts` |

## 4. Settled, and how each is held

1. **`request` is the wallet's wrapper.** The admin's client is not changed for it.
2. **A session ends with a reload**, announced by the countdown window, without a flash of
   theme or language (above).
3. **The reader's place in a chat thread holds as it does today** when older messages are put
   in front, when a message arrives, and when a picture above the place gets its height. Mithril
   allows it the same way Vue does: `onbeforeupdate` measures the distance to the end of the
   thread, `onupdate` — after the DOM is changed, before the browser paints — puts the thread
   back at that distance. A spec measures the position of a named message before and after an
   older page arrives, to the pixel, on the desk and on the phone; a real phone is checked by
   hand in step 15, because Playwright does not show momentum scrolling.
4. **The wait looks the same everywhere** — a placeholder after 150 ms, the last value where
   there is one — and differs from the old wallet on purpose ("Waiting").
