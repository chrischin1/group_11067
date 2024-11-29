#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

echo "Starting setup..."

# Function to check version compatibility
check_version() {
    # Compare versions and exit if the required version is higher
    if [[ "$1" -lt "$2" ]]; then
        echo "Error: Version $1 is below the required version $2."
        exit 1
    fi
}


# Check if Node.js is installed and meets the version requirement
if ! command -v node &> /dev/null
then
    echo "Error: Node.js is not installed. Please install Node.js (version 20+)."
    exit 1
else
    NODE_VERSION=$(node -v | sed 's/v//')
    REQUIRED_NODE_VERSION=20
    
    # Extract the major version for comparison
    NODE_MAJOR_VERSION=$(echo "$NODE_VERSION" | cut -d '.' -f1)
    
    if (( NODE_MAJOR_VERSION < REQUIRED_NODE_VERSION )); then
        echo "Error: Node.js version must be 20 or higher. Current version: $NODE_VERSION."
        exit 1
    fi
fi

# Check if npm is installed
if ! command -v npm &> /dev/null
then
    echo "Error: npm is not installed. Please install npm."
    exit 1
fi

# Check if npx is available (bundled with npm)
if ! command -v npx &> /dev/null
then
    echo "Warning: npx is not installed. It is recommended for running Prisma commands."
fi

# Check if GCC is installed and meets the version requirement
if ! command -v gcc &> /dev/null
then
    echo "Error: GCC is not installed. Please install GCC."
    exit 1
else
    GCC_VERSION=$(gcc -dumpversion)
    echo "GCC version $GCC_VERSION found."
fi

# Check if G++ is installed and meets the version requirement
if ! command -v g++ &> /dev/null
then
    echo "Error: G++ is not installed. Please install G++."
    exit 1
else
    GPP_VERSION=$(g++ -dumpversion)
    echo "G++ version $GPP_VERSION found."
fi

# Check if Java (javac) is installed and meets the version requirement
if ! command -v javac &> /dev/null
then
    echo "Error: Java (javac) is not installed. Please install Java Development Kit (JDK) version 20+."
    exit 1
else
    JAVA_VERSION=$(javac -version 2>&1 | awk '{print $2}' | cut -d'.' -f1)
    REQUIRED_JAVA_VERSION=20
    check_version $JAVA_VERSION $REQUIRED_JAVA_VERSION
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null
then
    echo "Error: Docker is not installed. Please install Docker."
    exit 1
fi

if [[ ! -x ./run.sh ]]; then
    echo "Adding execute permissions to run.sh..."
    chmod +x ./run.sh
fi

# Install npm dependencies
echo "Installing npm dependencies..."
npm install

# Run Prisma migrations
echo "Running Prisma migrations..."
npx prisma migrate dev --name init

# # Seed the database with an admin user
# echo "Seeding the database with an admin user..."
# npx prisma db seed

echo "Setup completed successfully!"