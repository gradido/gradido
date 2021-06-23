#!/bin/bash
if [ ! -d "../src/cpp/proto" ] ; then
	mkdir ../src/cpp/proto
fi
if [ ! -d "../src/cpp/proto/gradido" ] ; then
	mkdir ../src/cpp/proto/gradido
fi
PROTOC_PATH=../build/dependencies/protobuf/cmake/bin/Debug

$PROTOC_PATH/protoc.exe --cpp_out=../build/proto/gradido --proto_path=../src/proto ../src/proto/gradido/*.proto



