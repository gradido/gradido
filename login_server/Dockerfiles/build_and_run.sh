#!/bin/bash
./compile_proto.sh
if [ ! -d "./build" ] ; then
	mkdir ./build
    cd build
    conan install .. 
    cd ..
fi
cd build
cmake ..
make -j$(nproc) Gradido_LoginServer
chmod +x ./bin/Gradido_LoginServer
./bin/Gradido_LoginServer