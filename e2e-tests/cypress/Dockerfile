###############################################################################
# Dockerfile to create a ready-to-use Cypress Docker image for end-to-end
# testing.
#
# Based on the images containing several browsers, provided by Cypress.io
# (https://github.com/cypress-io/cypress-docker-images/tree/master/browsers)
# this Dockerfile is based a slim Linux Dockerfile using Node.js 16.14.2.
#
# Here the latest stable versions of the browsers Chromium and Firefox are
# installed before installing Cypress.
###############################################################################
FROM cypress/base:16.14.2-slim

ARG DOCKER_WORKDIR=/tests/
WORKDIR $DOCKER_WORKDIR

# install dependencies
RUN apt-get -qq update > /dev/null && \
  apt-get -qq install -y bzip2 mplayer wget > /dev/null

# install Chromium browser
RUN apt-get -qq install -y chromium > /dev/null

# install Firefox browser
RUN wget --no-verbose -O /tmp/firefox.tar.bz2 "https://download.mozilla.org/?product=firefox-latest&os=linux64&lang=en-US" && \
  tar -C /opt -xjf /tmp/firefox.tar.bz2 && \
  rm /tmp/firefox.tar.bz2 && \
  ln -fs /opt/firefox/firefox /usr/bin/firefox

# clean up
RUN rm -rf /var/lib/apt/lists/* && apt-get -qq clean > /dev/null

COPY tests/package.json tests/yarn.lock $DOCKER_WORKDIR

RUN yarn install
COPY tests/ $DOCKER_WORKDIR
