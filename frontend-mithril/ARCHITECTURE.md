# The wallet in Mithril: architecture

**Binding.** It was written before any page was ported, from reading the old wallet, and was
corrected with step 2 (the base) and step 3 (the sign-in pages) of `todo.md`. Where the code
of a later step shows a rule here to be wrong, the rule is changed in the same pull request,
not worked around.

The picture in the browser and what the wallet does stay as they are, with one exception that
is named where it stands: how a wait is shown ("Waiting"). This is about how the
code is cut.

## 1. The old wallet, as it is built

| Layer | Where | Size | What it really does |
| --- | --- | --- | --- |
| Views | `components/`, `pages/`, `layouts/` | 226 files, 54,800 lines | Markup, and most of the behaviour: a page asks the server, keeps the answer, validates, navigates. |
| Composables | `composables/` | 68 files, 9,000 lines | Three different things under one name: wrappers Vue or Apollo need (32), real logic (28), and module-level state that outlives a component (8, seven of them large). |
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

Its question carries three fields that are not the chat's, so that the menu needs no timer of
its own: `supportTicketsMenu`, `countContributionsInProgress` and `moderationWaiting` (the
marks at "Support", at "Schöpfen" and the two at "Admin": creations above the symbol, support
requests below). Each is handed on to a module that only keeps the numbers
(`useSupportTicketsMenu`, `useContributionsInProgress`, `useModerationWaiting`) and has a
`forget…` for the sign-out. In Mithril the numbers are fields of the beat's store, which the
menu reads; the three modules go.

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
  routes.ts            the route table
  router.ts            the table as Mithril's resolvers, and what may open a page
  graphql/             client.ts: request(), the one way to the server; the documents it sends, as gql in .ts
  data/                Thing.schema.ts (valibot) and Thing.logic.ts (pure), each with its *.test.ts
  store/               state that outlives a page (Session.ts, …); Resource.ts and DeviceStore.ts, what it is built with
  browser/             what wraps a facility of the browser and knows nothing of Gradido's data
  components/          what a page is built of, by kind and by field (below)
  pages/               one file per route
  styles/              the global styles: Bootstrap and the template, in Sass
tests/                 Playwright specs and fixtures
```

- `components/` has four folders by kind, and one for each field of the wallet. A component
  goes into the first that fits: `ui/` knows nothing of Gradido (`Modal`, `Tabs`,
  `BusyButton`), `form/` is part of a form (`Form`, `Field`, `PasswordField`), `layout/` is the
  frame around the pages, with a folder per layout (`layout/auth/`). Else it goes into the
  folder of the one field that draws it (`transactions/`, `chat/`, as the steps of `todo.md`
  bring them), and only when a second field draws it too into the folder of the thing it is
  about (`member/`: `MemberAvatar`, `GradidoAddressCopy`). Folders are named in lower case,
  as every folder of `src/`.
- `data/` is about a thing the wallet deals in (a member, a contribution): `Thing.schema.ts` says
  what it is, `Thing.logic.ts` holds logic on it that is too simple for an interaction of its
  own. Nothing else goes there.
- `browser/` holds what wraps a facility of the browser: `timer.ts` (`repeatWhileVisible`, and
  any timer with other properties beside it), `viewport.ts`, `clipboard.ts`, and
  `newVersion.ts` (the reload on a stale chunk, the check for a new version).
- A file of functions is named after what they have in common (`timer.ts`), not after one of
  them: a second function of the kind goes into the same file, and its name says how it differs.
  No file for a single function where a group is in sight.
- A file that holds a class or a component is named after it, in `PascalCase.ts`; a file that
  holds only functions starts with a small letter (`timer.ts`). A store follows the same rule
  and has no `.store` in its name, the folder says that it is one: `DeviceStore.ts` holds the
  class `DeviceStore`, `Session.ts` the session's two stores with `login` and `logout`.
- No `composables/`. No `utils/` either, as long as a file has a group that says what it is;
  only what has none goes there, and a second file of its kind is the sign to name the group.

### From the server to the screen

One function: `request`, the wallet's own, which takes the schema as an argument so that no
call can forget it. It is not built on the admin's `graphqlRequest`: that one reads the admin's
store and config, and stays as it is. Nothing is imported from the admin: what the wallet
needs of it is copied and put right here (`todo.md`, decisions of step 2).

```ts
const answer = await request(listContributions, variables, contributionListSchema)
if (!answer.success) return toastError(answer.error.message)
this.contributions = answer.value.listContributions
```

- `request` returns `Result<T>` for what can go wrong while the wallet is right: no network, an
  error of the server, an answer that does not fit the schema. A mistake of the caller (no
  document, variables the document does not declare) throws, as everywhere in this repository.
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
| **Shared fact** | while the member is signed in, each answer ten minutes at most | a file in `store/`, a `Resource` | first-creation status, alias status, balance, reachable communities, the member's own matching entries |
| **Session** | until sign-out, across reloads | `store/Session.ts` | `session.state.member` (who is signed in, with their settings), `session.state.language`, `session.state.redirectPath`, `authToken.state` |
| **Device** | until deleted, per member or per device | a `DeviceStore` in `store/` | theme, calculator settings, drafts, window size |

Mithril redraws after every event handler and every `request`. A store is therefore an
object with plain fields (the one instance of a class where it has methods, as `session`), and a
component reads it in `view`. No subscription, no setter that only assigns, no
copy of a store value in a component. Only what changes outside of Mithril (a timer, another
tab, an observer) calls `m.redraw()`.

**A shared fact** is the one new primitive, in the cache's place:

```ts
export const firstCreation = new Resource(firstCreationStatus, firstCreationStatusSchema)

firstCreation.value            // the last answer, or undefined
firstCreation.ensureLoaded()   // asks if nobody asked within the resource's limit; a second caller gets the same request
firstCreation.ensureLoaded(0)  // asks for the current one; value stays on screen meanwhile

// a fact that changes faster names its own limit
export const reachableCommunities = new Resource(reachableCommunitiesQuery, communitiesSchema, 60_000)
```

On every visit after the first in a session the last value is drawn at once, without a loading
state. Where the reader asked again it is replaced when the new answer comes. What is shown on
the first visit is the next section.

A reader calls `ensureLoaded` in `oninit` and says how old the answer may be, in milliseconds. That is
the choice the old wallet made with its fetch policy:

- `ensureLoaded()` where an answer of some minutes ago is good enough (the default policy of today: the
  reachable communities, the lists of creation groups). It asks only if nobody has asked yet
  or the last question is older than the hard timeout.
- `ensureLoaded(0)` where the reader shows the last value at once and wants the current one
  (`cache-and-network` of today: first-creation status, alias status, the balance).

A question of the last 100 ms counts as current, whatever age was asked for: an answer takes
about that long, and the header and the page that both want the current balance on the same
route change share one request. A question that failed does not count at all.

The newest wins: an answer is taken only if no later request was started. An older answer
that arrives late is dropped.

**The hard timeout.** No answer is kept for a whole session: production sessions last an hour,
some members are always online, and even the creation groups change. Ten minutes after a
question was asked its answer is no longer valid, and the next `ensureLoaded()` asks the server again,
with `value` still on screen until the new answer replaces it. Hard, because nothing
prolongs it: not reading the value, not prolonging the session. Only a new answer of the
server starts the ten minutes again. It is the wallet's side of
`SESSION_HARD_TIMEOUT_MS` in the new backend's draft, a backstop against a fact that changed
without the wallet hearing of it. The limit is the third argument of `Resource`, ten minutes
unless given; the reachable communities take one minute, since a community that went away
makes a transfer fail. The token is session state, not a resource, and has its own end (below).
No timer runs for it: the age is compared when `ensureLoaded` is called, so a page that stays open
keeps what it shows until something calls `ensureLoaded`.

A page that changed the fact calls `ensureLoaded(0)`: `value` cannot be assigned, every value
comes from the server. About 30 lines, in `store/Resource.ts`. Anything asked by one place only is view state and uses
`request` directly.

**A device value** is a `DeviceStore`: one entry of `localStorage`, read through its schema at
the start and written whole:

```ts
const prefsSchema = v.fallback(v.object({ decimals: v.fallback(v.number(), 2) }), { decimals: 2 })

export const calculatorPrefs = new DeviceStore('calculator-prefs', prefsSchema, DeviceStoreBasicType.Object)
calculatorPrefs.state          // what is stored, or what the schema's fallbacks say
calculatorPrefs.set(prefs)     // keeps it; set(undefined) removes the entry

new DeviceStore('right-side', v.fallback(v.picklist(['left', 'right']), 'left'), DeviceStoreBasicType.String)
```

The third argument says how the entry lies there: `Object` an object or a list as JSON,
`String` a text as it is (the old wallet's switches `'1'` and plain texts stay readable),
`Number` a number as its text; the caller knows which it has. `set` takes the value as valid, of the type the schema hands out; what
comes from outside goes through `v.parse` first. `set(value, false)` leaves `localStorage`
alone. Every such schema names with `v.fallback` what holds where nothing is stored or
something that does not fit, so the schema alone says how the value behaves. A schema without
one throws: an error in the code, to be seen at once. Text that is no JSON counts as nothing
stored. Where another tab writes or removes the entry, or clears `localStorage`, the store
follows, in one listener for all of them. A browser that refuses its storage
never gets this far: `browser/requireStorage.ts`, the first import of `main.ts`, tries it and shows a notice instead of the wallet, which
could not keep a session there either.

A value kept per member gets its key from the member: `<name>:<gradidoID>` in the old wallet,
three of them with something after it. A `MemberStore` (`store/MemberStore.ts`) hands out the
`DeviceStore` of the member signed in:

```ts
const windowLarge = new MemberStore('chat-window-large', windowLargeSchema, DeviceStoreBasicType.String)
windowLarge.forSignedInMember().state           // under chat-window-large:<gradidoID>
rightSide.forSignedInMember('overview').set(…)  // under right-side:<gradidoID>:overview
```

Every part of the key is joined with a colon. Asked while nobody is signed in, it throws. The
entries stay when a member signs out: a session that runs out must cost no draft and no
setting. Whether some of them belong in IndexedDB is #4323.

It replaces the 33 hand-written `try { JSON.parse(localStorage…) }` with their `typeof` chains.
The stored keys and shapes of today stay readable: a member must not lose a draft by the switch.

### Waiting

**The one place where the new wallet shows something else than the old one, on purpose.** The
old wallet shows the wait differently in every place (nothing, a spinner, a skeleton, the page
without the part). The new one has one way, for a `Resource` and for a page's own `request`
alike:

- **Content that is on its way is a `Placeholder`**: a grey shape with a faint shimmer, in the
  shape and the size of what comes — a line, a block, a row of a list, or a row with its
  picture (`PlaceholderType`). The
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

`m(Placeholder, { type: PlaceholderType.Row, width?, height? })` (`components/ui/Placeholder.ts`) draws the shape,
with the styles of the old `SkeletonLoaderElement` in a sheet of its own
(`Placeholder.module.css`): beside the delay it follows the theme, which the old one did not.
`BusyButton` (`components/ui/BusyButton.ts`) is the locked button: it calls `onclick` and stays
locked, with its spinner, while the promise that returns is open. The button of a form is
drawn and locked by the `Form` (`busy`): a form is sent by Enter too. The old wallet is not changed for this. For the specs: `samePicture` is taken once the content is there, which is the
same in both wallets; the wait itself has pictures of its own, checked in, for the projects
`new` and `new-phone` only.

### The end of a session

**Before it ends, the member is asked.** 75 seconds before the token runs out a window opens
that cannot be closed by a click beside it: the warning, the seconds counting down, "extend" and
"sign out" (`SessionLogoutTimeout`, as today). Extending asks `verifyLogin`, whose answer carries
a fresh token; if that fails, the session ends with a toast saying so.

**When it ends** — the countdown ran out, "sign out", a revoked session, a sign-out in another
tab — the token is removed from `localStorage` and the page is loaded anew at `/login`.

**When another member signs in in another tab**, their token arrives in the `localStorage` both
tabs share. This tab is loaded anew and the token is left alone: it is theirs, and removing it
would sign them out. Loaded anew, the tab finds their token and their profile: both lie in
the `localStorage` the tabs share, and it goes on as theirs.

With that reload every store, every resource, every timer and every request under way
is gone. The list of twenty `forget…` functions and the epoch counters go.

**At its start** the wallet does not compare the token with the profile stored. The old
wallet did, and took a token only if it named the member of the profile. That rule is dropped:
the wallet and the admin interface are to become one app, and then the token moves back into
the member's entry, where the two cannot differ. Until then only the wallet signs in, and it
writes the profile right after the token. A profile without a token is what the admin
interface leaves behind when it signs out -- it knows the token, not the wallet's entry: the
wallet drops the profile and starts signed out.

**A token that cannot be read** -- its middle part is no base64 of JSON, or its `sub` is no
gradidoID -- is no token: `authTokenSchema` reads the gradidoID out of the token as
`tokenMemberId` and hands out null where it cannot. What happens then depends on where the
token came from:

- Out of `localStorage`, at the start or from another tab: the wallet is signed out, instead
  of not starting at all. What lies there is not the wallet's to trust.
- From the server, with an answer: the server sends something the wallet does not understand,
  and that is to be seen as soon as possible, not at the next reload as a sign-out nobody can
  explain. A session that runs ends at once, and the sign-in page says in a toast that it
  could not be renewed; a sign-in fails, and its page says so like any other failure.

**A toast for the page loaded next.** What ends a session ends in a reload, and a toast shown
before it would be gone. `toastErrorAfterReload(text)` keeps it in `sessionStorage`, which is
this tab's and survives the reload, and `Toasts` shows it when it is mounted. Used where
`request` ends a session: the revoked certificate, the token it cannot read.

**No flash of the wrong theme or language**, which the reload must not cost:

- The theme is set by the script in `index.html` before the first paint, from
  `gradido-theme-mode`. That key is the device's and is never removed at a sign-out.
  `store/Theme.ts` follows it from then on (`theme.state` is the mode, `theme.dark` what is
  shown, `theme.set(mode)` the switch): it marks `body` (`.dark-mode`, `data-bs-theme`) and
  reads the colour of the installed app's bar off the styles (`--bg`). The mode is kept under
  that key only; the old wallet held a second copy in its state.
- The language stays in the wallet's stored state across a sign-out, as today. `main.ts` reads
  it, fetches its texts, and only then mounts: nothing is drawn in another language first.
- A spec signs out in dark mode and in a language other than the browser's, and holds the first
  frame of the sign-in page to both (step 3 of `todo.md`).

What has to reach the page loaded next crosses in storage: why the session ended in
`sessionStorage` (`toastErrorAfterReload`), the address to return to in the session's state
(`redirectPath`). What one page leaves for the next without a reload (a link to pass on, a
recipient to send to) is a `HandOver` (`store/HandOver.ts`): `put`, and `take` once. It lives
in memory, so a sign-out ends it with everything else. What is kept on the device per member stays, as
today; what must not stay for the next member on this device is removed in one place,
`logout` in `Session.ts`, by key.

### Components

- A building block is a class, `class Modal implements m.ClassComponent<Attrs>`, drawn with
  `m(Modal, attrs, children)`, whether it carries state or not: one form, and state comes
  later without a change to its callers. A generic one is drawn with its type argument,
  `m(Form<typeof sendSchema>, …)`, `m(ThemedSelect<Language>, …)`: through `m()` TypeScript
  does not find it by itself, and a callback would be handed `unknown`.
  What a building block tells its caller is a function in its arguments (`onsaved`,
  `onclose`). No events, no `expose`: a parent that has to reach into a child holds the state
  itself and hands it down.
- Plain Bootstrap markup is written as markup (`m('.row', m('.col-md-6', …))`). A building
  block exists where there is behaviour, or markup of bootstrap-vue-next the styles rely on.
- A window (`Modal`) is open as long as it is drawn. It draws itself at the end of `<body>`
  as a root of its own, so that no parent clips it; it keeps the keyboard inside, closes on
  Escape and a click beside it, and gives the focus back.
- **A building block has the roles, names and keys of its WAI-ARIA pattern**
  (w3.org/WAI/ARIA/apg/patterns), held by `tests/blocks/keyboard.spec.ts`: `Modal` a dialog
  named by its title (`ConfirmModal` an alert dialog, the focus at the button that does not),
  `Dropdown` a menu button (↓ ↑ Home End over the entries, Tab closes and goes on),
  `ThemedSelect` a menu of radio entries, `Tabs` with the arrows moving the focus and Enter
  showing the tab, `Pagination` a menubar (← → Home End) with `aria-current="page"`. A toast
  is an `alert` where it is an error and a `status` else. An icon without an `aria-label` is
  hidden from a screen reader.
- Values that the old wallet handed down through `provide` / `inject` (six, all for the video
  call) are attributes or a store.
- A page reads its route through `m.route.param()`, and the flags the layout needs from the
  route table, not from the page.
- **What runs on a clock uses `repeatWhileVisible(ms, fn)`**, which pauses while the tab is hidden and
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
const submitBusyButton = m(BusyButton, { class: 'btn-primary' }, t('form.send_now'))
m(Form<typeof sendSchema>, { schema: sendSchema, submitBusyButton, onsubmit: send }, [
  m(Field, { label: t('form.amount'), name: 'amount', schema: sendSchema.entries.amount }),
  m(Field, { label: t('form.memo'), name: 'memo', schema: sendSchema.entries.memo }),
])
```

- `Field` (`components/form/Field.ts`) holds its value (`defaultValue` is what stands there at first),
  checks it against its own schema and says itself what is wrong with it. Its schema is the
  entry of the form's, so the two cannot run apart. It draws label, input and sentence in the
  markup bootstrap-vue-next drew (`.b-form-group`, `.form-control.is-valid`,
  `.invalid-feedback`). A page that reckons while the member types hears it by `oninput`.
- `Form` (`components/form/Form.ts`) is the `<form>` around the fields, with the button that
  sends it, which the page hands it (`submitBusyButton`). After each draw it looks for its fields among what was drawn (a component is one by `extends FormField`), also those another component drew, and locks the
  button until each `isValid()`. A pointer over the locked button, or a finger on it, lets
  every field say what is wrong with it (`setTouched()`). Sent by the button or by Enter —
  by Enter only while the button is not locked, as a browser does it: a form with a field
  that does not fit is not sent. The values of the inputs, by their `name`, go through the form's schema to `onsubmit`; the
  button is locked, with its spinner, until that is settled.
- `Form<typeof sendSchema>`: through `m()` TypeScript loses the type argument of a class,
  so it is named. Then `onsubmit` knows its values, and a schema of another form does not
  compile.
- A rule over two fields (the two passwords are the same) is the page's: it hears the one by
  `oninput` and builds the schema of the other from it (`components/form/NewPasswordFields.ts`,
  the two fields of every form that sets a password).
- Where the button stands in a column of the form's grid, the page names the classes of the
  place around it (`submitPlaceClass`).
- What is typed lives in the field: a field that is no longer drawn has lost it, and what
  stands there at first counts at the first draw only. A form whose values come from the
  server is drawn once they are here.
- A field is green as soon as what was entered fits, and red, with its sentence, only once it
  was left. One rule for every form: the old wallet had two.
- A rule's sentence is written in the schema as `() => t('form.validation.memo.min', { min })`:
  in the member's language when the value is checked, and with a key `texts.test.ts` can read.
- The rules of the fields stand in one `data/Form.schema.ts` (amount, memo, message, support
  request, subject, e-mail, a new password), with the bounds of `shared/browser`. A schema of
  `shared/browser` itself carries an English sentence for the server's log, which valibot
  does not let a caller replace: where a field needs its sentence in the member's language,
  the rule is written out here.
- An amount is typed with a comma or a point as its decimal sign, in every language, and
  with or without grouping (`1.234,56`, `1 000`). One sign with three digits behind it is a
  thousand only where the language shown groups with it (`1.000` in German, `1,000` in
  English); else it is refused as three decimals. No amount is guessed.
- An amount is a text field (`inputmode: 'decimal'`), read by `amountSchema`, never
  `type: 'number'`: there Firefox refuses a comma, and Chromium and Safari read `1,5` as 15
  where the language of the machine is English.
  `tests/browsers/amount.spec.ts` holds the text field in Chromium, Firefox and WebKit, in
  every language the wallet has.
- A rule that asks the server (the user name is taken) is not part of the schema: the page asks
  after the schema passed, and hands the field the sentence -- an attribute `Field` gets with
  the first form that needs it.
- The sentences stay the texts of today. Those the old wallet took from vee-validate's own
  dictionary (`required`, `email`, `min`, `max`) get keys in the wallet's files with the first
  form that needs them.

### Routes

One table, `ROUTES` in `routes.ts`. Each row: the address, the page, and the flags of today's
`meta` (`requiresAuth`, the layout's flags); an address that only leads on (`/authenticate`)
has `leadsOn` in place of a page. The pages are imported, not fetched when opened: the wallet
is one bundle, and fetches apart only what is large and needed by few (the languages,
maplibre). Mithril knows no part of an address that may be missing, so `/login/:code?` is two
rows. `routeResolvers` (`router.ts`, apart from the table, so that its test loads no page)
turns the table into Mithril's `RouteResolver`s:

- `onmatch` asks the guard — the steps of `guards.js` in their order (without the publisher
  id, which is not ported), as one pure function `whereTo(navigation, visitor) → path | null`
  in `data/Guard.logic.ts`, tested with the cases of `guards.test.js`. What the guard needs
  done beside its answer is done in `onmatch`: a sign-in that ran out is put away, and the
  address asked for is kept in `session.state.redirectPath`, with query and hash, for after
  the sign-in.
- Whether a session runs is `sessionRuns()` of `store/Session.ts`: a token, and more than five
  seconds before its `endsAt`, which `authTokenSchema` reads off the token's lifetime and the
  moment this device received it.
- "The wallet starts here" holds until the first page has opened, so that `/`, which only
  leads on to the sign-in, still counts as the start.
- `render` draws the page inside the frame `routeResolvers` was handed (`components/layout/App.ts`),
  which so stays mounted from page to page. The frame draws the layout by the row's
  `requiresAuth`: the sign-in layout (`components/layout/auth/AuthLayout.ts`), and the member's
  with step 4 of `todo.md`. Where `onmatch` led elsewhere Mithril draws a bare `div` in the
  page's place; nothing is drawn then.
- Inside `onmatch` the query is read from `location.search`, not from `m.route.param()`:
  that still holds the parameters of the page shown before, and Mithril decodes a query
  twice, which breaks an address carried in one (`/authenticate?redirect=`).
- A page of a later step that a ported page leads to (`/overview`, `/send/…`, `/redeem/…`)
  has its row and its guard already, and a page that only names the build
  (`notPortedYet`), until its step replaces it.

### Stores that are more than a value

| Store | Replaces | Shape |
| --- | --- | --- |
| `Session.ts` | `useWalletStore.js`, `store.js` | `session` (member, language) and `authToken` (the token both apps share), each a `DeviceStore` parsed by its schema; `login`, `logout` |
| `Theme.ts` | `themeMode`, `darkMode`, `applyTheme` of the store, the watcher in `App.tsx` | `theme`, a `DeviceStore` on `gradido-theme-mode` that shows what it holds |
| `chatBeat.ts` | `useChatUpdates.js`, `useSupportTicketsMenu.js`, `useContributionsInProgress.js`, `useModerationWaiting.js` | timer, unread counts, the menu's marks, `onMessages` / `onEdited` / `onReacted` / `watchRead` |
| `pictures.ts` | `useMemberAvatars`, `useKeptPictures`, `useChatImages`, `memoryPictures` | `pictureCache({ fetch, atOnce, max, persistKey? })`, used three times |
| `firstLoginWindow.ts` | `useFirstLoginWindow.js` | `wanted`, `undecided`, `held`, and `onScreen()` from the logic file |
| `contactWindow.ts` | `useContactWindow`, `useContactsPanelHost` | which conversation is open; the window is drawn once, by the layout |
| `appOutdated.ts`, theme, viewport | their composables | copied from the admin (`todo.md`, decisions of step 2) |

The chat thread is not in this list: it is view state of `ChatThread` (above).

### Texts, styles, tests

- **Texts:** `t`, `n`, `d` from one `i18n.ts`. English is bundled and stands in for a text
  another language lacks; a language is fetched when chosen (`setLocale`), and `main.ts` draws
  only once it is there. The keys and the JSON files stay; a key is written as a literal, and
  `texts.test.ts` holds each against `en.json`.
- **Styles:** the wallet's own, copied from the old wallet with the step that needs them and
  held to its picture by the specs, with the classes they are written for. The global ones are
  Sass in `styles/` (`gradido.scss`, Bootstrap's sources), compiled by the `sass` plugin of
  `vite.config.ts` (grass where installed, else Dart Sass): with lightningcss as the
  transformer Vite runs no preprocessor. The build takes out of them, with PurgeCSS, every rule
  whose class no source names: a class is written whole, never put together
  (`` `btn-${variant}` ``), and `classNames.test.ts` holds that. A component's own lie beside it
  as plain `.css` (`AuthLayout.module.css` beside `AuthLayout.ts`).
  The old wallet draws an `#app` inside the `#app` it is mounted on, and its styles are
  written for both (`#app.dark-mode`, `#app > #app`): `components/layout/App.ts` draws the inner
  one.
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
170 callers), the device values (33), `Resource` (about 10 facts), `Form` and `Field` (about 10
forms), `repeatWhileVisible` (5). A helper that turns out to have one caller in the end is put back inline.

Every pull request names in its description the lines of the old code it replaces and the lines
it adds, tests apart. Where it is not clearly less, it says why.

## 3. Where the old code goes

| Old | New |
| --- | --- |
| a page or component (`.tsx`) | `pages/` or `components/`; its asking and keeping stay in it, its rules move to `data/` |
| a composable that wraps Apollo or Vue (32) | gone: `request`, a `Resource`, or a field of the component |
| a composable with logic (28) | `data/*.logic.ts` where it is logic on a thing, `browser/` where it wraps the browser; the part that keeps state, a store |
| a composable with module state (7) | a store from the table above |
| a util (88 pure) | `data/*.logic.ts` or `browser/`, by the same rule, moved with its test; imported through `@frontend` until its step |
| `useQuery` with `no-cache` / `network-only` | `request` in `oninit` or a handler |
| `useQuery` with the default or `cache-and-network` | a `Resource` where two places read it, else `request` |
| `cache.updateQuery`, `readQuery` | `ensureLoaded(0)` of the resource, or assign to the component's field |
| `useMutation` | `request` |
| `emit`, `v-model`, `expose` | a function or the value in `attrs` |
| `watch` that mirrors a prop or a store | nothing: `view` reads the source |
| `watch` that starts something | the handler that caused the change |
| `computed` | a getter or a function called in `view` |
| vee-validate, yup | `Form` and `Field`, each with its valibot schema |
| `store.setX(v)` | `session.set({ ...session.state, x: v })` |
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
