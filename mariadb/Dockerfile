#########################################################################################################
# Build skeema
#########################################################################################################
FROM golang:1.14.4 as skeema_build 
RUN go get -d -v github.com/skeema/skeema
WORKDIR /go/src/github.com/skeema/skeema
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o /go/bin/skeema .

#########################################################################################################
# mariadb server 
#########################################################################################################
From mariadb/server:10.5 as mariadb_server

#ENV DOCKER_WORKDIR="/docker-entrypoint-initdb.d"
ENV DOCKER_WORKDIR="/skeema"

# copy skeema 
COPY --from=skeema_build /go/bin/skeema /usr/bin/
	
RUN mkdir -p ${DOCKER_WORKDIR}
WORKDIR ${DOCKER_WORKDIR}
#COPY ./mariadb/.skeema .
COPY ./login_server/skeema/ .
#COPY ./mariadb/.skeema.login ./gradido_login/.skeema
COPY ./community_server/skeema/ . 



#USER mysql
#VOLUME /var/lib/mysql
#RUN mysqld
#RUN mysql -e 'CREATE DATABASE gradido_login_server;'
#RUN mysql -e 'CREATE DATABASE gradido_community_server;'


#RUN skeema push 

#########################################################################################################
# mariadb server selfmade
#########################################################################################################
From alpine:latest as mariadb_DIV

ENV DOCKER_WORKDIR="/skeema"



#RUN apt-get update \
#    && apt-get -y --no-install-recommends install mariadb-server mariadb-client \
#    && apt-get clean; rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/* /usr/share/doc/*
RUN apk add mariadb mariadb-client
	
# copy skeema 
COPY --from=skeema_build /go/bin/skeema /usr/bin/
	
RUN mkdir -p ${DOCKER_WORKDIR}
WORKDIR ${DOCKER_WORKDIR}

COPY ./mariadb/setup_dbs.sh .
COPY ./mariadb/.skeema .
COPY ./login_server/skeema/ .
COPY ./mariadb/.skeema.login ./gradido_login/.skeema
COPY ./community_server/skeema/ . 
COPY ./mariadb/.skeema.community ./gradido_community/.skeema

USER mysql 
#VOLUME /var/lib/mysql
RUN mysqld 
RUN chmod +x ./setup_dbs.sh
RUN mysql < setup_dbs.sql
RUN skeema push 

EXPOSE 3306

CMD ["mysld"]