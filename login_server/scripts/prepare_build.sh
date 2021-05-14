#!/bin/sh

# generate version for mariadb connector

cd ../dependencies/mariadb-connector-c
if [ -d "./build" ] ; then
  rm -rf ./build
fi
mkdir build 
cd build
cmake -DWITH_SSL=OFF ..
cd ../../



