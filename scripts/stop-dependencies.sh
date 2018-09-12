#!/bin/sh
set -e

# cd to project root directory
cd "$(dirname "$(dirname "$0")")"

docker-compose -f docker-compose.deps.yml down