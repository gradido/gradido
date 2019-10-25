#!/bin/bash
if [ ! -d "./src/cpp/proto" ] ; then
	mkdir ./src/cpp/proto
fi
if [ ! -d "./src/cpp/proto/gradido" ] ; then
	mkdir ./src/cpp/proto/gradido
fi

protoc --cpp_out=./src/cpp/proto/gradido --proto_path=./src/proto/gradido ./src/proto/gradido/*.proto
