#include "app.h"

#include <fstream>
#include <iostream>
#include <sstream>
#include <filesystem>

namespace fs = std::filesystem;

App::App(const Config& cfg) : config_(cfg) {}

void App::run() {
    if (config_.verbose) {
        std::cout << "Starting with input: " << config_.input_path << "\n";
    }

    if (!fs::exists(config_.input_path)) {
        throw std::runtime_error("Input path does not exist: " + config_.input_path);
    }

    process(config_.input_path);
}

void App::process(const std::string& path) {
    std::ifstream file(path);
    if (!file.is_open()) {
        throw std::runtime_error("Cannot open file: " + path);
    }

    std::string line;
    size_t line_count = 0;
    while (std::getline(file, line)) {
        ++line_count;
        handle_line(line, line_count);
    }

    if (config_.verbose) {
        std::cout << "Processed " << line_count << " lines.\n";
    }
}

void App::handle_line(const std::string& line, size_t line_no) {
    // TODO: implement actual processing
    (void)line;
    (void)line_no;
}
