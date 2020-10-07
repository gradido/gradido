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
	#"dependencies/grpc/third_party/boringssl-with-bazel/src/include"
	"src/cpp/proto"
)

set(MYSQL_INCLUDE_DIR "dependencies/mariadb-connector-c/include")



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
	${JSONInterface} ${CRYPTO} ${MODEL} ${MODEL_TABLE} ${MODEL_EMAIL} ${MODEL_HEDERA}
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
endif(MSVC)


include(${CMAKE_BINARY_DIR}/conanbuildinfo.cmake)
conan_basic_setup()


add_executable(Gradido_LoginServer ${LOCAL_SRCS})


set(DEP_PATH "dependencies")
set(MARIADB_CONNECTOR_PATH "${DEP_PATH}/mariadb-connector-c/build/libmariadb")
set(GRPC_PATH "${DEP_PATH}/grpc/build")
set(GRPC_ABSL_PATH "${GRPC_PATH}/third_party/abseil-cpp/absl/types")
set(GRPC_CARES_PATH "${GRPC_PATH}/third_party/cares/cares/lib")
set(GRPC_BORING_SSL_PATH "${GRPC_PATH}/third_party/boringssl-with-bazel")
set(GRPC_RE2_PATH "${GRPC_PATH}/third_party/re2")
set(GRPC_PROTOBUF_PATH "${GRPC_PATH}/third_party/protobuf")

if(WIN32)

	find_library(MYSQL_LIBRARIES mariadbclient.lib PATHS "${MARIADB_CONNECTOR_PATH}/Release" REQUIRED)
	find_library(COMPILED_MARIADB_CLIENT_DEBUG mariadbclient PATHS "${MARIADB_CONNECTOR_PATH}/Debug" REQUIRED)

	set(GRPC_PATH "${GRPC_PATH}/Debug")
	set(GRPC_ABSL_PATH "${GRPC_ABSL_PATH}/Debug")
	set(GRPC_CARES_PATH "${GRPC_CARES_PATH}/Debug")
	set(GRPC_BORING_SSL_PATH "${GRPC_CGRPC_BORING_SSL_PATHARES_PATH}/Debug")
	set(GRPC_RE2_PATH "${GRPC_RE2_PATH}/Debug")
	set(GRPC_PROTOBUF_DEBUG_PATH "${GRPC_PROTOBUF_PATH}/Debug")

	find_library(PROTOBUF_LIB_DEBUG libprotobufd PATHS ${GRPC_PROTOBUF_DEBUG_PATH} REQUIRED)
	find_library(PROTOBUF_LIB_LITE_DEBUG libprotobuf-lited PATHS ${GRPC_PROTOBUF_DEBUG_PATH} REQUIRED)
	find_library(PROTOBUF_LIBC_DEBUG libprotocd PATHS ${GRPC_PROTOBUF_DEBUG_PATH} REQUIRED)

	set(PROTOBUF_DEBUG_LIBS 
		${PROTOBUF_LIB_DEBUG}
		${PROTOBUF_LIB_LITE_DEBUG}
		${PROTOBUF_LIBC_DEBUG}
	)

	list(REMOVE_ITEM CONAN_LIBS "libeay32.lib")
	list(REMOVE_ITEM CONAN_LIBS "ssleay32.lib")


else (WIN32)
#	message(STATUS ${MARIADB_CONNECTOR_PATH})
	find_library(MYSQL_LIBRARIES libmariadb.so PATHS ${MARIADB_CONNECTOR_PATH} REQUIRED)
	set(GRPC_PROTOBUF_DEBUG_PATH "${GRPC_PROTOBUF_PATH}")

	list(REMOVE_ITEM CONAN_LIBS "ssl")
	list(REMOVE_ITEM CONAN_LIBS "crypto")
	list(REMOVE_ITEM CONAN_LIBS "dl")

endif(WIN32)

# grpc libs
find_library(GRPC_PLUSPLUS grpc++ PATHS ${GRPC_PATH} REQUIRED)
find_library(GRPC_UNSECURE grpc++_unsecure PATHS ${GRPC_PATH} REQUIRED)
find_library(GRPC_REFLECTION grpc++_reflection PATHS ${GRPC_PATH} REQUIRED)
find_library(GRPC_LIB grpc PATHS ${GRPC_PATH} REQUIRED)
find_library(GRPC_LIB_UNSECURE grpc_unsecure PATHS ${GRPC_PATH} REQUIRED)
find_library(GRPC_ERROR_DETAILS grpc++_error_details PATHS ${GRPC_PATH} REQUIRED)
find_library(GRPC_RLIB gpr PATHS ${GRPC_PATH} REQUIRED)
find_library(GRPC_UPB upb PATHS ${GRPC_PATH} REQUIRED)
find_library(GRPC_ALTS grpc++_alts PATHS ${GRPC_PATH} REQUIRED)
find_library(GRPC_ADDRESS_SORTING address_sorting PATHS ${GRPC_PATH} REQUIRED)
# grpc third party libs
find_library(GRPC_CARES cares PATHS ${GRPC_CARES_PATH} REQUIRED)
#find_library(GRPC_BORING_SSL_CRYPTO crypto PATHS ${GRPC_BORING_SSL_PATH} REQUIRED)
#find_library(GRPC_BORING_SSL_SSL ssl PATHS ${GRPC_BORING_SSL_PATH} REQUIRED)
find_library(GRPC_RE2 re2 PATHS ${GRPC_RE2_PATH} REQUIRED)

find_library(PROTOBUF_LIB libprotobuf.a PATHS ${GRPC_PROTOBUF_PATH} REQUIRED)
find_library(PROTOBUF_LIB_LITE libprotobuf-lite.a PATHS ${GRPC_PROTOBUF_PATH} REQUIRED)
find_library(PROTOBUF_LIBC libprotoc.a PATHS ${GRPC_PROTOBUF_PATH} REQUIRED)

find_library(GRPC_ABSL_BAD_OPTIONAL_ACCESS absl_bad_optional_access PATHS ${GRPC_ABSL_PATH} REQUIRED)

# load same ssl version like used from poco
find_library(CONAN_OPENSSL_SSL ssl PATHS ${CONAN_LIB_DIRS_OPENSSL} REQUIRED NO_DEFAULT_PATH )
find_library(CONAN_OPENSSL_CRYPTO crypto PATHS ${CONAN_LIB_DIRS_OPENSSL} REQUIRED NO_DEFAULT_PATH ) 
#find_library(CONAN_OPENSSL_DL dl PATHS ${CONAN_LIB_DIRS_OPENSSL} REQUIRED NO_DEFAULT_PATH )
#find_library(CONAN_OPENSSL_PTHREAD pthread PATHS ${CONAN_LIB_DIRS_OPENSSL} REQUIRED NO_DEFAULT_PATH )

set(CONAN_OPENSSL_CUSTOM_LIBS 
	${CONAN_OPENSSL_SSL} 
	${CONAN_OPENSSL_CRYPTO} 
	#${CONAN_OPENSSL_DL} 
#	${CONAN_OPENSSL_PTHREAD}
	)
#foreach(i ${CONAN_LIBS_OPENSSL})
#	find_library(_LIB_${i} ${i} PATHS ${CONAN_LIB_DIRS_OPENSSL} NO_DEFAULT_PATH)
	#set(CONAN_POCO_OPENSSL_LIBS ${CONAN_POCO_OPENSSL_LIBS} ${_LIB_${i}})
#endforeach(i)

#${CONAN_LIB_DIRS_OPENSSL}
#${CONAN_LIBS_OPENSSL}
#find_library(CONAN_POCO_OPENSSL_LIBS NAMES ${CONAN_LIBS_OPENSSL} PATHS ${CONAN_LIB_DIRS_OPENSSL} NO_DEFAULT_PATH)

set(GRPC_LIBS 
	${GRPC_PLUSPLUS} 
        ${GRPC_REFLECTION} ${GRPC_UNSECURE} ${GRPC_LIB} 
	${GRPC_ERROR_DETAILS} ${GRPC_RLIB} ${GRPC_UPB} ${GRPC_ALTS}
	${GRPC_ABSL_BAD_OPTIONAL_ACCESS} ${GRPC_ADDRESS_SORTING}
	${GRPC_CARES} 
#	${GRPC_BORING_SSL_CRYPTO} 
#	${GRPC_BORING_SSL_SSL}
	${GRPC_RE2}
)

set(PROTOBUF_LIBS 
	${PROTOBUF_LIB}
	${PROTOBUF_LIB_LITE}
	${PROTOBUF_LIBC}
)


if(WIN32)


	set(CMAKE_CXX_FLAGS         "/MP /EHsc")
	#set(CMAKE_CXX_FLAGS_DEBUG   "-O0 -g3")
	#set(CMAKE_CXX_FLAGS_RELEASE "-O3")

else(WIN32)

	#find_package(OpenSSL REQUIRED)
	#find_package(PROTOBUF PATHS "dependencies/grpc/build/third_party/protobuf" REQUIRED)
	#set(gRPC_SSL_PROVIDER "module")
	#find_package(gRPC PATHS "dependencies/grpc/build" REQUIRED)
	find_package(Threads REQUIRED)
	set(CMAKE_MODULE_PATH ${CMAKE_BINARY_DIR})

	#find_package(Poco REQUIRED)
	#find_package(libsodium REQUIRED)
	#find_package(gtest REQUIRED)
	#find_library(IROHA_ED25519 ed25519 PATHS "dependencies/iroha-ed25519/build" REQUIRED)
	# set vars for mariadb cmake files 
	set(INSTALL_BINDIR "bin")
	set(INSTALL_PLUGINDIR "bin")
#	OPTION(WITH_SSL "" OFF)
#	add_subdirectory("dependencies/mariadb-connector-c")


	include_directories(
	#	"dependencies/mariadb-connector-c/include"
#		"build/dependencies/mariadb-connector-c/include"
		#${OpenSSL_INCLUDE_DIR}
		#${Poco_INCLUDE_DIR}
	 	#${libsodium_INCLUDE_DIR}
		#${gtest_INCLUDE_DIR}    
	)



endif(WIN32)

add_subdirectory("dependencies/grpc/third_party/abseil-cpp")


if(WIN32)
	TARGET_LINK_LIBRARIES(Gradido_LoginServer optimized  ${MYSQL_LIBRARIES} Shlwapi)
	TARGET_LINK_LIBRARIES(Gradido_LoginServer debug ${COMPILED_MARIADB_CLIENT_DEBUG} Shlwapi)
	TARGET_LINK_LIBRARIES(Gradido_LoginServer debug ${GRPC_LIBS} ${PROTOBUF_DEBUG_LIBS})
else(WIN32) # unix
#	target_link_libraries(Gradido_LoginServer gRPC::grpc++)
#	target_link_libraries(Gradido_LoginServer )
	target_link_libraries(Gradido_LoginServer ${MYSQL_LIBRARIES} ${CONAN_OPENSSL_CUSTOM_LIBS} ${GRPC_LIBS}  ${CMAKE_DL_LIBS} ${PROTOBUF_LIBS})# ${GRPC_LIBS} protoc protobuf pthread)
	#target_link_libraries(Gradido_LoginServer ${OpenSSL_LIBS} ${Poco_LIBS} ${libsodium_LIBS} )

endif(WIN32)
message(STATUS "link libraries:" )
get_target_property(OUT Gradido_LoginServer LINK_LIBRARIES)
foreach(i ${OUT})
message(STATUS ${i})
endforeach(i)
message(STATUS "grpc libs: ")
foreach(i ${GRPC_LIBS})
message(STATUS ${i})
endforeach(i)
message(STATUS "boring ssl:")
message(STATUS ${GRPC_BORING_SSL_SSL})
message(STATUS ${GRPC_BORING_SSL_CRYPTO})
message(STATUS "Conan OpenSSL")
message(STATUS ${CONAN_POCO_OPENSSL_LIBS})

# install 
if(UNIX)
install(TARGETS Gradido_LoginServer RUNTIME DESTINATION /usr/local/bin)
#install(FILES lib/libmariadb /usr/local/lib)
install(FILES DESTINATION lib COMPONENT libmariadb)
install(DIRECTORY src/LOCALE DESTINATION /etc/grd_login/
        FILES_MATCHING PATTERN "*.po(t)")


endif(UNIX)

enable_testing()

#  ----------------------    Test -----------------------------------------
#project(Gradido_LoginServer_Test C CXX)
#_TEST_BUILD


add_executable(Gradido_LoginServer_Test ${LOCAL_SRCS} ${LOCAL_TEST_SRC})
target_compile_definitions(Gradido_LoginServer_Test PUBLIC "_TEST_BUILD")

target_link_libraries(Gradido_LoginServer_Test absl::base absl::flat_hash_map absl::flags absl::memory absl::meta absl::numeric absl::strings ${CONAN_LIBS} )

if(WIN32)
	TARGET_LINK_LIBRARIES(Gradido_LoginServer_Test optimized  ${MYSQL_LIBRARIES} Shlwapi)
	TARGET_LINK_LIBRARIES(Gradido_LoginServer_Test debug ${COMPILED_MARIADB_CLIENT_DEBUG} Shlwapi)
	TARGET_LINK_LIBRARIES(Gradido_LoginServer_Test debug ${GRPC_LIBS} ${PROTOBUF_DEBUG_LIBS})
else(WIN32)
	target_link_libraries(Gradido_LoginServer_Test libmariadb protoc protobuf pthread)
endif(WIN32)

add_test(NAME main COMMAND Gradido_LoginServer_Test)