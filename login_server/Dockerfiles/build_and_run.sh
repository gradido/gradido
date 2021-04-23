#!/bin/bash

cd build
cmake -DCMAKE_BUILD_TYPE=Debug ..
make -j${nproc} protoc grpc_cpp_plugin
cd ..

if [ ! -d "./src/cpp/proto/hedera" ] ; then
#if [ ! -f "./src/cpp/proto/gradido/TransactionBody.pb.h"] ; then 
	chmod +x unix_parse_proto.sh 
    ./unix_parse_proto.sh
fi
chmod +x compile_pot.sh

./compile_pot.sh

cd build 
cmake -DCMAKE_BUILD_TYPE=Debug ..
make -j$(nproc) Gradido_LoginServer
#echo "building done"
chmod +x ./bin/Gradido_LoginServer
#./bin/Gradido_LoginServer
