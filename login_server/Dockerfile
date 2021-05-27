
#########################################################################################################
# Prepare debug 
#########################################################################################################
FROM gradido/login_dependencies:gcc9-debug-1 as prepare_debug

ENV DOCKER_WORKDIR="/code"
WORKDIR ${DOCKER_WORKDIR}

RUN echo '/usr/local/lib' >> /etc/ld.so.conf && ldconfig

COPY ./CMakeLists.txt.lib ./CMakeLists.txt
RUN ln -s /usr/local/googletest ./googletest
COPY ./src ./src
COPY ./cmake/CodeCoverage.cmake ./cmake/CodeCoverage.cmake
COPY ./dependencies/cmake-modules ./dependencies/cmake-modules
COPY ./dependencies/spirit-po ./dependencies/spirit-po
COPY ./dependencies/tinf ./dependencies/tinf
COPY ./scripts ./scripts


#########################################################################################################
# Install Coverage tool
#########################################################################################################
FROM prepare_debug as coverage


RUN apt-get update && \
    apt-get install -y --no-install-recommends python3-pip && \
	apt-get autoclean && \
	apt-get autoremove && \
    apt-get clean && \
	rm -rf /var/lib/apt/lists/*

RUN pip3 install gcovr setuptools wheel && \
    pip3 install fastcov


#########################################################################################################
# Build test 
#########################################################################################################
FROM coverage as test 

ENV DOCKER_WORKDIR="/code"
WORKDIR ${DOCKER_WORKDIR}


RUN if [ ! -d "./build_cov" ] ; then mkdir build_cov; fi

RUN cd build_cov && \
	cmake -DCMAKE_BUILD_TYPE=Debug -DCOLLECT_COVERAGE_DATA=ON -DCOVERAGE_TOOL=fastcov .. 
	#make -j$(nproc) Gradido_LoginServer_Test

#RUN chmod +x build_cov/bin/Gradido_LoginServer_Test
#CMD gdb -ex run ./build_cov/bin/Gradido_LoginServer_Test
#CMD ./build_cov/bin/Gradido_LoginServer_Test

#ENTRYPOINT make -C build_cov coverage
CMD cd build_cov && make -j$(nproc) Gradido_LoginServer_Test && make coverage && \
	if [ ! -d "./coverage" ] ; then mkdir coverage; fi && \
	cp coverage.info ./coverage/
	
#########################################################################################################
# Build debug 
#########################################################################################################
FROM prepare_debug as debug

ENV DOCKER_WORKDIR="/code"
WORKDIR ${DOCKER_WORKDIR}

RUN mkdir build && \
	cd build && \
	cmake -DCMAKE_BUILD_TYPE=Debug .. && \
	make -j$(nproc) Gradido_LoginServer

RUN cd scripts &&  \
	chmod +x compile_pot.sh && \
	./compile_pot.sh

RUN chmod +x build/bin/Gradido_LoginServer
ENTRYPOINT ["build/bin/Gradido_LoginServer"]

#########################################################################################################
# Build release 
#########################################################################################################
FROM gradido/login_dependencies:alpine-release-1 as release

ENV DOCKER_WORKDIR="/code"
WORKDIR ${DOCKER_WORKDIR}

COPY ./CMakeLists.txt.lib ./CMakeLists.txt
COPY ./src ./src
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
COPY --from=release  /usr/local/lib/libPoco* /usr/local/lib/ 
COPY --from=release  /usr/lib/libsodium.so.23 /usr/lib/ 
COPY --from=release  /usr/lib/libstdc++.so.6 /usr/lib/ 
COPY --from=release  /usr/lib/libgcc_s.so.1 /usr/lib/ 


RUN chmod +x /usr/bin/Gradido_LoginServer
ENTRYPOINT ["/usr/bin/Gradido_LoginServer"]
#CMD Gradido_LoginServer
