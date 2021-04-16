#########################################################################################################
# Build release 
#########################################################################################################
From conanio/gcc7 as release

ENV DOCKER_WORKDIR="/code"

USER root

COPY --from=unicorny/protoc:3.9.1 /usr/bin/protoc /usr/bin/
COPY --from=unicorny/protoc:3.9.1 /usr/lib/libprotobuf.so.20 /usr/lib/libprotobuf.so.20
COPY --from=unicorny/protoc:3.9.1 /usr/lib/libprotoc.so.20 /usr/lib/libprotoc.so.20
COPY --from=unicorny/protoc:3.9.1 /usr/include/google/protobuf/* /usr/include/google/protobuf/

	
RUN mkdir -p ${DOCKER_WORKDIR}
WORKDIR ${DOCKER_WORKDIR}

COPY . .
#RUN git submodule update --init --recursive
RUN ls -la 
# RUN cd dependencies/iroha-ed25519 && \
# 	ls -la && \
# 	mkdir build && \
# 	cd build && \	
# 	cmake .. -DEDIMPL=ref10 -DHASH=sha2_sphlib -DRANDOM=bcryptgen -DBUILD=STATIC && \
# 	make -j$(nproc)
	
RUN cd dependencies/mariadb-connector-c && \
	mkdir build && \
	cd build && \
	cmake -DWITH_SSL=OFF ..
	
RUN chmod +x compile_proto.sh
RUN chmod +x compile_pot.sh
RUN ls -la
RUN ./compile_pot.sh
RUN ./compile_proto.sh
RUN mkdir build && \
	cd build && \
	conan install .. --build=missing && \
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
