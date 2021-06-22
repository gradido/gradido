#!/bin/bash

# stop login_server running in screen
screen -XS login quit

# rebuild login-server
cd ../../login_server
if [ ! -d "./build" ] ; then
  cd scripts
  ./prepare_build.sh
  cd ..
fi
cd build
cmake ..
make -j$(nproc) Gradido_LoginServer

# rebuild locales
cd ../scripts
./compile_pot.sh
cd ../src/LOCALE
cp *.mo *.po /etc/grd_login/LOCALE/

cd ../../build/bin

# start login-server
screen -dmS 'login_server' bash -c './Gradido_LoginServer'



