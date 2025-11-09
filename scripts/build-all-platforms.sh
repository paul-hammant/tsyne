#!/bin/bash
set -e

echo "Building Jyne bridge for all platforms..."
echo ""

cd bridge

# Create bin directory
mkdir -p ../bin

# Download dependencies first
echo "Downloading Go dependencies..."
go mod download

# Build for macOS (Intel)
echo "Building for macOS (Intel)..."
GOOS=darwin GOARCH=amd64 go build -o ../bin/jyne-bridge-darwin-amd64

# Build for macOS (Apple Silicon)
echo "Building for macOS (Apple Silicon)..."
GOOS=darwin GOARCH=arm64 go build -o ../bin/jyne-bridge-darwin-arm64

# Build for Linux (x64)
echo "Building for Linux (x64)..."
GOOS=linux GOARCH=amd64 go build -o ../bin/jyne-bridge-linux-amd64

# Build for Windows (x64)
echo "Building for Windows (x64)..."
GOOS=windows GOARCH=amd64 go build -o ../bin/jyne-bridge-windows-amd64.exe

cd ..

echo ""
echo "✓ Built binaries for all platforms:"
ls -lh bin/jyne-bridge-*
echo ""
echo "Total size:"
du -sh bin/
