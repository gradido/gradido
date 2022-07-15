# Gradido End-to-End Testing with [Cypress](https://www.cypress.io/) (CI-ready via Docker)


A sample setup to show-case Cypress as an end-to-end testing tool for Gradido running in a Docker container.
Here we have a simple UI-based happy path login test running against the DEV system.

## Precondition
Since dependencies and configurations for Github Actions integration is not set up yet, please run in root directory

```bash
docker-compose up
```

to boot up the DEV system, before running the test.

## Execute the test

```bash
cd e2e-tests/cypress

# build a Docker image from the Dockerfile
docker build -t gradido_e2e-tests-cypress .

# run the Docker container and execute the given tests
docker run -it gradido_e2e-tests-cypress yarn run cypress-e2e-tests
```
