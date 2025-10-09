##################################################################################
# BASE ###########################################################################
##################################################################################
FROM node:18.20.7-bookworm as base

# ENVs (available in production aswell, can be overwritten by commandline or env file)
ENV TURBO_CACHE_DIR=/tmp/turbo
## DOCKER_WORKDIR would be a classical ARG, but that is not multi layer persistent - shame
ENV DOCKER_WORKDIR="/app"
## We Cannot do `$(date -u +'%Y-%m-%dT%H:%M:%SZ')` here so we use unix timestamp=0
ENV BUILD_DATE="1970-01-01T00:00:00.00Z"
## We cannot do $(npm run version).${BUILD_NUMBER} here so we default to 0.0.0.0
ENV BUILD_VERSION="0.0.0.0"
## We cannot do `$(git rev-parse --short HEAD)` here so we default to 0000000
ARG BUILD_COMMIT
ENV BUILD_COMMIT=${BUILD_COMMIT}
## SET NODE_ENV
ENV NODE_ENV="production"
## App relevant Envs
ENV BACKEND_PORT="4000"
ENV FEDERATION_PORT="5010"
ENV FRONTEND_MODULE_PORT="3000"
ENV ADMIN_MODULE_PORT="8080"

# Labels
LABEL org.label-schema.build-date="${BUILD_DATE}"
LABEL org.label-schema.name="gradido:backend"
LABEL org.label-schema.description="Gradido GraphQL Backend"
LABEL org.label-schema.usage="https://github.com/gradido/gradido/blob/master/README.md"
LABEL org.label-schema.url="https://gradido.net"
LABEL org.label-schema.vcs-url="https://github.com/gradido/gradido/tree/master/backend"
LABEL org.label-schema.vcs-ref="${BUILD_COMMIT}"
LABEL org.label-schema.vendor="Gradido Community"
LABEL org.label-schema.version="${BUILD_VERSION}"
LABEL org.label-schema.schema-version="1.0"
LABEL maintainer="support@gradido.net"

# Install Additional Software
## install: git
#apk add --no-cache libc6-compat
#RUN apk --no-cache add git
# Install bun
# RUN apt-get update && apt-get install -y curl unzip
RUN curl -fsSL https://bun.sh/install | BUN_INSTALL=/usr/local bash
# Add bun to PATH
# Install turbo globally
RUN bun install --global turbo
# Add bun's global bin directory to PATH
ENV PATH="/root/.bun/bin:${PATH}"

# Settings
## Expose Container Port
EXPOSE ${BACKEND_PORT}
EXPOSE ${FEDERATION_PORT}
EXPOSE ${FRONTEND_MODULE_PORT}
EXPOSE ${ADMIN_MODULE_PORT}

## Workdir
RUN mkdir -p ${DOCKER_WORKDIR}
WORKDIR ${DOCKER_WORKDIR}

##################################################################################
# DEVELOPMENT (Connected to the local environment, to reload on demand) ##########
##################################################################################
FROM base as development

# We don't need to copy or build anything since we gonna bind to the
# local filesystem which will need a rebuild anyway

# Run command
# (for development we need to execute yarn install since the
#  node_modules are on another volume and need updating)
CMD /bin/sh -c "bun install && turbo dev --env-mode=loose"

##################################################################################
# INSTALL (Does contain all node_modules) ########################################
##################################################################################
FROM base as install

# Copy everything
COPY --chown=app:app ./ ./

# yarn install
RUN bun install --frozen-lockfile --non-interactive


##################################################################################
# TEST ###########################################################################
##################################################################################
FROM install as test

# Run command
CMD /bin/sh -c "turbo test --env-mode=loose"

##################################################################################
# RESET DB #######################################################################
##################################################################################
FROM install as reset

# Run command
CMD /bin/sh -c "cd database && bun run reset"

##################################################################################
# BUILD (Does contain all files and is therefore bloated) ########################
##################################################################################
FROM install as build

# turbo build
RUN turbo build --env-mode=loose

##################################################################################
# PRODUCTION #####################################################################
##################################################################################
FROM build as production

# Run command
CMD /bin/sh -c "turbo start --env-mode=loose"

##################################################################################
# FINAL PRODUCTION IMAGE #########################################################
##################################################################################
FROM node:18.20.7-bookworm-slim as production2

ENV TURBO_CACHE_DIR=/tmp/turbo
ENV DOCKER_WORKDIR="/app"
ENV NODE_ENV="production"
ENV DB_HOST=mariadb
WORKDIR ${DOCKER_WORKDIR}

# Copy only the build artifacts from the previous build stage
COPY --chown=app:app --from=build /app/node_modules ./node_modules
COPY --chown=app:app --from=build /app/package.json ./package.json
COPY --chown=app:app --from=build /app/bun.lock ./bun.lock
COPY --chown=app:app --from=build /app/turbo.json ./turbo.json
# and Turbo cache to prevent rebuilding 
COPY --chown=app:app --from=build /tmp/turbo ./tmp/turbo

RUN yarn global add turbo

COPY --chown=app:app --from=build /app/backend ./backend
COPY --chown=app:app --from=build /app/frontend ./frontend
COPY --chown=app:app --from=build /app/admin ./admin
COPY --chown=app:app --from=build /app/database ./database
COPY --chown=app:app --from=build /app/config-schema ./config-schema
COPY --chown=app:app --from=build /app/federation ./federation
COPY --chown=app:app --from=build /app/dht-node ./dht-node

# Ports exposen
EXPOSE ${BACKEND_PORT}
EXPOSE ${FEDERATION_PORT}
EXPOSE ${FRONTEND_MODULE_PORT}
EXPOSE ${ADMIN_MODULE_PORT}

# Command to start
CMD ["turbo", "start", "--env-mode=loose"]

##################################################################################
# FINAL PRODUCTION IMAGE #########################################################
##################################################################################
FROM node:18.20.7-alpine3.21 as production-slim

ENV TURBO_CACHE_DIR=/tmp/turbo
ENV DOCKER_WORKDIR="/app"
ENV NODE_ENV="production"
ENV DB_HOST=mariadb
WORKDIR ${DOCKER_WORKDIR}

# Ports exposen
EXPOSE ${BACKEND_PORT}
EXPOSE ${FEDERATION_PORT}
EXPOSE ${FRONTEND_MODULE_PORT}
EXPOSE ${ADMIN_MODULE_PORT}

# Copy only the build artifacts from the previous build stage
COPY --chown=app:app --from=build /app/backend/build ./backend/build
COPY --chown=app:app --from=build /app/backend/locales ./backend/locales
COPY --chown=app:app --from=build /app/backend/log4js-config.json ./backend/log4js-config.json

COPY --chown=app:app --from=build /app/dht-node/build ./dht-node/build
COPY --chown=app:app --from=build /app/dht-node/log4js-config.json ./dht-node/log4js-config.json

COPY --chown=app:app --from=build /app/federation/build ./federation/build
COPY --chown=app:app --from=build /app/federation/log4js-config.json ./federation/log4js-config.json

COPY --chown=app:app --from=build /app/frontend/build ./frontend
COPY --chown=app:app --from=build /app/admin/build ./admin

RUN yarn global add udx-native@1.5.3 sodium-native@4.0.0

CMD ["turbo", "start", "--env-mode=loose"]
