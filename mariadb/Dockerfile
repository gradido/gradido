#########################################################################################################
# mariadb server 
#########################################################################################################
From mariadb/server:10.5 as mariadb_server

ENV DOCKER_WORKDIR="/docker-entrypoint-initdb.d"
	
RUN mkdir -p ${DOCKER_WORKDIR}
WORKDIR ${DOCKER_WORKDIR}

# create databases
COPY ./mariadb/setup_dbs.sql a_setup_dbs.sql 
# login server db
COPY ./login_server/skeema/ .
RUN cd ./gradido_login/ && for f in *.sql; do cp -- "$f" "../b_$f"; sed  -i '1i use gradido_login;' "../b_$f"; done
# community server db
COPY ./community_server/skeema/ . 
RUN cd ./gradido_community/ && for f in *.sql; do cp -- "$f" "../d_$f"; sed  -i '1i use gradido_community;' "../d_$f"; done
RUN cd ./gradido_community/insert && for f in *.sql; do cp -- "$f" "../../e_$f";  sed  -i '1i use gradido_community;' "../../e_$f"; done

