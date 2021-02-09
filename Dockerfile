
# Build 
From conanio/gcc7 as build

ENV DOCKER_WORKDIR="/code"

USER root
RUN apt-get update && \
    apt-get install -y --no-install-recommends protobuf-compiler && \
	apt-get autoclean && \
	apt-get autoremove && \
	apt-get clean && \
	rm -rf /var/lib/apt/lists/*
	

RUN mkdir -p ${DOCKER_WORKDIR}
WORKDIR ${DOCKER_WORKDIR}

COPY . .
RUN git submodule update --init --recursive
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
	make -j$(grep processor /proc/cpuinfo | wc -l)

