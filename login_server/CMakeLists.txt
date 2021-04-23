cmake_minimum_required(VERSION 3.18.2)
project(Gradido_LoginServer C CXX)
SET(CMAKE_RUNTIME_OUTPUT_DIRECTORY "bin" )

SET ( CMAKE_CXX_FLAGS "-std=c++17" )
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

if(WIN32)
	set(CMAKE_CXX_FLAGS         "/MP /EHsc")
	set(CMAKE_CXX_FLAGS_DEBUG   "-O0 -g3")
	set(CMAKE_CXX_FLAGS_RELEASE "-O3")
else()
	set(INSTALL_BINDIR "bin")
	set(INSTALL_PLUGINDIR "bin")
endif()

include_directories(
	"dependencies" 
	"dependencies/tinf/src/" 
	"dependencies/mariadb-connector-c/include"
	"dependencies/mariadb-connector-c/build/include"
	"dependencies/spirit-po/include"
	"dependencies/grpc/include"
	"dependencies/grpc/third_party/protobuf/src"
	"dependencies/grpc/third_party/googletest/googletest/include"
	"dependencies/poco/Crypto/include" 
	"dependencies/poco/Data/include" 
	"dependencies/poco/Util/include" 
	"dependencies/poco/Foundation/include"
	"dependencies/poco/JSON/include"
	"dependencies/poco/Net/include"
	"dependencies/poco/NetSSL_OpenSSL/include"
	"src/cpp/proto"
)




#set(MYSQL_INCLUDE_DIR "dependencies/mariadb-connector-c/include")

FILE(GLOB CONTROLLER "src/cpp/controller/*.cpp" "src/cpp/controller/*.h")
FILE(GLOB TINF "dependencies/tinf/src/*.c" "dependencies/tinf/src/*.h")
FILE(GLOB HTTPInterface "src/cpp/HTTPInterface/*.h" "src/cpp/HTTPInterface/*.cpp")
FILE(GLOB JSONInterface "src/cpp/JSONInterface/*.h" "src/cpp/JSONInterface/*.cpp")
FILE(GLOB TASKS "src/cpp/tasks/*.cpp" "src/cpp/tasks/*.h")
FILE(GLOB SINGLETON_MANAGER "src/cpp/SingletonManager/*.h" "src/cpp/SingletonManager/*.cpp")
FILE(GLOB LIB_SRC "src/cpp/lib/*.h" "src/cpp/lib/*.cpp")
FILE(GLOB MODEL "src/cpp/model/*.h" "src/cpp/model/*.cpp")
FILE(GLOB MODEL_TABLE "src/cpp/model/table/*.h" "src/cpp/model/table/*.cpp")
FILE(GLOB MODEL_EMAIL "src/cpp/model/email/*.h" "src/cpp/model/email/*.cpp")
FILE(GLOB MODEL_HEDERA "src/cpp/model/hedera/*.h" "src/cpp/model/hedera/*.cpp")
FILE(GLOB MODEL_GRADIDO "src/cpp/model/gradido/*.h" "src/cpp/model/gradido/*.cpp")
FILE(GLOB CRYPTO "src/cpp/Crypto/*.h" "src/cpp/Crypto/*.cpp")
FILE(GLOB MAIN "src/cpp/*.cpp" "src/cpp/*.c"  "src/cpp/*.h")
FILE(GLOB MYSQL "src/cpp/MySQL/*.cpp" "src/cpp/MySQL/*.h" "src/cpp/MySQL/Poco/*.h")
FILE(GLOB PROTO_GRADIDO "src/cpp/proto/gradido/*.cc" "src/cpp/proto/gradido/*.h")
FILE(GLOB PROTO_HEDERA "src/cpp/proto/hedera/*.cc" "src/cpp/proto/hedera/*.h")

# used only for test project 
FILE(GLOB TEST "src/cpp/test/*.cpp" "src/cpp/test/*.h")
FILE(GLOB TEST_CRYPTO "src/cpp/test/crypto/*.cpp" "src/cpp/test/crypto/*.h")
FILE(GLOB TEST_MODEL "src/cpp/test/model/*.cpp" "src/cpp/test/model/*.h")
FILE(GLOB TEST_MODEL_TABLE "src/cpp/test/model/table/*.cpp" "src/cpp/test/model/table/*.h")
FILE(GLOB TEST_CONTROLLER "src/cpp/test/controller/*.cpp" "src/cpp/test/controller/*.h")

SET(LOCAL_SRCS 
	${CONTROLLER} ${TINF} ${MAIN} ${HTTPInterface} 
	${JSONInterface} ${CRYPTO}
	${MODEL} ${MODEL_TABLE} ${MODEL_EMAIL} ${MODEL_HEDERA} ${MODEL_GRADIDO}
	${SINGLETON_MANAGER} ${LIB_SRC} ${MYSQL} ${TASKS}
	${PROTO_GRADIDO} ${PROTO_HEDERA}
)
SET(LOCAL_TEST_SRC
	${TEST} ${TEST_CRYPTO} ${TEST_MODEL} ${TEST_MODEL_TABLE} ${TEST_CONTROLLER}
)
aux_source_directory("src/cpp" LOCAL_SRCS)

if(MSVC)
	# src
	source_group("controller" FILES ${CONTROLLER})
	source_group("proto\\gradido" FILES ${PROTO_GRADIDO})
	source_group("proto\\hedera" FILES ${PROTO_HEDERA})
	source_group("tinf" FILES ${TINF})
	source_group("Crypto" FILES ${CRYPTO})
	source_group("tasks" FILES ${TASKS})
	source_group("model\\table" FILES ${MODEL_TABLE})
	source_group("model\\email" FILES ${MODEL_EMAIL})
	source_group("model\\hedera" FILES ${MODEL_HEDERA})
	source_group("model\\gradido" FILES ${MODEL_GRADIDO})
	source_group("model" FILES ${MODEL})
	source_group("mysql" FILES ${MYSQL})
	source_group("SingletonManager" FILES ${SINGLETON_MANAGER})
	source_group("lib" FILES ${LIB_SRC})
	source_group("HTTP-Interface" FILES ${HTTPInterface})
	source_group("Json-Interface" FILES ${JSONInterface})
	source_group("Test\\crypto" FILES ${TEST_CRYPTO})
	source_group("Test\\model\\table" FILES ${TEST_MODEL_TABLE})
	source_group("Test\\model" FILES ${TEST_MODEL})
	source_group("Test\\controller" FILES ${TEST_CONTROLLER})
	source_group("Test" FILES ${TEST})
endif()

add_executable(Gradido_LoginServer ${LOCAL_SRCS})

############################## config and add mariadb ###################################
set(CLIENT_PLUGIN_DIALOG OFF)
set(CLIENT_PLUGIN_MYSQL_CLEAR_PASSWORD OFF)
set(CLIENT_PLUGIN_REMOTE_IO OFF)
IF(WIN32)
#set(CLIENT_PLUGIN_caching_sha2_password OFF)
set(CLIENT_PLUGIN_CACHING_SHA2_PASSWORD OFF)
set(CLIENT_PLUGIN_SHA256_PASSWORD OFF)
set(CLIENT_PLUGIN_AUTH_GSSAPI_CLIENT OFF)
set(CLIENT_PLUGIN_PVIO_NPIPE STATIC)
set(CLIENT_PLUGIN_PVIO_SHMEM STATIC)
set(CLIENT_PLUGIN_CLIENT_ED25519 OFF)
ELSEIF()
set(CLIENT_PLUGIN_client_ed25519 OFF)
ENDIF()

set(WITH_SSL OFF)
add_subdirectory("dependencies/mariadb-connector-c")

set(DEP_PATH "dependencies")
set(MARIADB_CONNECTOR_PATH "${DEP_PATH}/mariadb-connector-c/build/libmariadb")

if(WIN32)
	find_library(MYSQL_LIBRARIES mariadbclient PATHS "${MARIADB_CONNECTOR_PATH}/Release" REQUIRED)
	find_library(COMPILED_MARIADB_CLIENT_DEBUG mariadbclient PATHS "${MARIADB_CONNECTOR_PATH}/Debug" REQUIRED)
endif()

############################## config and add poco ###################################
add_subdirectory("dependencies/poco")
set(ENABLE_MONGODB OFF)
set(ENABLE_DATA_SQLITE OFF)
set(ENABLE_REDIS OFF)

set(POCO_LIBS PocoFoundation PocoUtil PocoNet PocoNetSSL PocoData)

############################## config and add grpc ###################################

set(GRPC_PATH "${DEP_PATH}/grpc/build")
set(GRPC_ABSL_PATH "${GRPC_PATH}/third_party/abseil-cpp/absl/types")
set(GRPC_CARES_PATH "${GRPC_PATH}/third_party/cares/cares/lib")
set(GRPC_BORING_SSL_PATH "${GRPC_PATH}/third_party/boringssl-with-bazel")
set(GRPC_RE2_PATH "${GRPC_PATH}/third_party/re2")
set(GRPC_PROTOBUF_PATH "${GRPC_PATH}/third_party/protobuf")

if(WIN32)
	set(GRPC_PATH "${GRPC_PATH}/Debug")
	set(GRPC_ABSL_PATH "${GRPC_ABSL_PATH}/Debug")
	set(GRPC_CARES_PATH "${GRPC_CARES_PATH}/Debug")
	set(GRPC_BORING_SSL_PATH "${GRPC_CGRPC_BORING_SSL_PATHARES_PATH}/Debug")
	set(GRPC_RE2_PATH "${GRPC_RE2_PATH}/Debug")
	set(GRPC_PROTOBUF_DEBUG_PATH "${GRPC_PROTOBUF_PATH}/Debug")
endif()



set(BUILD_TESTING OFF)
set(gRPC_SSL_PROVIDER "package")
add_subdirectory("dependencies/grpc/")
set(gRPC_SSL_PROVIDER "package")
message(STATUS "Using gRPC via add_subdirectory.")

set(GRPC_LIBS libprotobuf grpc++_reflection grpc++)

############################## build login server ###################################
if(UNIX)
	set(INSTALL_BINDIR "bin")
	set(INSTALL_PLUGINDIR "bin")
endif()
target_link_libraries(Gradido_LoginServer ${GRPC_LIBS} ${POCO_LIBS} sodium)

if(WIN32)
	TARGET_LINK_LIBRARIES(Gradido_LoginServer optimized  ${MYSQL_LIBRARIES} Shlwapi)
	TARGET_LINK_LIBRARIES(Gradido_LoginServer debug ${COMPILED_MARIADB_CLIENT_DEBUG} Shlwapi)
else() # unix
	target_link_libraries(Gradido_LoginServer libmariadb)
endif()

# install 
if(UNIX)
install(TARGETS Gradido_LoginServer RUNTIME DESTINATION /usr/local/bin)
#install(LIBRARYS DESTINATION /usr/local/lib)
#install(FILES lib/libmariadb /usr/local/lib)
install(FILES DESTINATION lib COMPONENT libmariadb)
install(DIRECTORY src/LOCALE DESTINATION /etc/grd_login/
        FILES_MATCHING PATTERN "*.po(t)")


endif(UNIX)



#  ----------------------    Test -----------------------------------------
add_subdirectory("dependencies/grpc/third_party/googletest")
enable_testing()
#project(Gradido_LoginServer_Test C CXX)
#_TEST_BUILD


add_executable(Gradido_LoginServer_Test ${LOCAL_SRCS} ${LOCAL_TEST_SRC})
target_compile_definitions(Gradido_LoginServer_Test PUBLIC "_TEST_BUILD")

target_link_libraries(Gradido_LoginServer_Test ${POCO_LIBS} ${GRPC_LIBS} sodium gtest)


if(WIN32)
	TARGET_LINK_LIBRARIES(Gradido_LoginServer_Test optimized  ${MYSQL_LIBRARIES} Shlwapi)
	TARGET_LINK_LIBRARIES(Gradido_LoginServer_Test debug ${COMPILED_MARIADB_CLIENT_DEBUG} ${PROTOBUF_DEBUG_LIBS} Shlwapi)
else()
	target_link_libraries(Gradido_LoginServer_Test libmariadb ${CMAKE_DL_LIBS} ${PROTOBUF_LIBS})
endif()

add_test(NAME main COMMAND Gradido_LoginServer_Test)
