##################################################################################
# BASE ###########################################################################
##################################################################################
FROM node:19.5.0-alpine3.17 as base
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
ENV PORT="6010"

# Labels
LABEL org.label-schema.build-date="${BUILD_DATE}"
LABEL org.label-schema.name="gradido:dlt-connector"
LABEL org.label-schema.description="Gradido dlt-connector"
LABEL org.label-schema.usage="https://github.com/gradido/gradido/blob/master/README.md"
LABEL org.label-schema.url="https://gradido.net"
LABEL org.label-schema.vcs-url="https://github.com/gradido/gradido/tree/master/dlt-connector"
LABEL org.label-schema.vcs-ref="${BUILD_COMMIT}"
LABEL org.label-schema.vendor="Gradido Community"
LABEL org.label-schema.version="${BUILD_VERSION}"
LABEL org.label-schema.schema-version="1.0"
LABEL maintainer="support@gradido.net"

# Install Additional Software
## install: @iota/client requirements
# Install Build Tool for Rust for @iota/client
RUN apk add --no-cache rust cargo python3 make g++ 

# Settings
## Expose Container Port
EXPOSE ${PORT}

## Workdir
RUN mkdir -p ${DOCKER_WORKDIR}
WORKDIR ${DOCKER_WORKDIR}

RUN mkdir -p /dlt-database

##################################################################################
# DEVELOPMENT (Connected to the local environment, to reload on demand) ##########
##################################################################################
FROM base as development

# We don't need to copy or build anything since we gonna bind to the
# local filesystem which will need a rebuild anyway

# Run command
# (for development we need to execute yarn install since the
#  node_modules are on another volume and need updating)
CMD /bin/sh -c "cd /dlt-database && yarn install && yarn build && cd /app && yarn install && yarn run dev"

##################################################################################
# BUILD (Does contain all files and is therefore bloated) ########################
##################################################################################
FROM base as build

# Copy everything from dlt-connector
COPY ./dlt-connector/ ./
# Copy everything from dlt-database
COPY ./dlt-database/ ../dlt-database/

# yarn install dlt-connector
RUN yarn install --production=false --frozen-lockfile --non-interactive

# yarn install dlt-database
RUN cd ../dlt-database && yarn install --production=false --frozen-lockfile --non-interactive

# yarn build
RUN yarn run build

# yarn build dlt-database
RUN cd ../dlt-database && yarn run build

##################################################################################
# TEST ###########################################################################
##################################################################################
FROM build as test

# Run command
CMD /bin/sh -c "yarn run start"

##################################################################################
# PRODUCTION (Does contain only "binary"- and static-files to reduce image size) #
##################################################################################
FROM base as production

# remove iota build tools to have production docker image smaller
RUN apk del rust cargo python3 make g++

# Copy "binary"-files from build image
COPY --from=build ${DOCKER_WORKDIR}/build ./build
COPY --from=build ${DOCKER_WORKDIR}/../dlt-database/build ../dlt-database/build
# We also copy the node_modules express and serve-static for the run script
COPY --from=build ${DOCKER_WORKDIR}/node_modules ./node_modules
COPY --from=build ${DOCKER_WORKDIR}/../dlt-database/node_modules ../dlt-database/node_modules
# Copy static files
# COPY --from=build ${DOCKER_WORKDIR}/public ./public
# Copy package.json for script definitions (lock file should not be needed)
COPY --from=build ${DOCKER_WORKDIR}/package.json ./package.json
# Copy tsconfig.json to provide alias path definitions
COPY --from=build ${DOCKER_WORKDIR}/tsconfig.json ./tsconfig.json
# Copy log4js-config.json to provide log configuration
COPY --from=build ${DOCKER_WORKDIR}/log4js-config.json ./log4js-config.json

# Copy run scripts run/
# COPY --from=build ${DOCKER_WORKDIR}/run ./run

# Run command
CMD /bin/sh -c "yarn run start"
