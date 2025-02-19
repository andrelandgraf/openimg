#!/bin/bash
echo "Deleting dist..."
rm -rf ./dist

echo "Bun building..."
bun run ./scripts/build.ts 

echo "tsc..."
tsc
 
echo "Copying files..."
cp ./src/vite/client.d.ts ./dist/

echo "Build complete!"
