#!/bin/bash
if [ ! -d "./src/cpp/proto" ] ; then
	mkdir ./src/cpp/proto
fi
protoc --cpp_out=./src/cpp/proto --proto_path=./src/proto/gradido ./src/proto/gradido/*.proto
