#!/bin/bash

# Delete the existing dist folder
rm -rf dist

# Create a new dist folder
mkdir dist
# Create a nested types folder
mkdir dist/types
mkdir dist/types/bun

cd ../core/

# Copy the built files to the dist folder
cp dist/bun.js ../bun/dist/index.js
cp dist/types/bun.d.ts ../bun/dist/types/index.d.ts
cp dist/types/bun/* ../bun/dist/types/bun/

echo "Build complete!"