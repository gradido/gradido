#!/bin/sh

cd ../scripts

chmod +x compile_pot.sh
./compile_pot.sh

cd ../build 
cmake -DCMAKE_BUILD_TYPE=Debug ..
make -j$(nproc) Gradido_LoginServer

chmod +x ./bin/Gradido_LoginServer
