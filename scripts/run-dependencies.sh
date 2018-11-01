#!/bin/bash
set -e

# cd to project root directory
cd "$(dirname "$(dirname "$0")")"
if [ ! -f resources/static/ENCFF686NUN.bigWig ]; then
    wget https://www.encodeproject.org/files/ENCFF686NUN/@@download/ENCFF686NUN.bigWig -O resources/static/ENCFF686NUN.bigWig;
fi

docker-compose -f docker-compose.deps.yml up -d
