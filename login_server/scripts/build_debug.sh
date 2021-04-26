#!/bin/sh

cd ../build
cmake -DCMAKE_BUILD_TYPE=Debug ..
if [ ! -f "./bin/protoc" ] ; then 
    make -j$(nproc) protoc 
    cp ./dependencies/grpc/third_party/protobuf/bin/* ./bin/
fi 
if [ ! -f "./bin/grpc_cpp_plugin" ] ; then 
    make -j$(nproc) grpc_cpp_plugin 
    cp ./dependencies/grpc/bin/grpc_cpp_plugin ./bin/grpc_cpp_plugin
fi
cd ../scripts
if [ ! -d "./src/cpp/proto/hedera" ] ; then
    chmod +x unix_parse_proto.sh 
    ./unix_parse_proto.sh
fi
chmod +x compile_pot.sh
./compile_pot.sh

cd ../build 
cmake -DCMAKE_BUILD_TYPE=Debug ..
make -j$(nproc) Gradido_LoginServer PageCompiler

chmod +x ./bin/Gradido_LoginServer
