#!/bin/bash

bun i

bun run fmt

bun run typecheck

cd ./packages/core
bun run build

cd ../../

bun i

echo "Built all packages!"
