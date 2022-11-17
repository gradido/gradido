##################################################################################
# BASE ###########################################################################
##################################################################################
FROM node:16-alpine3.14 as base

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
ENV PORT="3000"

# Labels
LABEL org.label-schema.build-date="${BUILD_DATE}"
LABEL org.label-schema.name="gradido:frontend"
LABEL org.label-schema.description="Gradido Wallet Interface"
LABEL org.label-schema.usage="https://github.com/gradido/gradido/blob/master/README.md"
LABEL org.label-schema.url="https://gradido.net"
LABEL org.label-schema.vcs-url="https://github.com/gradido/gradido/tree/master/frontend"
LABEL org.label-schema.vcs-ref="${BUILD_COMMIT}"
LABEL org.label-schema.vendor="gradido Community"
LABEL org.label-schema.version="${BUILD_VERSION}"
LABEL org.label-schema.schema-version="1.0"
LABEL maintainer="support@ogradido.net"

# Install Additional Software
## install: node-gyp dependencies
RUN apk --no-cache add g++ make python3

# Settings
## Expose Container Port
EXPOSE ${PORT}

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
# (for development we need to execute npm install since the
#  node_modules are on another volume and need updating)
CMD /bin/sh -c "yarn install && yarn run dev"

##################################################################################
# BUILD (Does contain all files and is therefore bloated) ########################
##################################################################################
FROM base as build

# Copy everything
COPY . .
# npm install
RUN yarn install --production=false --frozen-lockfile --non-interactive
# npm build
RUN yarn run build

##################################################################################
# TEST ###########################################################################
##################################################################################
FROM build as test

# Install Additional Software
RUN apk add --no-cache bash jq

# Run command
CMD /bin/sh -c "yarn run dev"

##################################################################################
# PRODUCTION (Does contain only "binary"- and static-files to reduce image size) #
##################################################################################
FROM base as production

# Copy "binary"-files from build image
COPY --from=build ${DOCKER_WORKDIR}/dist ./dist
# We also copy the node_modules express and serve-static for the run script
COPY --from=build ${DOCKER_WORKDIR}/node_modules ./node_modules
# Copy static files
COPY --from=build ${DOCKER_WORKDIR}/public ./public
# Copy package.json for script definitions (lock file should not be needed)
COPY --from=build ${DOCKER_WORKDIR}/package.json ./package.json
# Copy run scripts run/
COPY --from=build ${DOCKER_WORKDIR}/run ./run

# Run command
CMD /bin/sh -c "yarn run start"


 
## add `/usr/src/app/node_modules/.bin` to $PATH
#ENV PATH /usr/src/app/node_modules/.bin:$PATH
# 
## install and cache app dependencies
#COPY package.json /usr/src/app/package.json
#RUN npm install
#RUN npm install -g @vue/cli
## start app
#CMD ["npm", "run", "serve"]