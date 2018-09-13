#!/bin/bash
# Deploys to kubernetes. Takes 2 args:
# arg1: docker image tag to deploy.
# arg2: environment, ie staging. This should match up with filename prefixes for lib/${arg1}.env.sh and k8s/${arg1}.yml
# Example usage: scripts/deploy.sh v1.0.0 staging
set -e

# cd to project root directory
cd "$(dirname "$(dirname "$0")")"

# import common stuff
source scripts/lib/common.sh

# Exit if two args not given
if [[ $# -ne 2 ]]; then
    echo "Two arguments required.";
    exit;
fi

# Run the environment shell script to set environment specific variables
source scripts/lib/${2}.env.sh

# When running in ci, we will set environment variables with base64 encoded versions of service key files.
# This will log you in with the given account.
# When running locally log in manually with your own account.
if [[ "${K8S_SERVICE_KEY}" ]]; then
    echo $K8S_SERVICE_KEY | base64 --decode > ${HOME}/k8s_service_key.json
    gcloud auth activate-service-account --key-file ${HOME}/k8s_service_key.json
fi

gcloud --quiet config set project $K8S_PROJECT_ID
gcloud --quiet config set container/cluster $K8S_CLUSTER_NAME
gcloud --quiet container clusters get-credentials $K8S_CLUSTER_NAME

# Deploy the configured service / Apply any changes to the configuration.
kubectl apply -f k8s/${2}.yml

# Update the image in the k8s service.
kubectl set image deployment/${KUBE_DEPLOYMENT_NAME} ${KUBE_DEPLOYMENT_CONTAINER_NAME}=gcr.io/${GCR_PROJECT_ID}/${DOCKER_IMAGE_NAME}:${1}