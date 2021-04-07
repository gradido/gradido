#!/bin/bash
cp build/conan* build_vol/
cd build_vol 

cmake -DCMAKE_BUILD_TYPE=Debug ..
make -j$(nproc) Gradido_LoginServer
#echo "building done"
chmod +x ./bin/Gradido_LoginServer
#./bin/Gradido_LoginServer
