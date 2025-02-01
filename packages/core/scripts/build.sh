#!/bin/bash

# Delete the existing dist folder
rm -rf dist

# Create a new dist folder
mkdir dist
# Create a nested types folder
mkdir dist/types

cd ../bun/

# Build the package
bun i
bun run build

# Copy the built files to the dist folder
cp dist/index.js ../core/dist/bun.js
cp dist/types/index.d.ts ../core/dist/types/bun.d.ts

cd ../node/

# Build the package
bun i
bun run build

# Copy the built files to the dist folder
cp dist/index.js ../core/dist/node.js
cp dist/types/index.d.ts ../core/dist/types/node.d.ts

cd ../react/

# Build the package
bun i
bun run build

# Copy the built files to the dist folder
cp dist/index.js ../core/dist/react.js
cp dist/types/index.d.ts ../core/dist/types/react.d.ts

echo "Build complete!"