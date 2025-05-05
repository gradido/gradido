##################################################################################
# BASE ###########################################################################
##################################################################################
FROM node:18.20.7-bookworm-slim as base
#FROM node:18.20.7-alpine3.21 as base
#FROM ubuntu:latest as base

# ENVs (available in production aswell, can be overwritten by commandline or env file)
## DOCKER_WORKDIR would be a classical ARG, but that is not multi layer persistent - shame
ENV DOCKER_WORKDIR="/app"
## We Cannot do `$(date -u +'%Y-%m-%dT%H:%M:%SZ')` here so we use unix timestamp=0
ENV BUILD_DATE="1970-01-01T00:00:00.00Z"
## We cannot do $(npm run version).${BUILD_NUMBER} here so we default to 0.0.0.0
ENV BUILD_VERSION="0.0.0.0"
## We cannot do `$(git rev-parse --short HEAD)` here so we default to 0000000
ENV BUILD_COMMIT="0000000"
## SET NODE_ENV
ENV NODE_ENV="production"
## App relevant Envs
#ENV PORT="5000"
## Timezone
ENV TZ=UTC

# Labels
LABEL org.label-schema.build-date="${BUILD_DATE}"
LABEL org.label-schema.name="gradido:dht-node"
LABEL org.label-schema.description="Gradido dht-node"
LABEL org.label-schema.usage="https://github.com/gradido/gradido/blob/master/README.md"
LABEL org.label-schema.url="https://gradido.net"
LABEL org.label-schema.vcs-url="https://github.com/gradido/gradido/tree/master/dht-node"
LABEL org.label-schema.vcs-ref="${BUILD_COMMIT}"
LABEL org.label-schema.vendor="Gradido Community"
LABEL org.label-schema.version="${BUILD_VERSION}"
LABEL org.label-schema.schema-version="1.0"
LABEL maintainer="support@gradido.net"

# Install Additional Software
## install: sodium requirements
#RUN apk add --no-cache --virtual build-deps python3 alpine-sdk autoconf libtool automake && \
#  mkdir -p /prebuilds && cd /prebuilds && npm init -y && npm install sodium-native@3.1.1 && \
#  apk del build-deps
#ENV SODIUM_NATIVE_PREBUILD=/prebuilds/node_modules/sodium-native/

# Settings
## Expose Container Port
#EXPOSE ${PORT}

## Workdir
RUN mkdir -p ${DOCKER_WORKDIR}
WORKDIR ${DOCKER_WORKDIR}


##################################################################################
# BUN ############################################################################
##################################################################################
FROM base as bun-base

RUN apt update && apt install -y --no-install-recommends ca-certificates curl bash unzip
#RUN apk update && apk add --no-cache curl tar bash
RUN curl -fsSL https://bun.sh/install | bash
# Add bun's global bin directory to PATH
ENV PATH="/root/.bun/bin:${PATH}"

##################################################################################
# Development ####################################################################
##################################################################################
FROM bun-base AS development  

# Run command
CMD /bin/sh -c "bun install --filter dht-node --no-cache --frozen-lockfile \
  && bun install --global --no-cache --no-save turbo@^2 \
  && turbo dht-node#dev --env-mode=loose" 

##################################################################################
# BUILDER (create partly monorepo only with data needed by dht-node) #############
##################################################################################
FROM bun-base as build

COPY --chown=app:app . . 
RUN bun install --filter dht-node --no-cache --frozen-lockfile \
  && bun install --global --no-cache --no-save turbo@^2 \
  && turbo dht-node#build dht-node#typecheck --env-mode=loose

##################################################################################
# TEST ###########################################################################
##################################################################################
FROM build as test

ENV DB_HOST=mariadb
# Run command
CMD /bin/sh -c "turbo dht-node#test --env-mode=loose"

##################################################################################
# PRODUCTION (Does contain only "binary"- and static-files to reduce image size) #
##################################################################################
FROM base as production

# Copy "binary"-files from build image
COPY --chown=app:app --from=build ${DOCKER_WORKDIR}/dht-node/build/index.js ./index.js
COPY --chown=app:app --from=build ${DOCKER_WORKDIR}/scripts/clean-prebuilds.sh ./clean-prebuilds.sh
#COPY --chown=app:app --from=build ${DOCKER_WORKDIR}/dht-node/package.json ./package.json

# We also install the native node_modules which cannot be bundled
# TODO: find a elegant way to use the right versions from yarn.lock
RUN yarn add @hyperswarm/dht@^6.5.1 \
  && rm -rf /tmp/* ~/.cache node_modules/.cache \
  && yarn cache clean \
  && ./clean-prebuilds.sh

# Copy log4js-config.json to provide log configuration
COPY --chown=app:app --from=build ${DOCKER_WORKDIR}/dht-node/log4js-config.json ./log4js-config.json
ENV DB_HOST=mariadb
# Run command
CMD ["node", "index.js"]