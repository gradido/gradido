#########################################################################################################
# Build release 
#########################################################################################################
From conanio/gcc9 as release

ENV DOCKER_WORKDIR="/code"

USER root


RUN mkdir -p ${DOCKER_WORKDIR}
WORKDIR ${DOCKER_WORKDIR}

COPY . .
	
RUN cd dependencies/mariadb-connector-c && \
	mkdir build && \
	cd build && \
	cmake -DWITH_SSL=OFF ..
	
RUN chmod +x compile_pot.sh && ./compile_pot.sh
	
RUN mkdir build && \
	cd build && \
	conan install .. --build=missing && \
	cmake .. && \
	make -j$(nproc) protoc grpc_cpp_plugin
	
RUN chmod +x unix_parse_proto.sh && ./unix_parse_proto.sh

RUN cd build && \
    cmake .. && \
	make -j$(nproc) Gradido_LoginServer 

CMD ["./code"]
	
#########################################################################################################
# run release 
#########################################################################################################
#From alpine:latest as login_server
FROM alpine:latest as login_server

WORKDIR "/usr/bin"

COPY --from=release /code/build/bin/Gradido_LoginServer /usr/bin/
COPY --from=release /code/build/lib/libmariadb.so.3 /usr/lib/

RUN chmod +x /usr/bin/Gradido_LoginServer
ENTRYPOINT ["/usr/bin/Gradido_LoginServer"]
CMD Gradido_LoginServer
