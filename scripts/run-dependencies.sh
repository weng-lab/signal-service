#!/bin/sh

# cd to project root directory
cd "$(dirname "$(dirname "$0")")"

docker-compose up -d