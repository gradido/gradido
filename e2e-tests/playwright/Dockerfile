###############################################################################
# Dockerfile to create a ready-to-use Playwright Docker image for end-to-end
# testing.
#
# To avoid hardcoded versoning of Playwright, this Dockerfile is a custom
# version of the ready-to-use Dockerfile privided by Playwright developement
# (https://github.com/microsoft/playwright/blob/main/utils/docker/Dockerfile.focal)
#
# Here the latest stable versions of the browsers Chromium, Firefox, and Webkit
# (Safari) are installed, icluding all dependencies based on Ubuntu specified by
#  Playwright developement.
###############################################################################

FROM ubuntu:focal

# set a timezone for the Playwright browser dependency installation
ARG TZ=Europe/Berlin

ARG DOCKER_WORKDIR=/tests/
WORKDIR $DOCKER_WORKDIR

# package manager preparation
RUN apt-get -qq update && apt-get install -qq -y curl gpg > /dev/null
# for Node.js
RUN curl -sL https://deb.nodesource.com/setup_16.x | bash -
# for Yarn
RUN curl -sL https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add - && \
  echo "deb https://dl.yarnpkg.com/debian/ stable main" | tee /etc/apt/sources.list.d/yarn.list

# install node v16 and Yarn
RUN apt-get -qq update && apt-get install -qq -y nodejs yarn

COPY tests/package.json tests/yarn.lock $DOCKER_WORKDIR

# install Playwright with all dependencies
# for the browsers chromium, firefox, and webkit
RUN yarn install && yarn playwright install --with-deps

# clean up
RUN rm -rf /var/lib/apt/lists/* && apt-get -qq clean

COPY tests/ $DOCKER_WORKDIR
