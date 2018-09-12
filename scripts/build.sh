#!/bin/sh
# Builds docker container and tags it. Takes 1 arg:
# arg1: docker image tag.
# Example usage: scripts/push-image.sh v1.0.0
set -e

# cd to project root directory
cd "$(dirname "$(dirname "$0")")"

# Exit if one arg not given
if [[ $# -ne 1 ]]; then
    echo "One argument required.";
    exit;
fi

# import common stuff
source scripts/lib/common.sh

echo ${GCR_PROJECT_ID}

# build the image and tag it with the project version
docker build -t gcr.io/${GCR_PROJECT_ID}/${DOCKER_IMAGE_NAME}:${1} .