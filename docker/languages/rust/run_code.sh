#!/bin/sh

# Compile the code
rustc main.rs -o code

# Execute the code
./code < input.txt
