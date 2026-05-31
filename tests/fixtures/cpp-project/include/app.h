#pragma once

#include <string>
#include "config.h"

/// Core application class.
/// Owns the main processing loop.
class App {
public:
    explicit App(const Config& config);

    /// Run the application. Throws std::runtime_error on fatal errors.
    void run();

private:
    void process(const std::string& path);
    void handle_line(const std::string& line, size_t line_no);

    const Config& config_;
};
