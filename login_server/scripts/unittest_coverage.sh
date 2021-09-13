#!/bin/bash

cd ../build 
cmake -DCMAKE_BUILD_TYPE=Debug -DCOLLECT_COVERAGE_DATA=ON -DCOVERAGE_TOOL=gcovr .. && \
make -j$(nproc) Gradido_LoginServer_Test
make coverage


