#!/bin/bash

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

languages=("python" "javascript" "java" "c" "cpp" "ruby" "go" "php" "rust" "swift")

for lang in "${languages[@]}"; do
  echo "Building image for $lang..."
  docker build -t "code-runner-$lang" "$SCRIPT_DIR/languages/$lang"
done
