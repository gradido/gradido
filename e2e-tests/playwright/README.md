# Gradido End-to-End Testing with [Playwright](https://playwright.dev/) (CI-ready via Docker)


A sample setup to show-case Playwright (using Typescript) as an end-to-end testing tool for Gradido runniing in a Docker container.
Here we have a simple UI-based happy path login test running against the DEV system.

## Precondition
Since dependencies and configurations for Github Actions integration is not set up yet, please run in root directory

```bash
docker-compose up
```

to boot up the DEV system, before running the test.

## Execute the test

```bash
# build a Docker image from the Dockerfile
docker build -t gradido_e2e-tests-playwright .

# run the Docker container and execute the given tests
docker run -it gradido_e2e-tests-playwright npx playwright test
```
