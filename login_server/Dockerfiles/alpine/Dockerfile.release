
#########################################################################################################
# Build release 
#########################################################################################################
FROM gradido/login_dependencies:alpine-release-3 as release

ENV DOCKER_WORKDIR="/code"
WORKDIR ${DOCKER_WORKDIR}

COPY ./CMakeLists.txt.lib ./CMakeLists.txt
COPY ./src ./src
RUN ln -s /usr/local/googletest ./googletest
COPY ./dependencies/cmake-modules ./dependencies/cmake-modules
COPY ./dependencies/spirit-po ./dependencies/spirit-po
COPY ./dependencies/tinf ./dependencies/tinf
COPY ./scripts ./scripts

RUN mkdir build && \
	cd build && \
	cmake -DCMAKE_BUILD_TYPE=Release .. && \
	make -j$(nproc) Gradido_LoginServer

RUN cd scripts &&  \
	chmod +x compile_pot.sh && \
	./compile_pot.sh

	
#########################################################################################################
# run release 
#########################################################################################################
#From alpine:latest as login_server
FROM alpine:3.13.5 as login_server

USER root
WORKDIR "/usr/bin"

COPY --from=release /code/build/bin/Gradido_LoginServer /usr/bin/

COPY --from=release /usr/local/lib/mariadb/libmariadb.so.3 /usr/local/lib/
COPY --from=release /usr/local/lib/libPoco* /usr/local/lib/ 
COPY --from=release /usr/local/lib/libproto* /usr/local/lib/
COPY --from=release /usr/lib/libsodium.so.23 /usr/lib/ 
COPY --from=release /usr/lib/libstdc++.so.6 /usr/lib/ 
COPY --from=release /usr/lib/libgcc_s.so.1 /usr/lib/ 


RUN chmod +x /usr/bin/Gradido_LoginServer
ENTRYPOINT ["/usr/bin/Gradido_LoginServer"]
#CMD Gradido_LoginServer
