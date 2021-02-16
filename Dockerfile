#########################################################################################################
# Build protoc 
#########################################################################################################
FROM gcc:7.5 as protoc_build
RUN git clone --recurse-submodules https://github.com/protocolbuffers/protobuf.git
WORKDIR /protobuf

RUN	git checkout v3.9.1
RUN ./autogen.sh 
RUN	./configure --enable-static=yes
RUN	make -j$(grep processor /proc/cpuinfo | wc -l)
RUN make check

CMD ["./protobuf"]
#########################################################################################################
# Build debug
#########################################################################################################
From conanio/gcc7 as debug

ENV DOCKER_WORKDIR="/code"

USER root
RUN apt-get update && \
    apt-get install -y --no-install-recommends gdb && \
	apt-get autoclean && \
	apt-get autoremove && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

COPY --from=protoc_build /protobuf/src/.libs/protoc /usr/bin/
COPY --from=protoc_build /protobuf/src/.libs/libprotobuf.so.20.0.1 /usr/lib/libprotobuf.so.20
COPY --from=protoc_build /protobuf/src/.libs/libprotoc.so.20.0.1 /usr/lib/libprotoc.so.20
COPY --from=protoc_build /protobuf/src/google/protobuf/*.proto /usr/include/google/protobuf/
COPY --from=protoc_build /protobuf/src/google/protobuf/*.h /usr/include/google/protobuf/

	
RUN mkdir -p ${DOCKER_WORKDIR}
WORKDIR ${DOCKER_WORKDIR}

COPY . .
#RUN git submodule update --init --recursive
RUN ls -la 
RUN cd dependencies/iroha-ed25519 && \
	ls -la && \
	mkdir build && \
	cd build && \	
	cmake .. -DCMAKE_BUILD_TYPE=Debug -DEDIMPL=ref10 -DHASH=sha2_sphlib -DRANDOM=bcryptgen -DBUILD=STATIC && \
	make -j$(grep processor /proc/cpuinfo | wc -l)
	
RUN cd dependencies/mariadb-connector-c && \
	mkdir build && \
	cd build && \
	cmake -DCMAKE_BUILD_TYPE=Debug -DWITH_SSL=OFF ..
	
#RUN conan profile update settings.compiler.libcxx=libstdc++11 default
RUN chmod +x compile_proto.sh
RUN chmod +x compile_pot.sh
RUN ls -la
RUN ./compile_pot.sh
RUN ./compile_proto.sh
RUN mkdir build && \
	cd build && \
	conan install .. --build=missing -s build_type=Debug && \
	cmake  -DCMAKE_BUILD_TYPE=Debug .. && \
	make -j$(grep processor /proc/cpuinfo | wc -l)


#########################################################################################################
# Build release 
#########################################################################################################
From conanio/gcc7 as release

ENV DOCKER_WORKDIR="/code"

USER root
#RUN apt-get update && \
#    apt-get install -y --no-install-recommends protobuf-compiler libprotobuf-dev && \
#	 apt-get autoclean && \
#	 apt-get autoremove && \
#    apt-get clean && \
#	 rm -rf /var/lib/apt/lists/*

#RUN grep processor /proc/cpuinfo | wc -l

COPY --from=protoc_build /protobuf/src/.libs/protoc /usr/bin/
COPY --from=protoc_build /protobuf/src/.libs/libprotobuf.so.20.0.1 /usr/lib/libprotobuf.so.20
COPY --from=protoc_build /protobuf/src/.libs/libprotoc.so.20.0.1 /usr/lib/libprotoc.so.20
COPY --from=protoc_build /protobuf/src/google/protobuf/*.proto /usr/include/google/protobuf/
COPY --from=protoc_build /protobuf/src/google/protobuf/*.h /usr/include/google/protobuf/

	
RUN mkdir -p ${DOCKER_WORKDIR}
WORKDIR ${DOCKER_WORKDIR}

COPY . .
#RUN git submodule update --init --recursive
RUN ls -la 
RUN cd dependencies/iroha-ed25519 && \
	ls -la && \
	mkdir build && \
	cd build && \	
	cmake .. -DEDIMPL=ref10 -DHASH=sha2_sphlib -DRANDOM=bcryptgen -DBUILD=STATIC && \
	make -j$(grep processor /proc/cpuinfo | wc -l)
	
RUN cd dependencies/mariadb-connector-c && \
	mkdir build && \
	cd build && \
	cmake -DWITH_SSL=OFF ..
	
#RUN conan profile update settings.compiler.libcxx=libstdc++11 default
RUN chmod +x compile_proto.sh
RUN chmod +x compile_pot.sh
RUN ls -la
RUN ./compile_pot.sh
RUN ./compile_proto.sh
RUN mkdir build && \
	cd build && \
	conan install .. --build=missing && \
	cmake .. && \
	make -j$(grep processor /proc/cpuinfo | wc -l) Gradido_LoginServer 
	
RUN  ls -la *
RUN  ls -la build/*	
RUN  ls -la build/bin/
CMD ["./code"]
	
#########################################################################################################
# run release 
#########################################################################################################
#From alpine:latest as login_server
FROM alpine:latest as login_server

WORKDIR "/usr/bin"

COPY --from=release /code/build/bin/Gradido_LoginServer /usr/bin/
COPY --from=release /code/build/lib/libmariadb.so.3 /usr/lib/
COPY start_after_mysql.sh . 
RUN chmod +x /usr/bin/Gradido_LoginServer
#ENTRYPOINT ["/usr/bin/Gradido_LoginServer"]
# Wait on mariadb to started
#CMD ["sleep 5", "/usr/bin/Gradido_LoginServer"]
RUN chmod +x ./start_after_mysql.sh
#CMD ./start_after_mysql.sh
ENTRYPOINT ["/usr/bin/Gradido_LoginServer"]
CMD Gradido_LoginServer

#########################################################################################################
# run debug
#########################################################################################################
FROM alpine:latest as login_server_debug

WORKDIR "/usr/bin"

RUN apt-get update && \
    apt-get install -y --no-install-recommends gdb && \
	apt-get autoclean && \
	apt-get autoremove && \
    apt-get clean && \
	rm -rf /var/lib/apt/lists/*

COPY --from=debug /code/build/bin/Gradido_LoginServer /usr/bin/
COPY --from=debug /code/build/lib/libmariadb.so.3 /usr/lib/
COPY start_after_mysql.sh . 
RUN chmod +x /usr/bin/Gradido_LoginServer
#ENTRYPOINT ["/usr/bin/Gradido_LoginServer"]
# Wait on mariadb to started
#CMD ["sleep 5", "/usr/bin/Gradido_LoginServer"]
RUN chmod +x ./start_after_mysql.sh
ENTRYPOINT ["/usr/bin/Gradido_LoginServer"]
CMD Gradido_LoginServer