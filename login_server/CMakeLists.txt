cmake_minimum_required(VERSION 3.18.2)
project(Gradido_LoginServer C CXX)
SET(CMAKE_RUNTIME_OUTPUT_DIRECTORY "bin" )

SET(CMAKE_CXX_FLAGS "-std=c++17" )
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

IF(WIN32)
	set(CMAKE_CXX_FLAGS         "/MP /EHsc")
ENDIF()

set(INSTALL_BINDIR "bin")
set(INSTALL_PLUGINDIR "bin")

include_directories(
	"dependencies" 
	"dependencies/tinf/src/" 
	"dependencies/mariadb-connector-c/include"
	"dependencies/mariadb-connector-c/build/include"
	"dependencies/spirit-po/include"
	"dependencies/protobuf/src"
	"build"
	"build/proto"
	"build/http_pages"
	"src/cpp"
)

IF(UNIX)
	include_directories(
		"dependencies/poco/Crypto/include" 
		"dependencies/poco/Data/include" 
		"dependencies/poco/Util/include" 
		"dependencies/poco/Foundation/include"
		"dependencies/poco/JSON/include"
		"dependencies/poco/Net/include"
		"dependencies/poco/NetSSL_OpenSSL/include"
	)
ENDIF()

############################## find protobuf  #########################################
add_subdirectory(dependencies/protobuf/cmake)

############################## parse protobuf files ###################################

FILE(TO_NATIVE_PATH ${CMAKE_CURRENT_SOURCE_DIR}/src/proto GRADIDO_PROTO_MODEL_PATH)
FILE(TO_NATIVE_PATH ${CMAKE_CURRENT_SOURCE_DIR}/build/proto PROTOBINDING_PATH)
file(MAKE_DIRECTORY ${PROTOBINDING_PATH})
file(MAKE_DIRECTORY ${PROTOBINDING_PATH}/gradido)

FILE(GLOB DATAMODEL_GRADIDO_PROTOS "${GRADIDO_PROTO_MODEL_PATH}/gradido/*.proto")

IF(WIN32)
	set(PROTOC_BIN_PATH "build/dependencies/protobuf/cmake/bin")
	find_program(PROTOBUF_PROTOC_EXECUTABLE protoc PATHS "${PROTOC_BIN_PATH}/Debug" )
	find_program(PROTOBUF_PROTOC_EXECUTABLE protoc PATHS "${PROTOC_BIN_PATH}/Release" )
ELSE()
	find_program(PROTOBUF_PROTOC_EXECUTABLE protoc PATHS "build/dependencies/protobuf/cmake/bin" )
ENDIF()
FILE(TO_NATIVE_PATH ${CMAKE_CURRENT_SOURCE_DIR}/dependencies/protobuf/src GOOGLE_PROTOBUF_INCLUDES)
MESSAGE("protoc: ${PROTOBUF_PROTOC_EXECUTABLE} in build/dependencies/protobuf/bin/${CMAKE_BUILD_TYPE}")
FOREACH(proto ${DATAMODEL_GRADIDO_PROTOS})
   FILE(TO_NATIVE_PATH ${proto} proto_native)
   get_filename_component(proto_parsed ${proto} NAME_WLE)
   FILE(TO_NATIVE_PATH ${PROTOBINDING_PATH}/gradido/${proto_parsed}.pb.h proto_parsed_native)
   
   IF(${proto_native} IS_NEWER_THAN ${proto_parsed_native})
		EXECUTE_PROCESS(
			COMMAND 
			${PROTOBUF_PROTOC_EXECUTABLE} 
			--proto_path=${GRADIDO_PROTO_MODEL_PATH} 
			--cpp_out=${PROTOBINDING_PATH} 
			${proto_native}
			RESULT_VARIABLE rv
		)
		# Optional, but that can show the user if something have gone wrong with the proto generation 
		IF(${rv})
			MESSAGE("Generation of data model returned ${rv} for proto ${proto_native}")
		ELSE()
			MESSAGE("Parsed: src/proto/gradido/${proto_parsed}.proto")
		ENDIF()
   ENDIF()

ENDFOREACH(proto)


############################## parse cpsp Files ####################################

IF(WIN32)
	include(${CMAKE_BINARY_DIR}/conanbuildinfo.cmake)
	conan_basic_setup()
	#add_compile_definitions(POCO_NETSSL_WIN)
ENDIF()

FILE(TO_NATIVE_PATH ${CMAKE_CURRENT_SOURCE_DIR}/src/cpsp GRADIDO_CPSP_PAGE_SRC_PATH)
FILE(TO_NATIVE_PATH ${CMAKE_CURRENT_SOURCE_DIR}/build/http_pages GRADIDO_HTTP_PAGES_PATH)
file(MAKE_DIRECTORY ${GRADIDO_HTTP_PAGES_PATH})

FILE(GLOB GRADIDO_HTTP_PAGES_SRC "${GRADIDO_CPSP_PAGE_SRC_PATH}/*.cpsp")
IF(WIN32)
	string(REGEX REPLACE "(.*)package/([a-f0-9]*)" "\\1build/\\2/build/bin" POCO_BUILD_BIN "${CONAN_POCO_ROOT}")
    find_program(POCO_PAGE_COMPILER cpspc.exe PATHS "${CONAN_POCO_ROOT}")
	find_program(POCO_PAGE_COMPILER cpspc.exe PATHS "${POCO_BUILD_BIN}")
ELSE()
	find_program(POCO_PAGE_COMPILER cpspc PATHS "${CMAKE_CURRENT_SOURCE_DIR}/build/bin")
ENDIF()

MESSAGE("Poco Page Compiler: ${POCO_PAGE_COMPILER}")

FOREACH(cpsp_file ${GRADIDO_HTTP_PAGES_SRC})
   FILE(TO_NATIVE_PATH ${cpsp_file} cpsp_file_native)
   get_filename_component(cpsp_file_parsed ${cpsp_file} NAME_WLE)
   
   FILE(TO_NATIVE_PATH ${GRADIDO_HTTP_PAGES_PATH}/${cpsp_file_parsed}Page.cpp cpsp_file_parsed_native)
   
   IF(${cpsp_file_native} IS_NEWER_THAN ${cpsp_file_parsed_native})
		IF(WIN32) 
			EXECUTE_PROCESS(
				COMMAND 
				${POCO_PAGE_COMPILER} 
				/output-dir=${GRADIDO_HTTP_PAGES_PATH}
				/header-output-dir=${GRADIDO_HTTP_PAGES_PATH}
				/noline
				${cpsp_file_native}
				RESULT_VARIABLE rv
			)
		ELSE()
			EXECUTE_PROCESS(
				COMMAND 
				${POCO_PAGE_COMPILER} 
				--output-dir=${GRADIDO_HTTP_PAGES_PATH}
				--header-output-dir=${GRADIDO_HTTP_PAGES_PATH}
				--noline
				${cpsp_file_native}
				RESULT_VARIABLE rv
			)
		ENDIF()
		# Optional, but that can show the user if something have gone wrong with the proto generation 
		IF(${rv})
			MESSAGE("Generation of HTTP Page return ${rv} for cpsp ${cpsp_file_native}")
		ELSE()
			MESSAGE("Parsed: src/cpsp/${cpsp_file_parsed}.cpsp")
		ENDIF()
   ENDIF()

ENDFOREACH(cpsp_file)

############################## bind source files ###################################

FILE(GLOB CONTROLLER "src/cpp/controller/*.cpp" "src/cpp/controller/*.h")
FILE(GLOB TINF "dependencies/tinf/src/*.c" "dependencies/tinf/src/*.h")
FILE(GLOB HTTPInterface "src/cpp/HTTPInterface/*.h" "src/cpp/HTTPInterface/*.cpp")
FILE(GLOB COMPILED_PAGES "build/http_pages/*.h" "build/http_pages/*.cpp")
FILE(GLOB JSONInterface "src/cpp/JSONInterface/*.h" "src/cpp/JSONInterface/*.cpp")
FILE(GLOB TASKS "src/cpp/tasks/*.cpp" "src/cpp/tasks/*.h")
FILE(GLOB SINGLETON_MANAGER "src/cpp/SingletonManager/*.h" "src/cpp/SingletonManager/*.cpp")
FILE(GLOB LIB_SRC "src/cpp/lib/*.h" "src/cpp/lib/*.cpp")
FILE(GLOB MODEL "src/cpp/model/*.h" "src/cpp/model/*.cpp")
FILE(GLOB MODEL_TABLE "src/cpp/model/table/*.h" "src/cpp/model/table/*.cpp")
FILE(GLOB MODEL_EMAIL "src/cpp/model/email/*.h" "src/cpp/model/email/*.cpp")
FILE(GLOB MODEL_GRADIDO "src/cpp/model/gradido/*.h" "src/cpp/model/gradido/*.cpp")
FILE(GLOB CRYPTO "src/cpp/Crypto/*.h" "src/cpp/Crypto/*.cpp")
FILE(GLOB MAIN "src/cpp/*.cpp" "src/cpp/*.c"  "src/cpp/*.h")
FILE(GLOB MYSQL "src/cpp/MySQL/*.cpp" "src/cpp/MySQL/*.h" "src/cpp/MySQL/Poco/*.h")
FILE(GLOB PROTO_GRADIDO "build/proto/gradido/*.cc" "build/proto/gradido/*.h")

# used only for test project 
FILE(GLOB TEST "src/cpp/test/*.cpp" "src/cpp/test/*.h")
FILE(GLOB TEST_CRYPTO "src/cpp/test/crypto/*.cpp" "src/cpp/test/crypto/*.h")
FILE(GLOB TEST_MODEL "src/cpp/test/model/*.cpp" "src/cpp/test/model/*.h")
FILE(GLOB TEST_MODEL_TABLE "src/cpp/test/model/table/*.cpp" "src/cpp/test/model/table/*.h")
FILE(GLOB TEST_CONTROLLER "src/cpp/test/controller/*.cpp" "src/cpp/test/controller/*.h")
FILE(GLOB TEST_JSON_INTERFACE "src/cpp/test/JSONInterface/*.cpp" "src/cpp/test/JSONInterface/*.h")

SET(LOCAL_SRCS 
	${CONTROLLER} ${TINF} ${MAIN} ${HTTPInterface} ${COMPILED_PAGES}
	${JSONInterface} ${CRYPTO}
	${MODEL} ${MODEL_TABLE} ${MODEL_EMAIL} ${MODEL_GRADIDO}
	${SINGLETON_MANAGER} ${LIB_SRC} ${MYSQL} ${TASKS}
	${PROTO_GRADIDO} 
)
SET(LOCAL_TEST_SRC
	${TEST} ${TEST_CRYPTO} ${TEST_MODEL} ${TEST_MODEL_TABLE} ${TEST_CONTROLLER} ${TEST_JSON_INTERFACE}
)
aux_source_directory("src/cpp" LOCAL_SRCS)

if(MSVC)
	# src
	source_group("controller" FILES ${CONTROLLER})
	source_group("proto\\gradido" FILES ${PROTO_GRADIDO})
	source_group("tinf" FILES ${TINF})
	source_group("Crypto" FILES ${CRYPTO})
	source_group("tasks" FILES ${TASKS})
	source_group("model\\table" FILES ${MODEL_TABLE})
	source_group("model\\email" FILES ${MODEL_EMAIL})
	source_group("model\\gradido" FILES ${MODEL_GRADIDO})
	source_group("model" FILES ${MODEL})
	source_group("mysql" FILES ${MYSQL})
	source_group("SingletonManager" FILES ${SINGLETON_MANAGER})
	source_group("lib" FILES ${LIB_SRC})
	source_group("HTTP-Interface\\pages" FILES ${COMPILED_PAGES})
	source_group("HTTP-Interface" FILES ${HTTPInterface})
	source_group("Json-Interface" FILES ${JSONInterface})
	source_group("Test\\crypto" FILES ${TEST_CRYPTO})
	source_group("Test\\model\\table" FILES ${TEST_MODEL_TABLE})
	source_group("Test\\model" FILES ${TEST_MODEL})
	source_group("Test\\controller" FILES ${TEST_CONTROLLER})
	source_group("Test\\Json-Interface" FILES ${TEST_JSON_INTERFACE})
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

#if(WIN32)
	#find_library(MYSQL_LIBRARIES mariadbclient PATHS "${MARIADB_CONNECTOR_PATH}/Release" REQUIRED)
	#find_library(COMPILED_MARIADB_CLIENT_DEBUG mariadbclient PATHS "${MARIADB_CONNECTOR_PATH}/Debug" REQUIRED)
#endif()

############################## config and add poco ###################################
#SET(SOME_EXPAT_OPTION OFF CACHE BOOL "Use some expat option")
IF(UNIX)
	SET(ENABLE_MONGODB OFF CACHE BOOL "" FORCE) 
	SET(ENABLE_DATA_SQLITE OFF CACHE BOOL "" FORCE) 
	SET(ENABLE_REDIS OFF CACHE BOOL "" FORCE)
	SET(ENABLE_PAGECOMPILER_FILE2PAGE OFF CACHE BOOL "" FORCE)
	add_subdirectory("dependencies/poco")

	set(POCO_LIBS PocoFoundation PocoUtil PocoNet PocoNetSSL PocoData)
ENDIF()


############################## build login server ###################################

target_link_libraries(Gradido_LoginServer ${GRPC_LIBS})

if(WIN32)
	target_link_libraries(Gradido_LoginServer mariadbclient libprotobuf ${CONAN_LIBS})
	#TARGET_LINK_LIBRARIES(Gradido_LoginServer optimized  ${MYSQL_LIBRARIES} Shlwapi)
	#TARGET_LINK_LIBRARIES(Gradido_LoginServer debug ${COMPILED_MARIADB_CLIENT_DEBUG} Shlwapi)
else() # unix
	target_link_libraries(Gradido_LoginServer ${POCO_LIBS} libmariadb sodium libprotobuf)
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

enable_testing()

option(COLLECT_COVERAGE_DATA "Use cov to collect coverage informations" OFF)
set(COVERAGE_TOOL "Coverage Tool (gcovr|lcov|fastcov)" CACHE STRING "gcovr")

if(COLLECT_COVERAGE_DATA)
	
	include(cmake/CodeCoverage.cmake)
	append_coverage_compiler_flags()
	set(EXCLUDE_FOR_HTML_COV 
		"${CMAKE_CURRENT_SOURCE_DIR}/build/proto/*" 
		"${CMAKE_CURRENT_SOURCE_DIR}/dependencies/*" 
		"${CMAKE_CURRENT_SOURCE_DIR}/src/cpp/test/*"
		"${CMAKE_CURRENT_SOURCE_DIR}/googletest/googletest/include/gtest/internal/*"
		"${CMAKE_CURRENT_SOURCE_DIR}/googletest/googletest/src/"
	)
	if("${COVERAGE_TOOL}" STREQUAL "gcovr")
		setup_target_for_coverage_gcovr_html(
			NAME coverage
			EXECUTABLE Gradido_LoginServer_Test
			EXCLUDE ${EXCLUDE_FOR_HTML_COV}
			GCOVR_ADDITIONAL_ARGS "--txt "
			#DEPENDENCIES lib/libmariadb.so.3
		)
	endif()

	set(EXCLUDE_FOR_COV 
		${EXCLUDE_FOR_HTML_COV}
		"/usr/include/*"
	)
	if("${COVERAGE_TOOL}" STREQUAL "lcov")
		setup_target_for_coverage_lcov(
			NAME coverage
			EXECUTABLE Gradido_LoginServer_Test
			EXCLUDE "${EXCLUDE_FOR_COV}"
			#DEPENDENCIES lib/libmariadb.so.3
		)
	endif()
	
	if("${COVERAGE_TOOL}" STREQUAL "fastcov")
		setup_target_for_coverage_fastcov(
	     NAME coverage                    # New target name
	     EXECUTABLE Gradido_LoginServer_Test -j ${PROCESSOR_COUNT} # Executable in PROJECT_BINARY_DIR
	     #BASE_DIRECTORY "../"                        # Base directory for report
	                                                 #  (defaults to PROJECT_SOURCE_DIR)
	     EXCLUDE "${EXCLUDE_FOR_COV}"                # Patterns to exclude.
	     NO_DEMANGLE                                 # Don't demangle C++ symbols
	                                                 #  even if c++filt is found
	     SKIP_HTML                                   # Don't create html report
	 )
	endif()

endif()

project(Gradido_LoginServer_Test C CXX)
#_TEST_BUILD
#find_package(GTest CONFIG REQUIRED)
#add_subdirectory("dependencies/protobuf/third_party/googletest")

add_executable(Gradido_LoginServer_Test ${LOCAL_SRCS} ${LOCAL_TEST_SRC})
target_compile_definitions(Gradido_LoginServer_Test PUBLIC "_TEST_BUILD")

target_link_libraries(Gradido_LoginServer_Test ${GRPC_LIBS} )

if(WIN32)
	target_link_libraries(Gradido_LoginServer_Test ${CONAN_LIBS} libmariadb libprotobuf)
	#TARGET_LINK_LIBRARIES(Gradido_LoginServer_Test optimized  ${MYSQL_LIBRARIES} Shlwapi)
	#TARGET_LINK_LIBRARIES(Gradido_LoginServer_Test debug ${COMPILED_MARIADB_CLIENT_DEBUG} Shlwapi)
	#TARGET_LINK_LIBRARIES(Gradido_LoginServer_Test debug ${GRPC_LIBS} ${PROTOBUF_DEBUG_LIBS})
else()
	target_link_libraries(Gradido_LoginServer_Test ${POCO_LIBS} libmariadb sodium gtest)
endif()

add_test(NAME main COMMAND Gradido_LoginServer_Test)
