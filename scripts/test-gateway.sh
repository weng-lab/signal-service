#!/bin/bash
# Deploys test version of app and gateway to kubernetes, allowing us to ensure new app schema doesn't break gateway.
# Takes 1 args.
# arg1: environment, ie staging. This should match up with filename prefixes for lib/${arg1}.env.sh and k8s/${arg1}.yml.
# Example usage: scripts/test-gateway.sh staging
set -e

# cd to project root directory
cd "$(dirname "$(dirname "$0")")"

# import common stuff
source scripts/lib/common.sh

# Exit if two args not given
if [[ -z "$1" ]]; then
    echo "One argument required.";
    exit;
fi

# Run the environment shell script to set environment specific variables
source scripts/lib/${1}.env.sh

# Pull gateway project containing gateway k8s config
rm -rf /tmp/gateway
git clone git@github.com:weng-lab/genome-almanac-api.git /tmp/gateway

# Select tag for signal-service docker image
SERVICE_TAGS=( $(gcloud container images list-tags gcr.io/${GCR_PROJECT_ID}/signal-service --limit=10 --format="get(tags)") )
echo "Please select signal service docker image tag to deploy for test:"
select SERVICE_TAG in ${SERVICE_TAGS[@]}
do
    if [[ ! -z "${SERVICE_TAG}" ]]; then
        echo "Deploying test signal-service ${SERVICE_TAG}..."
        break
    else
        echo "Invalid selection..."
    fi
done

gcloud --quiet config set project $K8S_PROJECT_ID
gcloud --quiet config set container/cluster $K8S_CLUSTER_NAME
gcloud --quiet config set compute/zone $COMPUTE_ZONE
gcloud --quiet container clusters get-credentials $K8S_CLUSTER_NAME

# Deploy the new service as "test" version
sed -e "s/\${SERVICE_VERSION}/${SERVICE_TAG}/" \
    -e "s/\${DB_SCHEMA}/${2}/" \
    -e "s/ signal-service/ signal-service-test"/ \
    k8s/service-${1}.yml | \
    kubectl apply -f -

# Wait for app test deployment to finish rolling out
kubectl rollout status deployment/signal-service-test-deployment

# Select tag for gateway docker image
API_TAGS=( $(gcloud container images list-tags gcr.io/${GCR_PROJECT_ID}/genome-almanac-api --limit=10 --format="get(tags)") )
echo "Please select gateway docker image tag to deploy for test:"
select API_TAG in ${API_TAGS[@]}
do
    if [[ ! -z "${API_TAG}" ]]; then
        echo "Deploying genome-almanac-api ${API_TAG}..."
        break
    else
        echo "Invalid selection..."
    fi
done

# Deploy the gateway as "test" version
sed -e "s/\${SERVICE_VERSION}/${API_TAG}/" \
    -e "s/ genome-almanac-api/ genome-almanac-api-test/" \
    -e "s/signal-service/signal-service-test"/ \
    /tmp/gateway/k8s/${1}.yml | sed -n '/---/q;p' | \
    kubectl apply -f -

# Wait for app test deployment to finish rolling out
kubectl rollout status deployment/genome-almanac-api-test-deployment

echo "Test Gateway Deploy Successful!"

# Delete local copy of api project
echo "Cleaning up deployments..."
kubectl delete service/signal-service-test-service
kubectl delete deployment/signal-service-test-deployment
kubectl delete deployment/genome-almanac-api-test-deployment

echo "Cleaning up /tmp/gateway..."
rm -rf /tmp/gateway