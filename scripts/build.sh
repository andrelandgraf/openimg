#!/bin/bash

bun i

cd ./packages/server-utils
bun run build

cd ../react
bun run build

cd ../node
bun run build

cd ../bun
bun run build

echo "Built all packages!"

bun i
