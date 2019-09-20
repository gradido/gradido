cmake_minimum_required(VERSION 3.0)
project(Gradido_LoginServer C CXX)
SET(CMAKE_RUNTIME_OUTPUT_DIRECTORY "bin" )

add_definitions("-std=c++11")

include_directories(
	"dependencies" 
	"dependencies/tinf/src/" 
	"dependencies/iroha-ed25519/include"
)

FILE(GLOB TINF "dependencies/tinf/src/*.c" "dependencies/tinf/src/*.h")
SET(LOCAL_SRCS ${TINF})
aux_source_directory("src/cpp" LOCAL_SRCS)

if(MSVC)
# src
source_group("tinf" FILES ${TINF})

endif(MSVC)

include(${CMAKE_BINARY_DIR}/conanbuildinfo.cmake)
conan_basic_setup()



add_executable(Gradido_LoginServer ${LOCAL_SRCS})

if(WIN32)

find_library(IROHA_ED25519 ed25519 PATHS "dependencies/iroha-ed25519/build/Debug" REQUIRED)

else(WIN32)

endif(WIN32)

target_link_libraries(Gradido_LoginServer ${CONAN_LIBS} ${IROHA_ED25519})