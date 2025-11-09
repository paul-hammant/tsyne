#!/bin/bash

set -e

echo "Building Jyne..."
echo ""

# Check for Go
if ! command -v go &> /dev/null; then
    echo "Error: Go is not installed. Please install Go 1.21 or higher."
    exit 1
fi

# Check for Node.js
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed. Please install Node.js 16 or higher."
    exit 1
fi

# Create directories
mkdir -p bin
mkdir -p dist

echo "Step 1: Installing Node.js dependencies..."
npm install

echo ""
echo "Step 2: Building Go bridge..."
cd bridge
go mod download
go build -o ../bin/jyne-bridge
cd ..

echo ""
echo "Step 3: Building TypeScript library..."
npm run build

echo ""
echo "Build complete!"
echo ""
echo "To run an example:"
echo "  node examples/hello.js"
echo ""
echo "To run the calculator:"
echo "  node examples/calculator.js"
