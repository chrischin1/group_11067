#!/bin/sh

# Compile the code
swiftc code.swift -o code

# Execute the code
./code < input.txt
