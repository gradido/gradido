# Gradido end-to-end tests

The end-to-end tests utilize the Python-based keyword-driven testing and automation framework [Robotframework](https://robotframework.org/) and for in-browser UI-based frontend tests the contemporary modern  [Playwright](https://playwright.dev/)-based library [robotframework-browser](https://robotframework-browser.org/).


## Install and run with Docker

To install everything required to build the tests framework

```bash
# build
docker build -t gradido-end-to-end-tests .
```

To run the ready-to-go test infratructure

```bash
# run the ready-to-go test infrastructure
docker run -it -p 80:80 --rm gradido-end-to-end-tests
```
