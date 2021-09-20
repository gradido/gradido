#########################################################################################################
# Build skeema
#########################################################################################################
FROM golang:1.17.1 as skeema_build 
RUN go get -d -v github.com/skeema/skeema
WORKDIR /go/src/github.com/skeema/skeema
RUN go install github.com/skeema/skeema@v1.5.3

#########################################################################################################
# Run skeema
#########################################################################################################
FROM skeema_build as skeema_run

ENV DOCKER_WORKDIR="/skeema"

RUN mkdir -p ${DOCKER_WORKDIR}
WORKDIR ${DOCKER_WORKDIR}

COPY ./skeema/.skeema .
COPY ./login_server/skeema/ .
COPY ./mariadb/.skeema.login ./gradido_login/.skeema

CMD skeema push --allow-unsafe