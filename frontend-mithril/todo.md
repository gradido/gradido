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
4. **Logic beside the view.** Pure logic on a thing in `src/data/*.logic.ts`, what wraps the
   browser in `src/browser/`, each with a `*.test.ts`. The 105
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
8. **No `m.redraw()` on trust.** Mithril draws anew by itself after an event handler it
   attached, after the promise such a handler returns is fulfilled, and after `m.request`
   (unless `background`). Every `m.redraw()` is held by a Playwright spec that fails without
   it; one no spec needs goes. Still to check, with the first page that draws each:
   `Modal.ts`, `Dropdown.ts`, `BusyButton.ts`, `Form.ts` (after a throw), `Toasts.ts` (two), `DeviceStore.ts`,
   `Theme.ts`, `browser/viewport.ts`, `browser/newVersion.ts`, `graphql/client.ts`.
9. **A building block no page draws yet** has its spec in `tests/blocks/`: `blocks.ts` mounts
   it on a page of its own, built beside the wallet (`/blocks/?form`), and the spec runs
   against the Mithril wallet only (`form.spec.ts`).
10. **What a browser may do in its own way** has its spec in `tests/browsers/`, where it touches
    what the wallet is for (an amount typed with a comma, for sending and creating). Those run
    in Chromium, Firefox and WebKit (`--project=browsers-chromium --project=browsers-firefox
    --project=browsers-webkit`), each in every language the wallet has. Few specs: everything
    else runs in Chromium only.

## Decisions to take in step 2

- **What the admin has and the wallet needs is copied: decided.** Nothing is imported from
  `admin/`, and the admin is left as it is until the wallet is done. The admin was written
  with less review than the wallet gets, so a copy is not taken as a model: it is read,
  shortened and put right like any file that is ported, with its test. Afterwards the two are
  brought together, and where they differ the wallet's file wins. Copied in 2a:
  the admin's `utils/authToken.ts`, as far as the session uses it, which became part of
  `store/Session.ts` (the hand-over to the admin comes with its step), and
  `store/appOutdated.ts`. Copied in 2b: `Modal`, `ConfirmModal`, `Dropdown`, `Tabs`,
  `Pagination`, `Toasts`, `AppOutdatedBar`, `icon`, `i18n.ts`, `theme.ts`, `viewport.ts`
  (`ThemedSelect` is the wallet's own). To copy with their steps: `MemberAvatar`,
  `MemberAvatarZoom`, `RelativeTime.logic`. Not needed: `Tooltip`.
- **Styles of bootstrap-vue-next: done.** The old wallet loads `bootstrap-vue-next.css`. The
  Mithril wallet loads `components/bootstrapVueNext.css` in its place: the rules whose classes
  it emits (`b-avatar*`, `b-pagination-pills`, `bv-d-sm-down-none`).
- **Icons.** About 135 icons of six sets (bi 63, mdi 65, ion 2, tabler 2, fa 1, humbleicons 1)
  through `unplugin-icons` with `compiler: 'raw'`, as in the admin. Install the six
  `@iconify-json/*` sets, not `@iconify/json`.

## The steps

Files are an estimate of what the pull request touches: new Mithril files, their tests and the
Playwright specs. `old` is what the step replaces (code files / lines).

### Before any page

**1. Dead code out of the old wallet** — done.
Checked again and found alive, so still there: `graphql/enums.js` (`GdtEntryType`, read by the
transaction rows), `favoritesLoaded`, `forgetSheet` and `forgetViewport` (the specs reset and
read state through them; they go with the specs in step 21), `@morev/vue-transitions` (its
components are unused, but its style sheet sets `.fade-enter-active`, the name
bootstrap-vue-next's own transitions use: it goes with bootstrap-vue-next in step 22), `$filters`
in `main.js` (`useFilters.ts` hands them to the TSX components).

**2. The base** (about 70 files), in two pull requests
No page yet; everything a page needs.

*2a, done:* `request` (`graphql/client.ts`), the session
(`store/Session.ts`, `data/Member.schema.ts`), `Resource`, the device values (`store/DeviceStore.ts`), `repeatWhileVisible`. Left
out on purpose, each to come with its first caller: the fields of the old store that are not the
member (`redirectPath`, `project`, `preLoginLanguage`, …), the per-member key of a device value,
the merged GraphQL documents, why a session ended (the hand-over to the sign-in page).

*2b:* everything below that is not named under 2a.
- `graphqlRequest` (the admin's, plus what the wallet's Apollo link does): `renewSession: false`
  as an option of its own (not the admin's `background`), a renewed token dropped when the
  member changed meanwhile, `403.13` → sign out and `/login`, `GRAPHQL_VALIDATION_FAILED` →
  outdated. No cache: `possibleTypes`, the merge policies and the 18 field-set specs in
  `graphql/` go with it; the schema check of the fixture replaces them.
- Done: `Resource`, the device values, and `Form` and `Field` (`components/`) as
  `ARCHITECTURE.md` describes them. The markup of `Field` is the one read off the old
  wallet's sign-in form; its picture is held with that page (step 3). To come with their first
  form: the textarea, the password field with its eye, a sentence the server says about a
  field (the user name is taken), and the texts of vee-validate's dictionary.
- Done: `Placeholder` (line, block, row, row with picture) and `BusyButton`, the locked button with its
  spinner: the one way a wait is shown, a deliberate change from the old wallet
  (`ARCHITECTURE.md`, "Waiting"). Looked at in the browser in both themes. To come with the
  first page that waits (step 4, the balance): what stands in a placeholder's place where the
  question failed (a short message and "try again"), and the pictures of the wait, checked in
  and run for `new` and `new-phone` only, with a sibling of `samePicture` for that.
- Done for the member, the language, `redirectPath` and the theme (`store/Theme.ts`); every
  other field comes with its first caller.
  The store as one object with plain fields (`session` in `Session.ts`, a `DeviceStore`): the 37 fields of `useWalletStore.js` behind
  one valibot schema for the `login` / `verifyLogin` user (replaces 25 `?? null` and about 35
  one-line setters). `tokenTime`, `darkMode` are derived; `transactionToHighlightId` is not
  persisted. The keys stay: `gradido-frontend`, `auth-token`, `gradido-theme-mode`. Signing out
  reloads the page instead of calling 20 `forget*` functions.
- Done: `MemberStore` (`store/MemberStore.ts`) for "a value per member in `localStorage`, read
  through a schema" (written by hand in 10 composables and 9 utils): `forSignedInMember()`
  hands out the `DeviceStore` under `<name>:<gradidoID>`, and what three of them carry behind
  the ID are further parts of the key, each after a colon as today, so each stored format
  stays readable. `HandOver` (`store/HandOver.ts`) for what
  one page leaves for the next (`useEntryDraft`, `useLinkDraft`, `usePassOnDraft`,
  `useSendReturn`): taken once, optionally only for a while. Without their check of the
  owner: a sign-out loads the page anew, and memory does not outlive that. Each value and
  each hand-over is declared with its first caller.
- Done: `i18n.ts` (`t`, `d`, `n`, `setLocale`, `LANGUAGES`), a copy of the admin's put right —
  English is bundled and stands in for a missing key, any other language is fetched when it is
  asked for, and the wallet is drawn only once it is there (the old wallet bundles all ten),
  with the number and date formats once (ten copies today, 440 lines) and one language list.
  The plural forms follow vue-i18n's rule and the Russian one of `utils/pluralRules.js`.
  One difference to the picture: the Dutch `long` date loses its weekday, which only the Dutch
  copy of the formats had. To come with its first caller: a text with a slot for markup in the
  middle (`<i18n-t>` / `I18nText` today, 29 places).
- Done: `m.redraw()` in the one `storage` listener of `store/DeviceStore.ts`: a change from
  another tab happens outside of Mithril. To be seen in the browser with the first page that
  draws a store (a tab on the sign-in page while another tab signs in).
- Done: `components/Toasts.ts` (`toastSuccess`, `toastError`, `toastInfo`), mounted by
  `main.ts` beside the pages, in the markup bootstrap-vue-next drew: its box and colours were
  measured against the old wallet's. Not taken over: the fade of 150 ms as a toast comes and
  goes. `toastErrorAfterReload` hands a toast to the page loaded next, for a session that
  ends: a revoked certificate, and a token of the server the wallet cannot read while a session
  runs (at a sign-in, `request` fails and the page says so). Its Playwright spec comes with the
  sign-in page (step 3), the first that shows a toast.
- Done: the notice of `browser/requireStorage.ts` (the browser refuses localStorage) through
  `i18n`, in all ten languages (`error.no-storage`). The language is the browser's: the
  member's own lies in the storage that is refused. The check throws at once, so that nothing
  after it loads, and the notice appears when its language is fetched.
- Done, the frame of routes and guards (`routes.js`, `guards.js`, 890 lines): `routes.ts` is
  one table (address, page as `import()`, `requiresAuth`) turned into Mithril's resolvers, and
  `data/Guard.logic.ts` decides as one pure function `whereTo`, with the cases of
  `guards.test.js` (1,330 lines) as its tests. In it: the start with a running session,
  `requiresAuth` (an expired sign-in is put away, the address kept in `session.redirectPath`
  for after the sign-in), `creationAllowed`. `sessionRuns` reads the end of the session off the
  token (`endsAt` in `authTokenSchema`), which replaces `tokenTime`. Each of the other steps
  comes with the first page it guards, in its place in the order: `/authenticate` and the
  redeem code of a start on `/login/:code` (step 3), the event-matching link, `requiresFindable`,
  the conversation to come back to (the chat). So do the rows of the table, the flags the
  layout reads (step 4), the rows that only lead on (`/` → `/login`) and the scroll to an
  anchor. An address is matched as Mithril does it: exact in case, and without a slash at its
  end, where vue-router took both.
- Not ported: the publisher id. Elopage is gone and its code is being removed (#4309); this is
  that issue's first step for the new wallet. `?pid=` in an address is ignored, the store has no
  field for it, `login`, `createUser` and `updateUserInfos` are sent without it (the server
  takes it as optional). From the switch (step 20) a link with `?pid=` stores nothing any more:
  accepted in #4309. Its field leaves the shared GraphQL documents in step 23.
- `repeatWhileVisible(ms, fn)` (`browser/timer.ts`): the one helper for what runs on a clock — it pauses while the tab is hidden
  and stops with the component or store that started it. For the chat's beat (with its
  back-off), the new-version check, the session's countdown, the e-mail confirmation, and the
  lists of contributions and support requests.
- The lists of contributions and support requests refresh on that clock, every
  `AUTO_POLL_INTERVAL_SECONDS`: the server's dial for its load, 0 (the default) for never. The
  config already works it out, and falls back to the older `AUTO_POLL_INTERVAL` in
  milliseconds, which the inspector keeps (it asks twice a second). New: the clock pauses
  while the tab is hidden, and asks at once when the tab is seen again. The chat keeps its own
  beat of 15 s. Step 23 ends the wallet's reading of the older variable.
- With the layout (step 4): the balance as a `Resource`, refreshed by whatever changes it. It
  is the answer to the booking list, as today, not a question of its own: whatever changes the
  balance changes the list, the server reads the balance off the last booking either way, and
  every further request is parsed, checked for its token and answered with a new one. The
  number of members is not asked with it. (Asking the GDT amount apart: later.) The counter of
  answers in `DashboardLayout`, by which the first-creation window tells a new balance from an
  old one, goes: the window refreshes and waits for that answer.
- Done: GraphQL documents that ask nearly the same are one each, with one schema: the member
  of `login` and `verifyLogin` (one fragment, `graphql/member.ts`), the four lists of creation
  groups (`graphql/creationGroups.ts`), `openCreations` for `openCreations` and
  `openCreationsAmounts`. They are `.ts` files with `gql`: typed, and a test can import them.
  `graphql/documents.test.ts` holds each against `backend/schema.graphql`, and against its
  valibot schema: every field the schema reads is asked for. A new document gets its row
  there. To come with the booking list (step 4): `transactionsQuery` and
  `transactionsUserCountQuery` as one, which carries the balance and not the number of members. The old wallet's documents stay untouched until it
  goes. The server is not changed.
- `jwt-decode` and `uuid` are not installed: the token is read as `AuthTokenStore` in `store/Session.ts` already reads it,
  a gradido ID is checked by `uuidv4Schema` of `shared/browser`.
- Done: the clipboard (`browser/clipboard.ts`). `copyText(text, copied)` copies through
  `clipboard-polyfill` and says so in a toast, also where it could not; `takesPicture()` and
  `copyPicture(png)` use the browser's own clipboard. The polyfill is called, not installed
  over `navigator.clipboard` (`overwrite-globals`): the browser's own stays as it is, so there
  is no order of two imports to hold with a test. A test holds instead that no other file
  reaches for `navigator.clipboard`: only `copyText` copies on a page without TLS.
- Done, the first half of the test for the texts (`texts.test.ts`), in place of the ESLint
  plugin that goes with ESLint (step 22): every key a `t('…')` in `src` names exists in
  `en.json`, and keys are written as literals so that it can read them. The second half —
  every key of `en.json` is named somewhere — stays with the old wallet's ESLint rule until
  step 22: 112 keys are put together at run time there (`pageTitle.${…}`, the first-creation
  catalog), and the rule's list of exceptions would have to be kept twice. A key only the
  Mithril wallet reads is named in that list (`frontend/.eslintrc.js`) until then.
- Done: the theme (`store/Theme.ts`: a `DeviceStore` on `gradido-theme-mode` that marks
  `body` and names the colour of the installed app's bar; seen in the browser for the switch,
  another tab and the system's preference), the viewport (`browser/viewport.ts`, `isPhone()`)
  and the icons (`unplugin-icons` with the `raw` compiler and `components/icon.ts`, as in the
  admin; the sets the old wallet draws from).
- Done: `browser/newVersion.ts` (`reloadOnStaleChunk`, `watchForNewVersion`) and
  `components/AppOutdatedBar.ts`, mounted by `main.ts` above the pages. The check runs on
  `repeatWhileVisible`: every quarter of an hour while the tab is seen, and when it is seen
  again. Not taken over: `pageshow` and every change of page as further triggers, which were
  for iOS before 13. The build files are read off the page's text, not its DOM, so that the
  test needs no DOM.
- Done, the building blocks more than one page needs (`components/`): `Modal` (for `BModal`,
  22 files, and `AppModal`), `ConfirmModal`, `Dropdown`, `ThemedSelect`, `Tabs`, `Pagination`,
  `Collapse` (slides by CSS, without Bootstrap's JS), beside `Field`, `Toasts`, `Placeholder`, `BusyButton`.
  Each draws the markup bootstrap-vue-next drew in the old wallet, read off a browser for the
  attributes the wallet passes; the drawn `Pagination` is held to it by a spec (`tests/blocks/pagination.spec.ts`, 123 cases). They were
  tried in a browser (keys, focus, Escape, a click beside); the picture of each is held with
  the first page that draws it. One difference: roles, names and keys follow the WAI-ARIA
  patterns, not bootstrap-vue-next (ARCHITECTURE.md, Components; `tests/blocks/keyboard.spec.ts`). A dropdown opens
  upwards where the window has more room there and the menu does not fit below, and is never
  higher than that room, as bootstrap-vue-next's did through floating-ui.
  To come with the page that needs them, because one page does or the markup is the page's:
  `Carousel` and `Popover` (one use each, the sign-in layout, step 3); the password field
  with its eye and its list of rules, the textarea, the user name field (step 3 and the
  settings) in place of `InputPassword`, `InputPasswordConfirmation`, `InputUsername`,
  `AccountFields`; one result block for `Message`, `SuccessMessage`,
  `TransactionResultSendError`, `SendEmailResultError`, `RecipientNotFound`; the markup of
  `ClipboardCopy`, `GradidoAddressCopy`, `ChatVideoLinkCopy` around `copyText`; `MemberAvatar`
  and its zoom with the pictures (step 4). Not needed: `Tooltip`, the wallet has none.
- Done: the rules of `validationSchemas.js` and `validation-rules.js` in valibot
  (`data/Form.schema.ts`), with the bounds from `shared/browser`: amount (one rule, also for
  the hours of a contribution, with their own sentences), memo, message, support request,
  subject, e-mail, a new password. The e-mail's sentence, which the old wallet took from
  vee-validate's dictionary, is a key of the wallet now (`form.validation.email`, the
  dictionary's words in all ten languages). To come with their form: the recipient (with the
  Gradido address, the send page), the user name (its `min` and `max` sentences, and the
  rule that asks the server), the date and the memo of a contribution, "the two passwords
  are the same" (a rule of the form, not of a field).
  `ContributionForm`'s hours keep their rule as it is: a number of at most two decimals, from
  0.01 to the hours left, with a comma taken as a point.
- Classes the styles rely on, to be emitted as they are: `.gdd-toaster`, `.gdd-toaster-title`,
  `.gdd-toaster-body` (the rules for `.b-toast-{success,danger,warning}` in
  `gradido-template.scss` match nothing bootstrap-vue-next 0.26 draws, and go with it),
  `.b-avatar`, `.b-avatar-custom`, `.b-pagination-pills`, `.bv-d-sm-down-none`, and Bootstrap's
  own modal, tab, dropdown, carousel, popover and navbar structure.

### Pages

Order follows what imports what. Chat is opened from many places: until step 15, a page that
opens a contact window calls an opener that does nothing in the new wallet, and its spec for
that click stays on `old` only.

| # | Step | Old (files / lines) | Files in the PR | Notes |
| --- | --- | --- | --- | --- |
| 3 | Sign-in pages and their layout: `AuthLayout`, `Auth/*`, Login, Register, RegisterCommunity, ForgotPassword, ResetPassword, ConfirmEmail, EmailChange, PublicProfile, NotFound | 16 / 3,260 | ~60 | `NotFoundPage` is 1,200 lines of inline SVG: one `.svg` file. The two backend sentences Login matches stay pinned by a test. |
| 4 | The shell: `DashboardLayout`, templates, `Menu/*`, `MobileSidebar`, `Breadcrumb`, footer, `ContentHeader`, `RightSide` (without the contact panels), `SessionLogoutTimeout`, `EmailConfirmation*`, `AdminWayBackBar` | 28 / 4,600 | ~90 | The settings menu is in the DOM twice today (desk, phone): draw it once, by the width, if the picture stays the same without a change to the styles; else twice, reading one `Resource`. Body scroll lock of the phone menu. |
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
| 15 | Chat, reading: `ContactWindow`, `ChatThread`, `ChatBubble`, message text, file card, search, note, unread, `useChatUpdates`, `useChatWindow*`, `chatMarkdown` | ~25 / 8,500 | ~110 | The thread lives in Apollo's cache today (five `cache.updateQuery`) but nothing else reads it: an array in the component, patched by the pure functions that exist. The beat: 15 s, backing off to 120 s. The openers of steps 4–14 become real, and so do the marks of the menu the beat brings (unread, "Support", "Schöpfen", the two at "Admin"), which step 4 draws without numbers; their specs join `PORTED_TO_MITHRIL`. |
| 16 | Chat, writing: `ChatComposeBar`, `ChatForwardDialog`, `ChatMessageMenu`, `ChatTransferCoin`, drafts, file links, `useFieldOutOfSight` | ~12 / 3,500 | ~60 | Android keyboard and `visualViewport`: test on a device, Playwright does not show it. |
| 17 | Chat, video: `ChatVideoCall`, `ChatVideoApp*`, `utils/chatVideo*` | ~10 / 2,900 | ~45 | The six `provide` / `inject` become plain arguments. |
| 18 | Contacts and groups: `Contacts`, `Contacts/*`, `ChatGroups/*` | 11 / 3,200 | ~55 | `ContactWindow` and `ChatGroupWindow` share size, note and video: one window base. One avatar row for `ContactRow`, `ChatGroupRow`, `ContactTiles`, `ContactsStrip`, `ContactsPanel`. |
| 19 | Matching: (a) `Matching`, `EventMatchingBuilder`, `EventMatchingLanding`, `useMatches` (670 of its 890 lines are pure → `Matching.logic.ts`); (b) `MatchingMap`, `MatchList`, `MatchProfile`, `MatchQuery`, `MatchCluster` | 10 / 7,200 | (a) ~60, (b) ~60 | Two pull requests. The map writes ticks into the list the page reads, through Apollo's cache: one store for both. |

### The switch

**20. Deploy the Mithril wallet** (about 15 files)
`deployment/bare_metal/start.sh`, the nginx templates (`root …/frontend-mithril/build/`),
`deployment/hetzner_cloud/install.sh`, `frontend/Dockerfile` and the compose files, the
`e2e-tests`. `PORTED_TO_MITHRIL` holds every spec. The old wallet's stored state is flat
(`gradidoID` beside `language`), the new one's holds `member`: read the old shape once at the
start, or the switch signs every member out. Before it: a run through the whole wallet on a
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
With ESLint goes its rule for texts nobody reads: `texts.test.ts` gets its second half (every
key of `en.json` is named in `src`, with the keys put together at run time listed by prefix).

**23. One folder** — moves only: a moved file keeps its content, but for the import paths and
the build configuration the move itself changes, in the same pull request. Each of them leaves
both the build and the specs passing.
(a) styles: `assets/scss`, the `*.module.scss` and `.css` files next to their Mithril
components (about 200), `compile-scss` becomes a step of the one build; (b) `locales`,
`graphql`, `config` (as ESM TypeScript, without `vite-plugin-commonjs`), the remaining utils,
`public` (about 200); with the last of them the `@frontend` alias goes, once nothing imports
through it, and the old wallet's `index.html` together with `src/indexHtml.drift.test.ts`,
which has nothing left to compare. (c)
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
