#########################################################################################################
# mariadb server 
#########################################################################################################
FROM mariadb/server:10.5 as mariadb_server

ENV DOCKER_WORKDIR="/docker-entrypoint-initdb.d"
	
RUN mkdir -p ${DOCKER_WORKDIR}
WORKDIR ${DOCKER_WORKDIR}

# create databases
COPY ./mariadb/setup_dbs.sql a_setup_dbs.sql 
# login server db
COPY ./login_server/skeema/ .
RUN cd ./gradido_login/ && for f in *.sql; do cp -- "$f" "../b_$f"; sed  -i '1i use gradido_login;' "../b_$f"; done
COPY ./configs/login_server/setup_db_tables ./gradido_login/insert
RUN cd ./gradido_login/insert && for f in *.sql; do cp -- "$f" "../../c_$f";  sed  -i '1i use gradido_login;' "../../c_$f"; done
# community server db
COPY ./community_server/db/skeema/ . 
RUN cd ./gradido_community/ && for f in *.sql; do cp -- "$f" "../d_$f"; sed  -i '1i use gradido_community;' "../d_$f"; done
COPY ./community_server/db/setup_db_tables ./gradido_community/insert 
RUN cd ./gradido_community/insert && for f in *.sql; do cp -- "$f" "../../e_$f";  sed  -i '1i use gradido_community;' "../../e_$f"; done

#########################################################################################################
# mariadb server with test dbs
#########################################################################################################
FROM mariadb_server as mariadb_server_test

# create test databases
COPY ./mariadb/setup_test_dbs.sql a2_setup_dbs.sql 

# login server test db
COPY ./login_server/skeema/ .
RUN cd ./gradido_login/ && for f in *.sql; do cp -- "$f" "../b_$f"; sed  -i '1i use gradido_login_test;' "../b_$f"; done

