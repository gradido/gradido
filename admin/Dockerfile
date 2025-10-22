##################################################################################
# BASE ###########################################################################
##################################################################################
FROM node:18.20.7-alpine3.21 as base

ENV TURBO_CACHE_DIR=/tmp/turbo
# ENVs (available in production aswell, can be overwritten by commandline or env file)
## DOCKER_WORKDIR would be a classical ARG, but that is not multi layer persistent - shame
ENV DOCKER_WORKDIR="/app"
## We Cannot do `$(date -u +'%Y-%m-%dT%H:%M:%SZ')` here so we use unix timestamp=0
ENV BUILD_DATE="1970-01-01T00:00:00.00Z"
## We cannot do $(npm run version).${BUILD_NUMBER} here so we default to 0.0.0.0
# TODO: get the actually git commit hash into docker
ARG BUILD_VERSION
ENV BUILD_VERSION=${BUILD_VERSION:-'broken'}
ARG BUILD_COMMIT
ENV BUILD_COMMIT=${BUILD_COMMIT:-'decafcabdecafcabdecafcabdecafcabdecafcab'}
ARG BUILD_COMMIT_SHORT
ENV BUILD_COMMIT_SHORT=${BUILD_COMMIT_SHORT:-'decafcab'}
## SET NODE_ENV
ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}
## App relevant Envs
ENV PORT="8080"
## Timezone
ENV TZ=UTC

# Labels
LABEL org.label-schema.build-date="${BUILD_DATE}"
LABEL org.label-schema.name="gradido:admin"
LABEL org.label-schema.description="Gradido Admin Interface"
LABEL org.label-schema.usage="https://github.com/gradido/gradido/blob/master/README.md"
LABEL org.label-schema.url="https://gradido.net"
LABEL org.label-schema.vcs-url="https://github.com/gradido/gradido/tree/master/admin"
LABEL org.label-schema.vcs-ref="${BUILD_COMMIT}"
LABEL org.label-schema.vendor="gradido Community"
LABEL org.label-schema.version="${BUILD_VERSION}"
LABEL org.label-schema.schema-version="1.0"
LABEL maintainer="support@ogradido.net"

# Install Additional Software
## install: git
#RUN apk --no-cache add git
# RUN bun add --global yarn@1.22.20

# Settings
## Expose Container Port
EXPOSE ${PORT}

## Workdir
RUN mkdir -p ${DOCKER_WORKDIR}
WORKDIR ${DOCKER_WORKDIR}

##################################################################################
# BUN ############################################################################
##################################################################################
FROM base as bun-base

RUN apk update && apk add --no-cache curl tar bash
COPY .bun-version .bun-version
RUN BUN_VERSION=$(cat .bun-version) && \
  curl -fsSL https://bun.com/install | bash -s "bun-v${BUN_VERSION}"
# Add bun's global bin directory to PATH
ENV PATH="/root/.bun/bin:${PATH}"

##################################################################################
# Development ####################################################################
##################################################################################
FROM bun-base AS development  

# used for getting git commit hash direct from .git
RUN apk update && apk add --no-cache git

# Run command
CMD /bin/sh -c "bun install --filter admin --no-cache --frozen-lockfile \
  && bun install --global --no-cache --no-save turbo@^2 \
  && turbo admin#dev --env-mode=loose" 


##################################################################################
# Build ##########################################################################
##################################################################################
FROM bun-base as build 

COPY --chown=app:app . . 
RUN bun install --filter admin --no-cache --frozen-lockfile \
&& bun install --global turbo@^2

RUN turbo admin#build --env-mode=loose

##################################################################################
# TEST ###########################################################################
##################################################################################
FROM build as test

# Run command
CMD /bin/sh -c "turbo admin#test --env-mode=loose"

##################################################################################
# PRODUCTION (Does contain only "binary"- and static-files to reduce image size) #
##################################################################################
FROM nginx:1.28.0-alpine3.21-slim as production

COPY ./nginx/admin.conf /etc/nginx/conf.d/default.conf

WORKDIR /app

# copy builded frontend files
COPY --from=build /app/admin/build/ ./admin/
