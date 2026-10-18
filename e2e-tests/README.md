# Gradido End-to-End Tests with [Playwright](https://playwright.dev/)

The tests drive the frontend in a real browser against a running backend, database and fake
mail server ([maildev](https://github.com/maildev/maildev)). They are plain JavaScript, run on
Node.js; Bun is only the package manager.

## Features under test

- Login with valid and invalid credentials (`tests/ValidLoginTest.js`, `tests/InvalidLoginTest.js`, `tests/UserAuthenticationTest.js`)
- Password reset: not registered, deleted, not yet activated and activated user (`tests/ResetPasswordTest.js`)
- Change password in the settings (`tests/ChangePasswordTest.js`)
- Registration with activation e-mail (`tests/RegistrationTest.js`)

Every test that changes data creates its own user with a unique e-mail address (`api/users.js`).
The tests can therefore run repeatedly without seeding in between, and in several browsers in
parallel.

## Layout

| Folder | Content |
| --- | --- |
| `tests/` | the test cases |
| `pages/` | page objects, one per frontend page |
| `components/` | page objects for parts shown on several pages (toasts, menu, first-login window) |
| `api/` | setting up test users over the GraphQL API |
| `mail/` | reading e-mails from maildev's REST API |
| `config/` | URLs of frontend, backend and mail server |

## Precondition

From the repository root:

```bash
# database, mail server and redis
docker compose -f docker-compose.yml -f docker-compose.test.yml up --detach mariadb mailserver redis

bun install
# seed once, the seeded users are only read by the tests
bun turbo seed

# test configuration: the frontend talks to the backend directly, the backend sends
# mails without a waiting time in between (EMAIL_CODE_REQUEST_TIME=0)
cp frontend/.env.test_e2e frontend/.env
cp backend/.env.test_e2e backend/.env

bun turbo backend#build frontend#build --env-mode=loose
bun turbo backend#start frontend#start --env-mode=loose
```

## Run the tests

```bash
cd e2e-tests
bun install
# browsers for the projects chromium, firefox and webkit
bunx playwright install

# all browsers
bun run test
# only one, as in the GitHub workflow
bun run test --project="Google Chrome"
```

Videos and traces of failed tests land in `test-results/`; open a trace with
`bunx playwright show-trace test-results/<test>/trace.zip`.
