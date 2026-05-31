#include <iostream>
#include <string>
#include <stdexcept>

#include "app.h"
#include "config.h"

int main(int argc, char* argv[]) {
    try {
        Config config;
        config.parse_args(argc, argv);

        App app(config);
        app.run();

        return 0;
    } catch (const std::invalid_argument& e) {
        std::cerr << "Error: " << e.what() << "\n";
        std::cerr << "Usage: myapp [--verbose] [--output <path>] <input>\n";
        return 1;
    } catch (const std::exception& e) {
        std::cerr << "Fatal: " << e.what() << "\n";
        return 2;
    }
}
