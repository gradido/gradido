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
## Timezone
ENV TZ=UTC
ENV DB_HOST=mariadb

# Labels
LABEL org.label-schema.build-date="${BUILD_DATE}"
LABEL org.label-schema.name="gradido:database"
LABEL org.label-schema.description="Gradido Database Migration Service"
LABEL org.label-schema.usage="https://github.com/gradido/gradido/blob/master/README.md"
LABEL org.label-schema.url="https://gradido.net"
LABEL org.label-schema.vcs-url="https://github.com/gradido/gradido/tree/master/database"
LABEL org.label-schema.vcs-ref="${BUILD_COMMIT}"
LABEL org.label-schema.vendor="Gradido Community"
LABEL org.label-schema.version="${BUILD_VERSION}"
LABEL org.label-schema.schema-version="1.0"
LABEL maintainer="support@gradido.net"

# Install Additional Software
## install: git
#RUN apk --no-cache add git

## Workdir
RUN mkdir -p ${DOCKER_WORKDIR}
WORKDIR ${DOCKER_WORKDIR}

##################################################################################
# BUN ############################################################################
##################################################################################
FROM base as bun-base

#RUN apt update && apt install -y --no-install-recommends ca-certificates curl bash unzip
RUN apk update && apk add --no-cache curl tar bash
RUN curl -fsSL https://bun.sh/install | bash
# Add bun's global bin directory to PATH
ENV PATH="/root/.bun/bin:${PATH}"

##################################################################################
# Installer ######################################################################
##################################################################################
FROM bun-base as installer

COPY --chown=app:app . .

##################################################################################
# Build Shared ###################################################################
##################################################################################
FROM installer as build-shared

RUN bun install --filter shared --no-cache --frozen-lockfile \
  && cd shared && bun run typecheck && bun run build 

##################################################################################
# Build ##########################################################################
##################################################################################
FROM installer as build

RUN bun install --filter database --production --no-cache --frozen-lockfile

##################################################################################
# PRODUCTION IMAGE ###############################################################
##################################################################################
FROM bun-base as production 

COPY --chown=app:app --from=build-shared ${DOCKER_WORKDIR}/shared/build ./shared/build
COPY --chown=app:app --from=build-shared ${DOCKER_WORKDIR}/shared/package.json ./shared/package.json
COPY --chown=app:app --from=build ${DOCKER_WORKDIR}/database ./database
COPY --chown=app:app --from=build ${DOCKER_WORKDIR}/node_modules ./node_modules
COPY --chown=app:app --from=build ${DOCKER_WORKDIR}/package.json ./package.json 

##################################################################################
# TEST UP ########################################################################
##################################################################################
FROM production as up

# Run command
CMD /bin/sh -c "cd database && bun run up"

##################################################################################
# TEST RESET #####################################################################
##################################################################################
FROM production as reset

# Run command
CMD /bin/sh -c "cd database && bun run reset"

##################################################################################
# TEST DOWN ######################################################################
##################################################################################
FROM production as down

# Run command
CMD /bin/sh -c "cd database && bun run down"
