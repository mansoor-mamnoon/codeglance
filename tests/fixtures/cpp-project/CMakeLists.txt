cmake_minimum_required(VERSION 3.28)
project(myapp VERSION 1.0.0 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_EXPORT_COMPILE_COMMANDS ON)

# Enable address sanitizer in debug builds
option(ENABLE_ASAN "Enable AddressSanitizer" OFF)
if(ENABLE_ASAN)
    add_compile_options(-fsanitize=address -fno-omit-frame-pointer)
    add_link_options(-fsanitize=address)
endif()

# Main library
add_library(myapp_lib STATIC
    src/app.cpp
    src/config.cpp
)
target_include_directories(myapp_lib PUBLIC include)

# Executable
add_executable(myapp src/main.cpp)
target_link_libraries(myapp PRIVATE myapp_lib)

# Tests (requires GoogleTest)
find_package(GTest QUIET)
if(GTest_FOUND)
    enable_testing()
    add_executable(myapp_tests tests/test_app.cpp)
    target_link_libraries(myapp_tests PRIVATE myapp_lib GTest::gtest_main)
    include(GoogleTest)
    gtest_discover_tests(myapp_tests)
endif()

# Install
install(TARGETS myapp DESTINATION bin)
