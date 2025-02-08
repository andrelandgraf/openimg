#!/bin/bash

bun run fmt
bun i

cd ./packages/core
bun run build

cd ../bun
bun run build

cd ../node
bun run build

cd ../react
bun run build

cd ../../

bun i

echo "Built all packages!"
