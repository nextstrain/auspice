#!/bin/bash
set -euo pipefail

base="$(dirname $0)/.."
cd "$base"

pushd docs-src/website
docusaurus-build
popd

cp -avr docs-src/website/build/auspice/* docs/
