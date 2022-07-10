###############################################################################
# Dockerfile to create a ready to use Playwright Docker image for end-to-end
# testing
###############################################################################
ARG PLAYWIRGHT_VERSION=1.23.2

FROM mcr.microsoft.com/playwright:v$PLAYWIRGHT_VERSION-focal

WORKDIR /tests

RUN npm install playwright@$PLAYWIRGHT_VERSION
RUN npm install -D @playwright/test

COPY tests/ /tests
