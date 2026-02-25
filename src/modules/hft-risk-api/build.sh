#!/bin/bash
# Build script for HFT Risk API

set -e

echo "Building HFT Risk API..."

# Check Rust installation
if ! command -v cargo &> /dev/null; then
    echo "Error: Rust/Cargo not found. Please install Rust: https://rustup.rs/"
    exit 1
fi

# Format code
echo "Formatting code..."
cargo fmt

# Run linter
echo "Running clippy..."
cargo clippy -- -D warnings

# Run tests
echo "Running tests..."
cargo test

# Build release
echo "Building release binary..."
cargo build --release

echo "Build complete! Binary: target/release/hft-risk-api"
