#!/bin/bash

# Delete the existing dist folder
rm -rf dist

# Create a new dist folder
mkdir dist
# Create a nested types folder
mkdir dist/types
mkdir dist/types/react

cd ../core/

# Copy the built files to the dist folder
cp dist/react.js ../react/dist/index.js
cp dist/types/react.d.ts ../react/dist/types/index.d.ts
cp dist/types/react/* ../react/dist/types/react/

echo "Build complete!"