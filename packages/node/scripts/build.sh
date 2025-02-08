#!/bin/bash

# Delete the existing dist folder
rm -rf dist

# Create a new dist folder
mkdir dist
# Create a nested types folder
mkdir dist/types
mkdir dist/types/node

cd ../core/

# Copy the built files to the dist folder
cp dist/node.js ../node/dist/index.js
cp dist/types/node.d.ts ../node/dist/types/index.d.ts
cp dist/types/node/* ../node/dist/types/node/

echo "Build complete!"