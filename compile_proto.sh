#!/bin/bash
if [ ! -d "./src/cpp/proto" ] ; then
	mkdir ./src/cpp/proto
fi
if [ ! -d "./src/cpp/proto/gradido" ] ; then
	mkdir ./src/cpp/proto/gradido
fi

protoc --cpp_out=./src/cpp/proto --proto_path=./src/proto ./src/proto/gradido/*.proto

if [ ! -d "./src/cpp/proto/hedera" ] ; then 
	mkdir ./src/cpp/proto/hedera 
fi


protoc --cpp_out=./src/cpp/proto/hedera --proto_path=./src/proto/hedera/hedera-protobuf/src/main/proto ./src/proto/hedera/hedera-protobuf/src/main/proto/*.proto

