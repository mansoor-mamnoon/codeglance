#include <gtest/gtest.h>
#include "config.h"
#include "app.h"

TEST(ConfigTest, ParseVerboseFlag) {
    Config cfg;
    const char* args[] = {"myapp", "--verbose", "input.txt"};
    cfg.parse_args(3, const_cast<char**>(args));
    EXPECT_TRUE(cfg.verbose);
    EXPECT_EQ(cfg.input_path, "input.txt");
}

TEST(ConfigTest, ParseOutputFlag) {
    Config cfg;
    const char* args[] = {"myapp", "--output", "out.txt", "in.txt"};
    cfg.parse_args(4, const_cast<char**>(args));
    EXPECT_EQ(cfg.output_path, "out.txt");
    EXPECT_EQ(cfg.input_path, "in.txt");
}

TEST(ConfigTest, MissingInputThrows) {
    Config cfg;
    const char* args[] = {"myapp"};
    EXPECT_THROW(cfg.parse_args(1, const_cast<char**>(args)), std::invalid_argument);
}
