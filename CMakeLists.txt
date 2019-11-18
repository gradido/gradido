cmake_minimum_required(VERSION 3.0)
project(Gradido_LoginServer C CXX)
SET(CMAKE_RUNTIME_OUTPUT_DIRECTORY "bin" )

add_definitions("-std=c++11")

include_directories(
	"dependencies" 
	"dependencies/tinf/src/" 
	"dependencies/iroha-ed25519/include"
	"dependencies/mariadb-connector-c/include"
	"dependencies/mariadb-connector-c/build/include"
	"dependencies/spirit-po/include"
	#"dependencies/mariadb-connector-c/build/include"
	#"dependencies/mariadb-connector-c/include"
	#"import/mariadb/include"
)



FILE(GLOB TINF "dependencies/tinf/src/*.c" "dependencies/tinf/src/*.h")
FILE(GLOB HTTPInterface "src/cpp/HTTPInterface/*.h" "src/cpp/HTTPInterface/*.cpp")
FILE(GLOB JSONInterface "src/cpp/JSONInterface/*.h" "src/cpp/JSONInterface/*.cpp")
FILE(GLOB TASKS "src/cpp/tasks/*.cpp" "src/cpp/tasks/*.h")
FILE(GLOB SINGLETON_MANAGER "src/cpp/SingletonManager/*.h" "src/cpp/SingletonManager/*.cpp")
FILE(GLOB LIB_SRC "src/cpp/lib/*.h" "src/cpp/lib/*.cpp")
FILE(GLOB MODEL "src/cpp/model/*.h" "src/cpp/model/*.cpp")
FILE(GLOB CRYPTO "src/cpp/Crypto/*.h" "src/cpp/Crypto/*.cpp")
FILE(GLOB MAIN "src/cpp/*.cpp" "src/cpp/*.c"  "src/cpp/*.h")
FILE(GLOB MYSQL "src/cpp/MySQL/*.cpp" "src/cpp/MySQL/*.h" "src/cpp/MySQL/Poco/*.h")
FILE(GLOB PROTO_GRADIDO "src/cpp/proto/gradido/*.cc" "src/cpp/proto/gradido/*.h")
# used only for test project 
FILE(GLOB TEST "src/cpp/test/*.cpp" "src/cpp/test/*.h")

SET(LOCAL_SRCS 
	${TINF} ${MAIN} ${HTTPInterface} 
	${JSONInterface} ${CRYPTO} ${MODEL} 
	${SINGLETON_MANAGER} ${LIB_SRC} ${MYSQL} ${TASKS}
	${PROTO_GRADIDO}
)
aux_source_directory("src/cpp" LOCAL_SRCS)

if(MSVC)
# src
source_group("proto" FILES ${PROTO_GRADIDO})
source_group("tinf" FILES ${TINF})
source_group("crypto" FILES ${CRYPTO})
source_group("tasks" FILES ${TASKS})
source_group("model" FILES ${MODEL})
source_group("mysql" FILES ${MYSQL})
source_group("SingletonManager" FILES ${SINGLETON_MANAGER})
source_group("lib" FILES ${LIB_SRC})
source_group("HTTP-Interface" FILES ${HTTPInterface})
source_group("Json-Interface" FILES ${JSONInterface})
source_group("Test" FILES ${TEST})
endif(MSVC)

include(${CMAKE_BINARY_DIR}/conanbuildinfo.cmake)
conan_basic_setup()

#add_subdirectory("dependencies/curl")
#add_subdirectory("dependencies/mariadb-connector-c")


add_executable(Gradido_LoginServer ${LOCAL_SRCS})
#SUBDIRS("src/test")

if(WIN32)

find_library(MYSQL_LIBRARIES mariadbclient.lib PATHS "dependencies/mariadb-connector-c/build/libmariadb/Release" REQUIRED)
#find_library(MYSQL_LIBRARIES_DEBUG  mariadbclient.lib PATHS "import/mariadb/lib/debug")
find_library(COMPILED_MARIADB_CLIENT_DEBUG mariadbclient PATHS "dependencies/mariadb-connector-c/build/libmariadb/Debug" REQUIRED)
find_library(IROHA_ED25519 ed25519 PATHS "dependencies/iroha-ed25519/build/Debug" REQUIRED)
set(MYSQL_INCLUDE_DIR "dependencies/mariadb-connector-c/include")

#set(POCO_DEBUG_PATH "I:/FremdCode/C++/poco/win64/lib/Debug")

#find_library(POCO_DEBUG_FOUNDATION PocoFoundationd PocoFoundation PATHS ${POCO_DEBUG_PATH} REQUIRED)
#find_library(POCO_DEBUG_DATA PocoDatad PocoData PATHS ${POCO_DEBUG_PATH} REQUIRED)
#find_library(POCO_DEBUG_NET PocoNetd PocoNet PATHS ${POCO_DEBUG_PATH} REQUIRED)
#find_library(POCO_DEBUG_NET_SSL PocoNetSSLd PocoNetSSL PATHS ${POCO_DEBUG_PATH} REQUIRED)
#find_library(POCO_DEBUG_UTIL PocoUtild PocoUtil PATHS ${POCO_DEBUG_PATH} REQUIRED)
#find_library(POCO_DEBUG_CRYPTO PocoCryptod PocoCrypto PATHS ${POCO_DEBUG_PATH} REQUIRED)

#set(POCO_DEBUG_LIBS ${POCO_DEBUG_FOUNDATION} ${POCO_DEBUG_UTIL} ${POCO_DEBUG_DATA} ${POCO_DEBUG_NET} ${POCO_DEBUG_NET_SSL} ${POCO_DEBUG_CRYPTO})
#include_directories(
#  "I:/FremdCode/C++/poco/Foundation/include"
#  "I:/FremdCode/C++/poco/Data/include"
#  "I:/FremdCode/C++/poco/Net/include"
  #"I:/FremdCode/C++/poco/NetSSL_Win/include"
#  "I:/FremdCode/C++/poco/NetSSL_OpenSSL/include"
#  "I:/FremdCode/C++/poco/Crypto/include"
#  "I:/FremdCode/C++/poco/Util/include"
#  "I:/FremdCode/C++/ssl/include"
#)

else(WIN32)
find_library(IROHA_ED25519 ed25519 PATHS "dependencies/iroha-ed25519/build" REQUIRED)
# set vars for mariadb cmake files 
set(INSTALL_BINDIR "bin")
set(INSTALL_PLUGINDIR "bin")
add_subdirectory("dependencies/mariadb-connector-c")


include_directories(
	"dependencies/mariadb-connector-c/include"
	"build/dependencies/mariadb-connector-c/include"
)

endif(WIN32)

target_link_libraries(Gradido_LoginServer ${CONAN_LIBS} ${IROHA_ED25519})
if(WIN32)
TARGET_LINK_LIBRARIES(Gradido_LoginServer optimized  ${MYSQL_LIBRARIES} Shlwapi)
TARGET_LINK_LIBRARIES(Gradido_LoginServer debug ${COMPILED_MARIADB_CLIENT_DEBUG} Shlwapi)
else(WIN32)
target_link_libraries(Gradido_LoginServer libmariadb PocoNet PocoUtil PocoJSON PocoFoundation PocoData PocoNetSSL protoc protobuf -pthread)
endif(WIN32)

enable_testing()

#  ----------------------    Test -----------------------------------------
#project(Gradido_LoginServer_Test C CXX)
#_TEST_BUILD


add_executable(Gradido_LoginServer_Test ${LOCAL_SRCS} ${TEST})
target_compile_definitions(Gradido_LoginServer_Test PUBLIC "_TEST_BUILD")

target_link_libraries(Gradido_LoginServer_Test ${CONAN_LIBS} ${IROHA_ED25519})
if(WIN32)
	set(MYSQL_INCLUDE_DIR "dependencies/mariadb-connector-c/include")
	TARGET_LINK_LIBRARIES(Gradido_LoginServer_Test optimized  ${MYSQL_LIBRARIES} Shlwapi)
	TARGET_LINK_LIBRARIES(Gradido_LoginServer_Test debug ${COMPILED_MARIADB_CLIENT_DEBUG} Shlwapi)
else(WIN32)
	set(INSTALL_BINDIR "bin")
	set(INSTALL_PLUGINDIR "bin")
	add_subdirectory("dependencies/mariadb-connector-c")


	include_directories(
		"dependencies/mariadb-connector-c/include"
		"build/dependencies/mariadb-connector-c/include"
	)
	
	target_link_libraries(Gradido_LoginServer_Test libmariadb PocoNet PocoUtil PocoJSON PocoFoundation PocoData PocoNetSSL protoc protobuf -pthread)
endif(WIN32)
