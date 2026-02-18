#!/bin/bash

# Script to update all blue colors to primary color (#845CC0)
# This will replace blue-* with primary-* in all JSX files

echo "Updating colors from blue to primary..."

# Find all JSX files and replace blue with primary
find frontend/src -name "*.jsx" -type f -exec sed -i '' \
  -e 's/bg-blue-/bg-primary-/g' \
  -e 's/text-blue-/text-primary-/g' \
  -e 's/border-blue-/border-primary-/g' \
  -e 's/hover:bg-blue-/hover:bg-primary-/g' \
  -e 's/hover:text-blue-/hover:text-primary-/g' \
  -e 's/focus:ring-blue-/focus:ring-primary-/g' \
  -e 's/focus:border-blue-/focus:border-primary-/g' \
  -e 's/from-blue-/from-primary-/g' \
  -e 's/to-blue-/to-primary-/g' \
  {} \;

echo "Color update complete!"
echo "Note: If you're on Linux, remove the '' after -i in the sed command"
