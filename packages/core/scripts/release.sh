cp ../../LICENSE ./
cp ../../README.md ./
cp -r ../../docs ./

bun publish

rm ./LICENSE
rm ./README.md
rm -rf ./docs

echo "Publish complete!"