cmake_minimum_required(VERSION 3.18.2)
Project(iotaWrapper C CXX)


include_directories(
    "dependencies/iota.c/src"
    "src"
)

SET(SRC "src/iotaWrapper.cpp" "src/iotaWrapper.h")
add_library(iotaWrapper SHARED ${SRC})
set_target_properties(iotaWrapper PROPERTIES LIBRARY_OUTPUT_DIRECTORY ${PROJECT_BINARY_DIR}/../lib)

OPTION(ENABLE_HIDDEN_SYMBOLS On)
add_subdirectory("dependencies/iota.c")
target_link_libraries(iotaWrapper PRIVATE iota_client)