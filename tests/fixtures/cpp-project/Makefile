.PHONY: configure build test clean

BUILD_DIR := build
TYPE      := Release

configure:
	cmake -B $(BUILD_DIR) -DCMAKE_BUILD_TYPE=$(TYPE)

build: configure
	cmake --build $(BUILD_DIR) --parallel

test: build
	ctest --test-dir $(BUILD_DIR) --output-on-failure

clean:
	rm -rf $(BUILD_DIR)

run: build
	./$(BUILD_DIR)/myapp
