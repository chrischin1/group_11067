#!/bin/sh

# Compile the code
go build -o code code.go

# Execute the code
./code < input.txt
