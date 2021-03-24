#########################################################################################################
# Build skeema
#########################################################################################################
FROM golang:1.14.4 as skeema_build 
RUN go get -d -v github.com/skeema/skeema
WORKDIR /go/src/github.com/skeema/skeema
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o /go/bin/skeema .

#########################################################################################################
# Run skeema
#########################################################################################################
From alpine:latest as skeema_run

ENV DOCKER_WORKDIR="/skeema"
	
# copy skeema 
COPY --from=skeema_build /go/bin/skeema /usr/bin/
	
RUN mkdir -p ${DOCKER_WORKDIR}
WORKDIR ${DOCKER_WORKDIR}

COPY ./skeema/.skeema .
COPY ./login_server/skeema/ .
COPY ./mariadb/.skeema.login ./gradido_login/.skeema
COPY ./community_server/skeema/ . 
COPY ./mariadb/.skeema.community ./gradido_community/.skeema

CMD skeema push