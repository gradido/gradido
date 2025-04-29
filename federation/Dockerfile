##################################################################################
# BASE ###########################################################################
##################################################################################
FROM node:18.20.7-alpine3.21 as base

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
ENV PORT="5010"
# ENV PORT="${env.FEDERATION_PORT}"

# Labels
LABEL org.label-schema.build-date="${BUILD_DATE}"
LABEL org.label-schema.name="gradido:federation"
LABEL org.label-schema.description="Gradido GraphQL Federation"
LABEL org.label-schema.usage="https://github.com/gradido/gradido/blob/master/README.md"
LABEL org.label-schema.url="https://gradido.net"
LABEL org.label-schema.vcs-url="https://github.com/gradido/gradido/tree/master/federation"
LABEL org.label-schema.vcs-ref="${BUILD_COMMIT}"
LABEL org.label-schema.vendor="Gradido Community"
LABEL org.label-schema.version="${BUILD_VERSION}"
LABEL org.label-schema.schema-version="1.0"
LABEL maintainer="support@gradido.net"

# Install Additional Software
## install: git
#RUN apk --no-cache add git

# Settings
## Expose Container Port
EXPOSE ${PORT}

## Workdir
RUN mkdir -p ${DOCKER_WORKDIR}
WORKDIR ${DOCKER_WORKDIR}

##################################################################################
# Base with turbo ################################################################
##################################################################################
FROM base as turbo-base

RUN apk update && apk add --no-cache libc6-compat \ 
  && yarn global add turbo@^2 \
  && rm -rf /tmp/* ~/.cache node_modules/.cache \
  && yarn cache clean

##################################################################################
# BUILDER (create partly monorepo only with data needed by dht-node) #############
##################################################################################
FROM turbo-base as builder

COPY --chown=app:app . . 
RUN turbo prune federation --docker


##################################################################################
# INSTALLER (create production image) ##############################################
##################################################################################
FROM turbo-base AS installer

# First install the dependencies (as they change less often)
COPY --chown=app:app --from=builder /app/out/json/ .
RUN yarn install --frozen-lockfile --production=false \
 && rm -rf /tmp/* ~/.cache node_modules/.cache \
 && yarn cache clean
 
# Build the project
COPY --chown=app:app --from=builder /app/out/full/ .
RUN turbo build

##################################################################################
# TEST ###########################################################################
##################################################################################
FROM installer as test

ENV DB_HOST=mariadb

# Run command
CMD /bin/sh -c "turbo federation#test --env-mode=loose"

##################################################################################
# PRODUCTION (Does contain only "binary"- and static-files to reduce image size) #
##################################################################################
FROM base as production

# Copy "binary"-files from build image
COPY --chown=app:app --from=installer ${DOCKER_WORKDIR}/dht-node/build/index.js ./index.js

# Copy log4js-config.json to provide log configuration
COPY --chown=app:app --from=installer ${DOCKER_WORKDIR}/dht-node/log4js-config.json ./log4js-config.json

# Run command
CMD ["node", "index.js"]