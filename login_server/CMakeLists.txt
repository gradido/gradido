cmake_minimum_required(VERSION 3.18.2)
project(Gradido_LoginServer C CXX)
SET(CMAKE_RUNTIME_OUTPUT_DIRECTORY "bin" )

SET ( CMAKE_CXX_FLAGS "-std=c++17" )
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

include_directories(
	"dependencies" 
	"dependencies/tinf/src/" 
	"dependencies/mariadb-connector-c/include"
	"dependencies/mariadb-connector-c/build/include"
	"dependencies/spirit-po/include"
	"dependencies/grpc/include"
	"dependencies/grpc/third_party/protobuf/src"
	"src/cpp/proto"
)
#if(WIN32)
#include_directories("dependencies/mariadb-connector-c/include", "dependencies/mariadb-connector-c/build/include")
set(MYSQL_INCLUDE_DIR "dependencies/mariadb-connector-c/include")

#endif(WIN32)

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


include(${CMAKE_BINARY_DIR}/conanbuildinfo.cmake)
conan_basic_setup()


add_executable(Gradido_LoginServer ${LOCAL_SRCS})
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

set(GRPC_PATH "${DEP_PATH}/grpc/build")
set(GRPC_ABSL_PATH "${GRPC_PATH}/third_party/abseil-cpp/absl/types")
set(GRPC_CARES_PATH "${GRPC_PATH}/third_party/cares/cares/lib")
set(GRPC_BORING_SSL_PATH "${GRPC_PATH}/third_party/boringssl-with-bazel")
set(GRPC_RE2_PATH "${GRPC_PATH}/third_party/re2")
set(GRPC_PROTOBUF_PATH "${GRPC_PATH}/third_party/protobuf")



if(WIN32)

	find_library(MYSQL_LIBRARIES mariadbclient PATHS "${MARIADB_CONNECTOR_PATH}/Release" REQUIRED)
	find_library(COMPILED_MARIADB_CLIENT_DEBUG mariadbclient PATHS "${MARIADB_CONNECTOR_PATH}/Debug" REQUIRED)
	
	find_library(CONAN_OPENSSL_SSL ssleay32 PATHS ${CONAN_LIB_DIRS_OPENSSL} REQUIRED NO_DEFAULT_PATH )
	find_library(CONAN_OPENSSL_CRYPTO libeay32 PATHS ${CONAN_LIB_DIRS_OPENSSL} REQUIRED NO_DEFAULT_PATH ) 

	set(GRPC_PATH "${GRPC_PATH}/Debug")
	set(GRPC_ABSL_PATH "${GRPC_ABSL_PATH}/Debug")
	set(GRPC_CARES_PATH "${GRPC_CARES_PATH}/Debug")
	set(GRPC_BORING_SSL_PATH "${GRPC_CGRPC_BORING_SSL_PATHARES_PATH}/Debug")
	set(GRPC_RE2_PATH "${GRPC_RE2_PATH}/Debug")
	set(GRPC_PROTOBUF_DEBUG_PATH "${GRPC_PROTOBUF_PATH}/Debug")


	list(REMOVE_ITEM CONAN_LIBS "libeay32.lib")
	list(REMOVE_ITEM CONAN_LIBS "ssleay32.lib")


else()
	#find_package(MariaDBClient PATHS "dependencies/cmake-modules")
	#find_library(MYSQL_LIBRARIES libmariadb.so PATHS ${MARIADB_CONNECTOR_PATH} REQUIRED)
	find_library(CONAN_OPENSSL_SSL ssl PATHS ${CONAN_LIB_DIRS_OPENSSL} REQUIRED NO_DEFAULT_PATH )
	find_library(CONAN_OPENSSL_CRYPTO crypto PATHS ${CONAN_LIB_DIRS_OPENSSL} REQUIRED NO_DEFAULT_PATH )
	set(GRPC_PROTOBUF_DEBUG_PATH "${GRPC_PROTOBUF_PATH}")

	list(REMOVE_ITEM CONAN_LIBS "ssl")
	list(REMOVE_ITEM CONAN_LIBS "crypto")
	list(REMOVE_ITEM CONAN_LIBS "dl")

#	find_library(MYSQL_LIBRARIES libmariadb.so PATHS ${MARIADB_CONNECTOR_PATH} REQUIRED)
	find_library(CONAN_OPENSSL_SSL ssl PATHS ${CONAN_LIB_DIRS_OPENSSL} REQUIRED NO_DEFAULT_PATH )
	find_library(CONAN_OPENSSL_CRYPTO crypto PATHS ${CONAN_LIB_DIRS_OPENSSL} REQUIRED NO_DEFAULT_PATH ) 
	set(GRPC_PROTOBUF_DEBUG_PATH "${GRPC_PROTOBUF_PATH}")

	list(REMOVE_ITEM CONAN_LIBS "ssl")
	list(REMOVE_ITEM CONAN_LIBS "crypto")
	list(REMOVE_ITEM CONAN_LIBS "dl")

endif()

# load same ssl version like used from poco
#find_package(OpenSSL PATHS "../" NO_DEFAULT_PATH)


set(CONAN_OPENSSL_CUSTOM_LIBS 
	${CONAN_OPENSSL_SSL} 
	${CONAN_OPENSSL_CRYPTO} 
)
include_directories(${CONAN_INCLUDE_DIRS_OPENSSL})
# build grpc



if(WIN32)

	set(CMAKE_CXX_FLAGS         "/MP /EHsc")
	#set(CMAKE_CXX_FLAGS_DEBUG   "-O0 -g3")
	#set(CMAKE_CXX_FLAGS_RELEASE "-O3")

else()

	set(INSTALL_BINDIR "bin")
	set(INSTALL_PLUGINDIR "bin")
	target_link_libraries(Gradido_LoginServer ${CONAN_OPENSSL_CUSTOM_LIBS})

endif()

set(BUILD_TESTING OFF)
set(gRPC_SSL_PROVIDER "package")
add_subdirectory("dependencies/grpc/")
set(gRPC_SSL_PROVIDER "package")
message(STATUS "Using gRPC via add_subdirectory.")

set(GRPC_LIBS libprotobuf grpc++_reflection grpc++)
target_link_libraries(Gradido_LoginServer ${CONAN_LIBS})

if(WIN32)
	TARGET_LINK_LIBRARIES(Gradido_LoginServer optimized  ${MYSQL_LIBRARIES} Shlwapi)
	TARGET_LINK_LIBRARIES(Gradido_LoginServer debug ${COMPILED_MARIADB_CLIENT_DEBUG} Shlwapi)
	TARGET_LINK_LIBRARIES(Gradido_LoginServer debug ${GRPC_LIBS} ${PROTOBUF_DEBUG_LIBS})
else() # unix
	target_link_libraries(Gradido_LoginServer libmariadb ${GRPC_LIBS} ${CMAKE_DL_LIBS} ${PROTOBUF_LIBS})
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

enable_testing()

if(UNIX)
include(cmake/CodeCoverage.cmake)
append_coverage_compiler_flags()
setup_target_for_coverage_gcovr_html(
    NAME coverage
    EXECUTABLE Gradido_LoginServer_Test
    DEPENDENCIES lib/libmariadb.so.3
)

#  ----------------------    Test -----------------------------------------
#project(Gradido_LoginServer_Test C CXX)
#_TEST_BUILD
#find_package(gtest)

add_executable(Gradido_LoginServer_Test ${LOCAL_SRCS} ${LOCAL_TEST_SRC})
target_compile_definitions(Gradido_LoginServer_Test PUBLIC "_TEST_BUILD")

target_link_libraries(Gradido_LoginServer_Test ${CONAN_LIBS} )


if(WIN32)
	TARGET_LINK_LIBRARIES(Gradido_LoginServer_Test optimized  ${MYSQL_LIBRARIES} Shlwapi)
	TARGET_LINK_LIBRARIES(Gradido_LoginServer_Test debug ${COMPILED_MARIADB_CLIENT_DEBUG} Shlwapi)
	TARGET_LINK_LIBRARIES(Gradido_LoginServer_Test debug ${GRPC_LIBS} ${PROTOBUF_DEBUG_LIBS})
else()
	target_link_libraries(Gradido_LoginServer_Test libmariadb ${GRPC_LIBS} ${CMAKE_DL_LIBS} ${PROTOBUF_LIBS})
endif()

add_test(NAME main COMMAND Gradido_LoginServer_Test)
