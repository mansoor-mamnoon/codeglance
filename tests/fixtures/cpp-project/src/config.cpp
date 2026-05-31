#include "config.h"

#include <stdexcept>
#include <string>

void Config::parse_args(int argc, char* argv[]) {
    for (int i = 1; i < argc; ++i) {
        std::string arg(argv[i]);
        if (arg == "--verbose" || arg == "-v") {
            verbose = true;
        } else if ((arg == "--output" || arg == "-o") && i + 1 < argc) {
            output_path = argv[++i];
        } else if (arg[0] != '-') {
            if (!input_path.empty()) {
                throw std::invalid_argument("Multiple input paths provided");
            }
            input_path = arg;
        } else {
            throw std::invalid_argument("Unknown argument: " + arg);
        }
    }

    if (input_path.empty()) {
        throw std::invalid_argument("Input path is required");
    }
}
