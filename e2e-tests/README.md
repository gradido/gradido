# Gradido End-to-End Testing with [Cypress](https://www.cypress.io/) (CI-ready via Docker)

A setup to show-case Cypress as an end-to-end testing tool for Gradido running in a Docker container.
The tests are organized in feature files written in Gherkin syntax.


## Features under test

So far these features are initially tested
- [User authentication](https://github.com/gradido/gradido/blob/master/e2e-tests/cypress/tests/cypress/e2e/User.Authentication.feature)
- [User profile - change password](https://github.com/gradido/gradido/blob/master/e2e-tests/cypress/tests/cypress/e2e/UserProfile.ChangePassword.feature)
- [User registration]((https://github.com/gradido/gradido/blob/master/e2e-tests/cypress/tests/cypress/e2e/User.Registration.feature)) (WIP)


## Precondition

Before running the tests, change to the repo's root directory (gradido).

### Boot up the system under test

```bash
docker-compose up
```

### Seed the database

The database has to be seeded upfront to every test run.

```bash
# change to the backend directory 
cd /path/to/gradido/gradido/backend

# install all dependencies
yarn 

# seed the database (everytime before running the tests)
yarn seed
```

## Execute the test

This setup will be integrated in the Gradido Github Actions to automatically support the CI/CD process.
For now the test setup can only be used locally in two modes.

### Run Cypress directly from the code

```bash
# change to the tests directory 
cd /path/to/gradido/e2e-tests/

# install all dependencies
yarn install

# a) run the tests on command line
yarn cypress run

# b) open the Cypress GUI to run the tests in interactive mode
yarn cypress open
```


### Run Cyprss from a separate Docker container

```bash
# change to the cypress directory 
cd /path/to/gradido/e2e-tests/

# build a Docker image from the Dockerfile
docker build -t gradido_e2e-tests-cypress .

# run the Docker image and execute the given tests
docker run -it --network=host gradido_e2e-tests-cypress yarn cypress-e2e
```
