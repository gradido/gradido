cmake_minimum_required(VERSION 3.0)
project(Gradido_LoginServer C CXX)
SET(CMAKE_RUNTIME_OUTPUT_DIRECTORY "bin" )

add_definitions("-std=c++11")

include_directories(
	"dependencies" 
	"dependencies/tinf/src/" 
	"dependencies/iroha-ed25519/include"
	#"dependencies/mariadb-connector-c/build/include"
	#"dependencies/mariadb-connector-c/include"
	"import/mariadb/include"
)

FILE(GLOB TINF "dependencies/tinf/src/*.c" "dependencies/tinf/src/*.h")
FILE(GLOB HTTPInterface "src/cpp/HTTPInterface/*.h" "src/cpp/HTTPInterface/*.cpp")
FILE(GLOB TASKS "src/cpp/tasks/*.cpp" "src/cpp/tasks/*.h")
FILE(GLOB SINGLETON_MANAGER "src/cpp/SingletonManager/*.h" "src/cpp/SingletonManager/*.cpp")
FILE(GLOB MODEL "src/cpp/model/*.h" "src/cpp/model/*.cpp")
FILE(GLOB CRYPTO "src/cpp/Crypto/*.h" "src/cpp/Crypto/*.cpp")
FILE(GLOB MAIN "src/cpp/*.cpp" "src/cpp/*.c"  "src/cpp/*.h")
FILE(GLOB MYSQL "src/cpp/MySQL/*.cpp" "src/cpp/MySQL/*.h" "src/cpp/MySQL/Poco/*.h")
SET(LOCAL_SRCS ${TINF} ${MAIN} ${HTTPInterface} ${CRYPTO} ${MODEL} ${SINGLETON_MANAGER} ${MYSQL} ${TASKS})
aux_source_directory("src/cpp" LOCAL_SRCS)

if(MSVC)
# src
source_group("tinf" FILES ${TINF})
source_group("crypto" FILES ${CRYPTO})
source_group("tasks" FILES ${TASKS})
source_group("model" FILES ${MODEL})
source_group("mysql" FILES ${MYSQL})
source_group("SingletonManager" FILES ${SINGLETON_MANAGER})
source_group("HTTP-Interface" FILES ${HTTPInterface})

endif(MSVC)

include(${CMAKE_BINARY_DIR}/conanbuildinfo.cmake)
conan_basic_setup()

#add_subdirectory("dependencies/curl")
#add_subdirectory("dependencies/mariadb-connector-c")


add_executable(Gradido_LoginServer ${LOCAL_SRCS})

if(WIN32)

find_library(MYSQL_LIBRARIES mariadbclient.lib PATHS "import/mariadb/lib/release")
#find_library(MYSQL_LIBRARIES_DEBUG  mariadbclient.lib PATHS "import/mariadb/lib/debug")
find_library(MARIADB_CLIENT_DEBUG mariadbclient PATHS "dependencies/mariadb-connector-c/build/libmariadb/Debug" REQUIRED)
find_library(IROHA_ED25519 ed25519 PATHS "dependencies/iroha-ed25519/build/Debug" REQUIRED)
set(MYSQL_INCLUDE_DIR "import/mariadb/include")

else(WIN32)

add_subdirectory("dependencies/mariadb-connector-c")

endif(WIN32)


target_link_libraries(Gradido_LoginServer ${CONAN_LIBS} ${IROHA_ED25519} ${MARIADB_CLIENT})
if(WIN32)
TARGET_LINK_LIBRARIES(Gradido_LoginServer optimized  ${MYSQL_LIBRARIES} Shlwapi)
TARGET_LINK_LIBRARIES(Gradido_LoginServer debug ${MARIADB_CLIENT_DEBUG} Shlwapi)
else(WIN32)
endif(WIN32)