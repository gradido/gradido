#########################################################################################################
# cmake 
#########################################################################################################
FROM gcc:9 as cmake-gcc-9 

ENV DOCKER_WORKDIR="/code"
RUN mkdir -p ${DOCKER_WORKDIR}
WORKDIR ${DOCKER_WORKDIR}

USER root

RUN git clone https://github.com/Kitware/CMake.git --branch=v3.19.8 \
    && cd CMake \
	&& ./bootstrap \
	&& make -j${nproc} \
	&& make install


#########################################################################################################
# Build release 
#########################################################################################################
From cmake-gcc-9 as release

ENV DOCKER_WORKDIR="/code"

USER root

RUN apt-get update \
    && apt-get -y --no-install-recommends install libboost-all-dev gettext \
    && apt-get clean; rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/* /usr/share/doc/*

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
FROM ubuntu:latest as login_server

USER root
WORKDIR "/usr/bin"

RUN apt-get update \
    && apt-get -y --no-install-recommends install libsodium-dev libssl-dev \
    && apt-get clean; rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/* /usr/share/doc/*

COPY --from=release /code/build/bin/Gradido_LoginServer /usr/bin/
COPY --from=release /code/build/lib/*.so.64 /usr/lib/
COPY --from=release /code/build/dependencies/mariadb-connector-c/libmariadb/libmariadb.so.3 /usr/lib/
#COPY --from=release /code/build/lib/libmariadb.so.3 /usr/lib/

RUN chmod +x /usr/bin/Gradido_LoginServer
ENTRYPOINT ["/usr/bin/Gradido_LoginServer"]
#CMD Gradido_LoginServer
