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

1. **Specs first, against the old wallet.** Write the Playwright specs of the step, with
   `samePicture` at every state worth a picture (light and dark, desk and phone come for free
   through the projects; dark through `localStorage['gradido-theme-mode']`). They pass on `old`.
   Then port, then add the files to `PORTED_TO_MITHRIL`. The old mount tests
   (`@vue/test-utils`, 241 files, 110,000 lines) are the list of behaviour to cover; they are
   not translated.
2. **Not 1:1.** Before porting a file, sort it: vanishes with Mithril / pure logic / needs a new
   shape. The tables below say what was found. Target: at least the admin's 30 % less code.
3. **Schemas, not single checks.** One valibot schema per answer of the backend and per form
   (`src/data/*.schema.ts`), parsed once where the data enters. The same for everything read
   from `localStorage`, the address bar and a QR code. No `typeof` chains, no `?? null` lists.
   Import schemas from `shared` by subpath where they exist (`emailSchema`, `passwordSchema`,
   `aliasSchema`, `uuidv4Schema`); the barrel pulls in `node:crypto`.
4. **Logic beside the view.** Pure logic in `src/data/*.logic.ts` with a `*.test.ts`. The 105
   pure-logic specs of the old wallet (23,000 lines) move to `bun test` with the code they test,
   in the step that takes the code; 21 of them need their `vi.mock` replaced.
5. **Compact.** No wrapper without behaviour, no component for plain Bootstrap markup
   (`div.row`, `button.btn`), no state copied from props, comments only for the why. Every page
   stays its own chunk (`import()` in the route), as today.
6. **The picture stays.** Emit the classes the styles are written for (list under step 2). A
   style file is reused through `@frontend`; it is changed only where the markup behind it
   really changes, and then in the same step for both wallets.
7. **A change to the old wallet's behaviour during the rewrite** goes into `frontend/`, and into
   `frontend-mithril/` where the page is ported (`AGENTS.md`).

## Decisions to take in step 2

- **Building blocks shared with the admin.** The admin already has `Modal`, `ConfirmModal`,
  `Dropdown`, `Tabs`, `Pagination`, `Tooltip`, `Toasts`, `ThemedSelect`, `MemberAvatar`,
  `MemberAvatarZoom`, `AppOutdatedBar`, `icon`, `i18n.ts`, `theme.ts`, `viewport.ts`,
  `graphql/client.ts`, `RelativeTime.logic`, `AppOutdated.logic`. Recommended: import them
  through an `@admin` alias onto `admin/src` (as the admin's tests read the wallet's files
  today) and change them there where the wallet needs more; a copy is the second choice.
  `tests/fixtures/graphql.ts` already comes from `admin/tests`.
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
- The store as a plain object (`wallet.store.ts`): the 37 fields of `useWalletStore.js` behind
  one valibot schema for the `login` / `verifyLogin` user (replaces 25 `?? null` and about 35
  one-line setters). `tokenTime`, `darkMode` are derived; `transactionToHighlightId` is not
  persisted. The keys stay: `gradido-frontend`, `auth-token`, `gradido-theme-mode`. Signing out
  reloads the page instead of calling 20 `forget*` functions.
- One helper for "a value per member in `localStorage`, read through a schema" (written by hand
  in 10 composables and 9 utils), one for the four hand-overs (`useEntryDraft`, `useLinkDraft`,
  `usePassOnDraft`, `useSendReturn`), one `memberKey` (five spellings today; keep each stored
  format readable).
- `i18n`: the admin's, lazy per language (the old wallet bundles all ten) with the number and
  date formats once (ten identical copies today, 440 lines) and one language list.
- Routes and guards (`routes.js`, `guards.js`, 890 lines) as one table with the meta the layout
  reads, and the seven guard steps in their order. Keep: `?pid=`, `/authenticate`, the first
  navigation with a running session, the event-matching link, `requiresAuth`,
  `creationAllowed`, `requiresFindable`. `guards.test.js` (1,330 lines) is the specification.
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
  `filters/amount.parseAmount`). `ContributionForm`'s `hours` measures the length of the string
  today: decide with the specs whether the number was meant.
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
| 4 | The shell: `DashboardLayout`, templates, `Menu/*`, `MobileSidebar`, `Breadcrumb`, footer, `ContentHeader`, `RightSide` (without the contact panels), `SessionLogoutTimeout`, `EmailConfirmation*`, `AdminWayBackBar` | 28 / 4,600 | ~90 | The menu is in the DOM twice (desk, phone) and asks once: a store, not a cache. Body scroll lock of the phone menu. |
| 5 | First steps: `FirstCreation`, `AliasFirstChoice`, `EventMatchingHomeInvitation`, `useFirstLoginWindow` | 5 / 1,900 | ~35 | Which window comes first is the logic to keep. |
| 6 | Contributions, support, information: three pages, `Contributions/`, `ContributionMessages/`, `Support/` | 19 / 2,960 | ~70 | Depends on the base only. The lists poll with `AUTO_POLL_INTERVAL`. |
| 7 | Scanner and calculator: `Scanner`, `Calculator`, `QrCode/*`, `useQrScanner`, `useCalculator*`, `qrDetector` | 14 / 2,900 | ~50 | The camera is released when the page leaves (`onremove`). `qrcanvas` without `qrcanvas-vue`. |
| 8 | Map core: `mapEngine`, `mapTiles`, `mapStyle`, `placeName`, `geoSearch*`, `GeoSearchField`, `UserLocationMap` | 16 / 1,800 | ~35 | Needed by settings and matching. maplibre lives in `oncreate` / `onremove`. |
| 9 | Settings: `settings/*`, `MyGradidoCard`, `UserSettings/*` | 24 / 3,300 (+3,200 utils) | ~90 | `gradidoCard.js` and `thankYouCard.js` are canvas code and move as they are. |
| 10 | Pictures: `ChatImageEditor`, `ChatImageView`, `EmojiPicker`, `ChatReactionChoice`, `AvatarZoom`, `AvatarCropper`, `ThankYouGreetingPhoto`, the image utils, and **one** picture cache for `useChatImages`, `useMemberAvatars`, `useKeptPictures`, `memoryPictures` | ~20 / 4,700 | ~60 | The admin's `memberAvatars.store` does in 72 lines what `useMemberAvatars` does in 503. |
| 11 | Transactions: page, `GddTransactionList`, `GdtTransactionList`, `Transactions/`, `DecayInformations/` (five files → one with variants), `TransactionRows/`, `TransactionLinks/` | 22 / 3,030 | ~70 | `date-fns` (one use) → the admin's `timeAgo`. |
| 12 | Redeem and thanks: `TransactionLink`, `LinkInformations/*`, `ThankYouGreeting`, `MyThankYouCard`, `ThankYouCardPayment`, `ThankYouGreeting/*` | 14 / 4,340 | ~80 | The print and cheque code is canvas and moves as it is; `thankYouCheque`, `avatarColor`, `qrCode` exist a second time in the admin — one copy. |
| 13 | Send: `Send`, `GddSend/*`, `CommunitySwitch` | 12 / 2,750 | ~50 | `Send` reads the communities the form loaded from Apollo's cache: hand them over. |
| 14 | Overview: `Overview`, `ShowFriends`, `Overview/*`, `ThanksNudge`, the contact panels of the right side | 8 / 1,940 | ~45 | |
| 15 | Chat, reading: `ContactWindow`, `ChatThread`, `ChatBubble`, message text, file card, search, note, unread, `useChatUpdates`, `useChatWindow*`, `chatMarkdown` | ~25 / 8,500 | ~110 | The thread lives in Apollo's cache today (five `cache.updateQuery`): a thread store. The beat: 15 s, backing off to 120 s. The openers of steps 4–14 become real; their specs join `PORTED_TO_MITHRIL`. |
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
rewritten as `bun test` files against the new paths before their old file goes; the eleven
`*.drift.spec.js` that hold a copy of `shared` in line go without a successor, the copy is gone.

**22. Remove the Vue wallet's code** — two pull requests
(a) `components/**/*.tsx` (about 190), (b) pages, layouts, composables, store, routes, plugins,
the Vue-only utils, `main.js`, `App.tsx`, `i18n.js`, the Vue, Apollo, vee-validate, yup,
bootstrap-vue-next, ESLint and Prettier dependencies and their config files (about 150).
What `frontend-mithril` imports through `@frontend` stays.

**23. One folder** — moves only, each pull request without a change of content
(a) styles: `assets/scss`, the `*.module.scss` and `.css` files next to their Mithril
components (about 200), `compile-scss` becomes a step of the one build; (b) `locales`,
`graphql`, `config` (as ESM TypeScript, without `vite-plugin-commonjs`), the remaining utils,
`public` (about 200); the `@frontend` alias and the second `index.html` go. (c)
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
