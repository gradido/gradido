# The wallet in Mithril: what is left to do

The old wallet (`frontend/`, Vue) stays deployed until step 20. Each numbered step is one pull
request of **at most 250 changed files**, so that CodeRabbit still reviews it. A step that grows
past the limit is cut again, never merged with its neighbour.

Numbers below were counted on 2026-11-19 (`frontend/src`: 78,600 lines of code in about 420
files, 16,500 lines of styles, 149,300 lines in 438 spec files). They are there to size the
steps, not to be kept up to date.

## What is already here

- The workspace: Vite, TypeScript, Biome, `bun test`, Turbo, the CI workflow
  (`.github/workflows/test_frontend_mithril.yml`).
- `@frontend` → `frontend/src`, `frontend/public` served as it is, settings from `frontend/.env`.
  The global styles are the very file the old wallet loads (`frontend/src/assets/css/gradido.css`,
  built by its `compile-scss`); `*.module.scss` files compile through the alias with the same
  options as in the old wallet.
- `index.html`: a copy of the old one, held equal by `src/indexHtml.drift.test.ts`.
- Playwright against both wallets, on a desk and on a phone (`old`, `old-phone`, `new`,
  `new-phone`), the backend answered from `backend/schema.graphql` (`tests/fixtures/graphql.ts`),
  and `samePicture` (`tests/fixtures/picture.ts`): the old wallet takes a picture, the new one is
  held to it.
- `src/main.ts` is a placeholder. No page is ported.

## Rules for every step

How the new wallet is cut — folders, the way to the server, the four kinds of state, forms,
the end of a session — is in `ARCHITECTURE.md`. It is a draft until steps 2 and 3 are merged,
and those two steps correct it.

1. **Specs first, against the old wallet.** Write the Playwright specs of the step, with
   `samePicture` at every state worth a picture (desk and phone come for free through the
   projects; for a dark picture the spec sets `localStorage['gradido-theme-mode']` itself). They pass on `old`.
   Then port, then add the files to `PORTED_TO_MITHRIL`. The old mount tests
   (`@vue/test-utils`, 241 files, 110,000 lines) are the list of behaviour to cover; they are
   not translated.
2. **Not 1:1.** Before porting a file, sort it: vanishes with Mithril / pure logic / needs a new
   shape. The tables below say what was found. Target: at least the admin's 30 % less code.
3. **Schemas, not single checks.** One valibot schema per answer of the backend and per form
   (`src/data/*.schema.ts`), parsed once where the data enters. The same for everything read
   from `localStorage`, the address bar and a QR code. No `typeof` chains, no `?? null` lists.
   Take schemas and bounds from `shared/browser` where they exist (`emailSchema`,
   `passwordSchema`, `aliasSchema`, `uuidv4Schema`): the entry of `shared` a browser can load.
   Never from `shared` itself, which reaches Node.
4. **Logic beside the view.** Pure logic in `src/data/*.logic.ts` with a `*.test.ts`. The 105
   pure-logic specs of the old wallet (23,000 lines) move to `bun test` with the code they test,
   in the step that takes the code; 21 of them need their `vi.mock` replaced.
5. **Compact.** As `ARCHITECTURE.md` says under "How the code is written": no function for
   one line used once, no layer that only passes on, no component for plain Bootstrap markup
   (`div.row`, `button.btn`), nothing for later, comments only for the why. The pull request
   names the lines it replaces and the lines it adds. Every page stays its own chunk
   (`import()` in the route), as today.
6. **The picture stays** — but for the wait, which is shown one way everywhere
   (`ARCHITECTURE.md`, "Waiting"); take `samePicture` once the content is there. Emit the
   classes the styles are written for (list under step 2). A style file is reused through
   `@frontend`; it is changed only where the markup behind it really changes, and then in the
   same step for both wallets.
7. **A change to the old wallet's behaviour during the rewrite** goes into `frontend/`, and into
   `frontend-mithril/` where the page is ported (`AGENTS.md`).

## Decisions to take in step 2

- **Building blocks shared with the admin: decided, they are imported.** `Modal`,
  `ConfirmModal`, `Dropdown`, `Tabs`, `Pagination`, `Tooltip`, `Toasts`, `ThemedSelect`,
  `MemberAvatar`, `MemberAvatarZoom`, `AppOutdatedBar`, `icon`, `i18n.ts`, `theme.ts`,
  `viewport.ts`, `graphql/client.ts`, `RelativeTime.logic`, `AppOutdated.logic` come through an
  `@admin` alias onto `admin/src`, and are changed there where the wallet needs more. No copy.
- **Styles of bootstrap-vue-next.** The old wallet loads `bootstrap-vue-next.css`. Take over
  only the rules whose classes the Mithril wallet emits (`b-toast-*`, `b-avatar*`,
  `b-pagination-pills`, `bv-d-sm-down-none`), into one small file, and drop the import.
- **Icons.** About 135 icons of six sets (bi 63, mdi 65, ion 2, tabler 2, fa 1, humbleicons 1)
  through `unplugin-icons` with `compiler: 'raw'`, as in the admin. Install the six
  `@iconify-json/*` sets, not `@iconify/json`.

## The steps

Files are an estimate of what the pull request touches: new Mithril files, their tests and the
Playwright specs. `old` is what the step replaces (code files / lines).

### Before any page

**1. Dead code out of the old wallet** (about 60 files, deletions only)
So that nobody ports it, and the later steps are counted without it.
- Imported by nothing: `GddSend/NavSend`, `LanguageSwitchSelect`, `Overview/CommunityNews` (and
  `assets/News/news.json`), `Template/RightSide/LastContributions`, `TransactionRows/TypeIcon`.
- Imported by their own spec only: `GddTransactionListFooter`, `Inputs/FirstName`,
  `Inputs/LastName`, `Status`, `UserSettings/UserCard`.
- 15 `*.NEW` / `*.old` files; `plugins/globalDirectives.js` (empty); `assets/mocks/styleMock.js`;
  `graphql/enums.js`; query `listContributionMessages`; fragments `contributionFields`,
  `unconfirmedContributionFields`; rule `is_not`; store field `hasElopage`; exports
  `ROTATIONS`, `isSwissTransferLink`, `thankYouCardFileName`, `favoritesLoaded`, `forgetSheet`,
  `forgetViewport`.
- Outside `src`: `babel.config.js`, `vue.config.js`, `intelij.webpack.js`, `run/server.js`,
  `scripts/sort.sh`, `scripts/sort_filter.jq`, `scripts/missing-keys.sh.old`, the
  `analyse-bundle` script, and the dependencies `portal-vue`, `@morev/vue-transitions`,
  `webpack`, `dotenv-webpack`, `eslint-webpack-plugin`, `regenerator-runtime`.
- In `main.js`: `$filters`, the `if (!store)` block, the mount "stub" options.

**2. The base** (about 70 files)
No page yet; everything a page needs.
- `graphqlRequest` (the admin's, plus what the wallet's Apollo link does): `renewSession: false`
  as an option of its own (not the admin's `background`), a renewed token dropped when the
  member changed meanwhile, `403.13` → sign out and `/login`, `GRAPHQL_VALIDATION_FAILED` →
  outdated. No cache: `possibleTypes`, the merge policies and the 18 field-set specs in
  `graphql/` go with it; the schema check of the fixture replaces them.
- `resource`, `deviceValue`, `formOf` and `Field` as `ARCHITECTURE.md` describes them.
- `Placeholder` (`line`, `block`, `row`) and the locked button with its spinner: the one way a
  wait is shown, a deliberate change from the old wallet (`ARCHITECTURE.md`, "Waiting"). Its
  pictures are checked in and run for `new` and `new-phone` only; `samePicture` gets a sibling
  for that.
- The store as a plain object (`wallet.store.ts`): the 37 fields of `useWalletStore.js` behind
  one valibot schema for the `login` / `verifyLogin` user (replaces 25 `?? null` and about 35
  one-line setters). `tokenTime`, `darkMode` are derived; `transactionToHighlightId` is not
  persisted. The keys stay: `gradido-frontend`, `auth-token`, `gradido-theme-mode`. Signing out
  reloads the page instead of calling 20 `forget*` functions.
- One helper for "a value per member in `localStorage`, read through a schema" (written by hand
  in 10 composables and 9 utils), one for the four hand-overs (`useEntryDraft`, `useLinkDraft`,
  `usePassOnDraft`, `useSendReturn`), one `memberKey` (five spellings today; keep each stored
  format readable).
- `i18n`: the admin's — English is bundled and stands in for a missing key, any other language
  is fetched when it is asked for, and the wallet is drawn only once it is there (the old wallet
  bundles all ten) with the number and
  date formats once (ten identical copies today, 440 lines) and one language list.
- Routes and guards (`routes.js`, `guards.js`, 890 lines) as one table with the meta the layout
  reads, and the guard steps in their order. Keep: `/authenticate`, the first
  navigation with a running session, the event-matching link, `requiresAuth`,
  `creationAllowed`, `requiresFindable`. `guards.test.js` (1,330 lines) is the specification.
- Not ported: the publisher id. Elopage is gone and its code is being removed (#4309); this is
  that issue's first step for the new wallet. `?pid=` in an address is ignored, the store has no
  field for it, `login`, `createUser` and `updateUserInfos` are sent without it (the server
  takes it as optional). From the switch (step 20) a link with `?pid=` stores nothing any more:
  accepted in #4309. Its field leaves the shared GraphQL documents in step 23.
- `every(ms, fn)`: the one helper for what runs on a clock — it pauses while the tab is hidden
  and stops with the component or store that started it. For the chat's beat (with its
  back-off), the new-version check, the session's countdown, the e-mail confirmation, and the
  lists of contributions and support requests.
- The lists of contributions and support requests refresh on that clock, every
  `AUTO_POLL_INTERVAL_SECONDS`: the server's dial for its load, 0 (the default) for never. The
  config already works it out, and falls back to the older `AUTO_POLL_INTERVAL` in
  milliseconds, which the inspector keeps (it asks twice a second). New: the clock pauses
  while the tab is hidden, and asks at once when the tab is seen again. The chat keeps its own
  beat of 15 s. Step 23 ends the wallet's reading of the older variable.
- The balance as a `resource`, refreshed by whatever changes it. The counter of answers in
  `DashboardLayout`, by which the first-creation window tells a new balance from an old one,
  goes: the window refreshes and waits for that answer.
- GraphQL documents that ask nearly the same become one each, with one schema: the member of
  `login` and `verifyLogin` (one fragment), the four lists of creation groups (`{ id tag name }`),
  `transactionsQuery` and `transactionsUserCountQuery`, `openCreations` and
  `openCreationsAmounts`. New documents in `frontend-mithril/src/graphql`; the old wallet's stay
  untouched until it goes. The server is not changed.
- `jwt-decode` and `uuid` are not installed: the token is read as `authToken` already reads it,
  a gradido ID is checked by `uuidv4Schema` of `shared`.
- The clipboard as today: `nativeClipboard` for pictures, loaded before
  `clipboard-polyfill/overwrite-globals`, which stays for text. Their order is held by a test.
- A test for the texts, in place of the ESLint plugin that goes with ESLint (step 22): every
  key a `t('…')` in `src` names exists in `en.json`, and every key of `en.json` is named
  somewhere — in `frontend-mithril/src` or, until the old wallet goes (step 22), in
  `frontend/src`, whose keys the shared file still holds. Keys are written as literals so that
  it can read them. The admin has no such check (its script only sorts); the test is written so
  that the admin can run it too.
- Theme, viewport, outdated bar, stale-chunk reload and new-version check
  (`reloadOnStaleChunk`, `newVersionCheck`), `nativeClipboard`.
- Building blocks: the admin's (see the decision above), and the missing ones on Bootstrap's own
  JS: `Collapse`, `Carousel`, `Popover`. One `Field` (label, input, feedback) driven by a
  valibot schema, in place of `LabeledInput`, `ValidatedInput`, `InputEmail`, `InputPassword`,
  `InputPasswordConfirmation`, `InputUsername`, `AccountFields` and vee-validate + yup. One
  result block for `Message`, `SuccessMessage`, `TransactionResultSendError`,
  `SendEmailResultError`, `RecipientNotFound`. One copy button for `ClipboardCopy`,
  `GradidoAddressCopy`, `ChatVideoLinkCopy`. One modal for `BModal` (22 files) and `AppModal`.
- Form schemas from `validationSchemas.js` and `validation-rules.js` in valibot, with the
  bounds from `shared` (`RESERVED_ALIAS`, memo 5..512, message, support ticket). One amount
  rule for the three there are (`validationSchemas.amount`, `ContributionForm` hours,
  `filters/amount.parseAmount`).
  `ContributionForm`'s hours keep their rule as it is: a number of at most two decimals, from
  0.01 to the hours left, with a comma taken as a point.
- Classes the styles rely on, to be emitted as they are: `.b-toast-{success,danger,warning}`,
  `.b-avatar`, `.b-avatar-custom`, `.b-pagination-pills`, `.bv-d-sm-down-none`, and Bootstrap's
  own modal, tab, dropdown, carousel, popover and navbar structure.

### Pages

Order follows what imports what. Chat is opened from many places: until step 15, a page that
opens a contact window calls an opener that does nothing in the new wallet, and its spec for
that click stays on `old` only.

| # | Step | Old (files / lines) | Files in the PR | Notes |
| --- | --- | --- | --- | --- |
| 3 | Sign-in pages and their layout: `AuthLayout`, `Auth/*`, Login, Register, RegisterCommunity, ForgotPassword, ResetPassword, ConfirmEmail, EmailChange, PublicProfile, NotFound | 16 / 3,260 | ~60 | `NotFoundPage` is 1,200 lines of inline SVG: one `.svg` file. The two backend sentences Login matches stay pinned by a test. |
| 4 | The shell: `DashboardLayout`, templates, `Menu/*`, `MobileSidebar`, `Breadcrumb`, footer, `ContentHeader`, `RightSide` (without the contact panels), `SessionLogoutTimeout`, `EmailConfirmation*`, `AdminWayBackBar` | 28 / 4,600 | ~90 | The settings menu is in the DOM twice today (desk, phone): draw it once, by the width, if the picture stays the same without a change to the styles; else twice, reading one `resource`. Body scroll lock of the phone menu. |
| 5 | First steps: `FirstCreation`, `AliasFirstChoice`, `EventMatchingHomeInvitation`, `useFirstLoginWindow` | 5 / 1,900 | ~35 | Which window comes first is the logic to keep. |
| 6 | Contributions, support, information: three pages, `Contributions/`, `ContributionMessages/`, `Support/` | 19 / 2,960 | ~70 | Depends on the base only. The lists poll with `AUTO_POLL_INTERVAL`. |
| 7 | Scanner and calculator: `Scanner`, `Calculator`, `QrCode/*`, `useQrScanner`, `useCalculator*`, `qrDetector` | 14 / 2,900 | ~50 | The camera is released when the page leaves (`onremove`). `qrcanvas` without `qrcanvas-vue`. |
| 8 | Map core: `mapEngine`, `mapTiles`, `mapStyle`, `placeName`, `geoSearch*`, `GeoSearchField`, `UserLocationMap` | 16 / 1,800 | ~35 | Needed by settings and matching. maplibre lives in `oncreate` / `onremove`. |
| 9 | Settings: `settings/*`, `MyGradidoCard`, `UserSettings/*` | 24 / 3,300 (+3,200 utils) | ~90 | `gradidoCard.js` and `thankYouCard.js` are canvas code and move as they are. |
| 10 | Pictures: `ChatImageEditor`, `ChatImageView`, `EmojiPicker`, `ChatReactionChoice`, `AvatarZoom`, `AvatarCropper`, `ThankYouGreetingPhoto`, the image utils, and **one** picture cache for `useChatImages`, `useMemberAvatars`, `useKeptPictures`, `memoryPictures` | ~20 / 4,700 | ~60 | The admin's `memberAvatars.store` does in 72 lines what `useMemberAvatars` does in 503. |
| 11 | Transactions: page, `GddTransactionList`, `GdtTransactionList`, `Transactions/`, `DecayInformations/` (five files → one with variants), `TransactionRows/`, `TransactionLinks/` | 22 / 3,030 | ~70 | `date-fns` stays for its one use (`DurationRow`), so the words stay exactly as they are ("etwa 1 Monat") — in all ten languages, none reads English any more. Its English is bundled with this page; another language's locale is fetched with the page (`() => import('date-fns/locale/de')`, one loader per language), in the route's `onmatch` beside the page itself, so the row is never drawn in English first. |
| 12 | Redeem and thanks: `TransactionLink`, `LinkInformations/*`, `ThankYouGreeting`, `MyThankYouCard`, `ThankYouCardPayment`, `ThankYouGreeting/*` | 14 / 4,340 | ~80 | The print and cheque code is canvas and moves as it is; `thankYouCheque`, `avatarColor`, `qrCode` exist a second time in the admin — one copy. |
| 13 | Send: `Send`, `GddSend/*`, `CommunitySwitch` | 12 / 2,750 | ~50 | `Send` reads the communities the form loaded from Apollo's cache: hand them over. |
| 14 | Overview: `Overview`, `ShowFriends`, `Overview/*`, `ThanksNudge`, the contact panels of the right side | 8 / 1,940 | ~45 | |
| 15 | Chat, reading: `ContactWindow`, `ChatThread`, `ChatBubble`, message text, file card, search, note, unread, `useChatUpdates`, `useChatWindow*`, `chatMarkdown` | ~25 / 8,500 | ~110 | The thread lives in Apollo's cache today (five `cache.updateQuery`) but nothing else reads it: an array in the component, patched by the pure functions that exist. The beat: 15 s, backing off to 120 s. The openers of steps 4–14 become real; their specs join `PORTED_TO_MITHRIL`. |
| 16 | Chat, writing: `ChatComposeBar`, `ChatForwardDialog`, `ChatMessageMenu`, `ChatTransferCoin`, drafts, file links, `useFieldOutOfSight` | ~12 / 3,500 | ~60 | Android keyboard and `visualViewport`: test on a device, Playwright does not show it. |
| 17 | Chat, video: `ChatVideoCall`, `ChatVideoApp*`, `utils/chatVideo*` | ~10 / 2,900 | ~45 | The six `provide` / `inject` become plain arguments. |
| 18 | Contacts and groups: `Contacts`, `Contacts/*`, `ChatGroups/*` | 11 / 3,200 | ~55 | `ContactWindow` and `ChatGroupWindow` share size, note and video: one window base. One avatar row for `ContactRow`, `ChatGroupRow`, `ContactTiles`, `ContactsStrip`, `ContactsPanel`. |
| 19 | Matching: (a) `Matching`, `EventMatchingBuilder`, `EventMatchingLanding`, `useMatches` (670 of its 890 lines are pure → `Matching.logic.ts`); (b) `MatchingMap`, `MatchList`, `MatchProfile`, `MatchQuery`, `MatchCluster` | 10 / 7,200 | (a) ~60, (b) ~60 | Two pull requests. The map writes ticks into the list the page reads, through Apollo's cache: one store for both. |

### The switch

**20. Deploy the Mithril wallet** (about 15 files)
`deployment/bare_metal/start.sh`, the nginx templates (`root …/frontend-mithril/build/`),
`deployment/hetzner_cloud/install.sh`, `frontend/Dockerfile` and the compose files, the
`e2e-tests`. `PORTED_TO_MITHRIL` holds every spec. Before it: a run through the whole wallet on a
real phone (keyboard, camera, installed app, a deploy while a tab is open), and the sizes of the
bundle compared with the old build.

**21. Remove the Vue wallet's specs** — three pull requests of at most 250 files
(a) `components/**` specs (216), (b) `pages`, `composables`, `layouts`, `routes`, `store`,
`plugins` (about 115), (c) `utils`, `graphql`, `locales`, the specs at the top of `src`, `test/`,
`vitest.config.js` (about 110). With (a): the old wallet's jobs leave the CI, and the `old`
projects leave `playwright.config.ts` — from here `samePicture` compares with pictures checked
in. Specs that read styles or the manifest as text and still say something
(`noForeignHosts`, `webAppManifest`, `openSans`, `themeBoot`, the dark-mode and edge specs) are
rewritten as `bun test` files against the new paths before their old file goes; the
`*.drift.spec.js` that are left hold Vue's field names and modal props, or a copy that is gone
by then: they go without a successor.

**22. Remove the Vue wallet's code** — two pull requests
(a) `components/**/*.tsx` (about 190), (b) pages, layouts, composables, store, routes, plugins,
the Vue-only utils, `main.js`, `App.tsx`, `i18n.js`, the Vue, Apollo, vee-validate, yup,
bootstrap-vue-next, ESLint and Prettier dependencies and their config files (about 150).
What `frontend-mithril` imports through `@frontend` stays.

**23. One folder** — moves only: a moved file keeps its content, but for the import paths and
the build configuration the move itself changes, in the same pull request. Each of them leaves
both the build and the specs passing.
(a) styles: `assets/scss`, the `*.module.scss` and `.css` files next to their Mithril
components (about 200), `compile-scss` becomes a step of the one build; (b) `locales`,
`graphql`, `config` (as ESM TypeScript, without `vite-plugin-commonjs`), the remaining utils,
`public` (about 200); with the last of them the `@frontend` alias and the second `index.html`
go, once nothing imports through the alias. (c)
`frontend-mithril` → `frontend`. **This rename is larger than 250 files** and cannot be cut
without breaking the build in between: review it with `git diff -M --stat` (renames only), not
with CodeRabbit. Then the workflow becomes `test_frontend.yml`, with its `_skipped` companion,
and the paths other packages read change with it: the admin's specs that read the wallet's
files, `shared/src/const/frontendReadable.ts`, the path filters in `test_backend.yml` and
`test_admin_interface.yml`, `walletAssets.ts`, the root `AGENTS.md`.

## After the switch, not before

- `gradido.css` is 322 kB (44 kB gzipped): all of Bootstrap plus the template. Compile only the
  Bootstrap parts in use. A change of the picture's source, so not during the port.
- The placeholder build is already 115 kB of JavaScript (27 kB gzipped), nearly all of it the
  config parsed once more in the browser (`config-schema`, valibot): hand the browser the parsed
  values instead.
- Hashed class names of the CSS modules: 776 `:global(...)` in 121 files say the scope is mostly
  unused. Plain classes would make the files smaller.
