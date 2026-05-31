#pragma once

#include <string>

struct Config {
    std::string input_path;
    std::string output_path;
    bool verbose = false;

    void parse_args(int argc, char* argv[]);
};
