#!/bin/bash
cp build/conan* build_vol/
cd build_vol 

cp build/conan* build_vol/

cd build_vol 
cmake -DCMAKE_BUILD_TYPE=Debug ..

cd ..
if [ ! -d "./src/cpp/proto/hedera" ] ; then
	chmod +x unix_parse_proto.sh 
    ./unix_parse_proto.sh
fi
chmod +x compile_pot.sh
./compile_pot.sh
 
cd build_vol 
cmake .. 
make -j$(nproc) Gradido_LoginServer
#echo "building done"
chmod +x ./bin/Gradido_LoginServer
#./bin/Gradido_LoginServer


: '
cd build
conan install .. --build=missing -s build_type=Debug
cmake -DCMAKE_BUILD_TYPE=Debug ..
make -j${CPU_COUNT} protoc grpc_cpp_plugin
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
'
