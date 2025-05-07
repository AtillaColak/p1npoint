#!/bin/bash
set -e

# Check if .env file exists
if [ ! -f .env ]; then
    echo ".env file not found!"
    exit 1
fi
# Load environment variables from .env file
export $(grep -v '^#' .env | xargs)

# Start backend and wait until healthy
echo "Starting backend..."
docker compose up -d

CONTAINER="backend"

echo "Backend is healthy!"

# Run key generation command inside backend container
echo "Generating convex key..."
KEY=$(docker compose exec ${CONTAINER} ./generate_admin_key.sh)

docker rm -f frontend 2>/dev/null || true

docker build -t frontend \
    --build-arg CONVEX_SELF_HOSTED_ADMIN_KEY="$KEY" \
    --build-arg CONVEX_SELF_HOSTED_URL="http://host.docker.internal:3210" \
    --build-arg NEXT_PUBLIC_CONVEX_URL="http://host.docker.internal:3210" \
    --build-arg NEXT_PUBLIC_GOOGLE_API_KEY="$NEXT_PUBLIC_GOOGLE_API_KEY" \
    -t frontend .

docker run -d \
    --name frontend \
    --rm \
    -p 3000:3000 \
    -e NEXT_PUBLIC_CONVEX_URL="http://host.docker.internal:3210" \
    -e LLM_DEV_URL="$LLM_DEV_URL" \
    -e NEXT_PUBLIC_GOOGLE_API_KEY="$NEXT_PUBLIC_GOOGLE_API_KEY" \
    frontend



# # Build Docker image using the key as a build arg
# echo "Building final image..."
# docker build --build-arg MY_KEY="$KEY" -t final-app .

# # Run the final app with the key as an environment variable
# echo "Running final app..."
# docker run --rm -e MY_KEY="$KEY" final-app
