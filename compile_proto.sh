#!/bin/bash
mkdir ./src/cpp/proto
protoc --cpp_out=./src/cpp/proto --proto_path=./src/proto/gradido ./src/proto/gradido/*.proto
