# Build 
From conanio/gcc7 as build

ENV DOCKER_WORKDIR="/build"


#RUN apt get update && \
    #apt-get install -y --no-install-recommends  && \
	#apt-get autoclean && \
	#apt-get autoremove && \
	#apt-get clean && \
	#rm -rf /var/lib/apt/lists/*
	
COPY . .
#RUN git submodule update --init --recursive
RUN cd dependencies/iroha-ed25519 && \
	mkdir build && \
	cd build && \	
	cmake .. -DEDIMPL=ref10 -DHASH=sha2_sphlib -DRANDOM=bcryptgen -DBUILD=STATIC && \
	make -j$(grep processor /proc/cpuinfo | wc -l)
	
RUN cd dependencies/mariadb-connector-c && \
	mkdir build && \
	cd build && \
	cmake -DWITH_SSL=OFF ..
	
RUN mkdir -p ${DOCKER_WORKDIR}
RUN cd ${DOCKER_WORKDIR} && \
	conan install .. --build=missing && \
	cmake .. && \
	make -j$(grep processor /proc/cpuinfo | wc -l)

