#!/bin/bash
set -e

# cd to project root directory
cd "$(dirname "$(dirname "$0")")"

yarn install
scripts/run-dependencies.sh
yarn test
scripts/stop-dependencies.sh
