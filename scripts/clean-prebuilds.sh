#!/bin/sh

# Determine the current platform
ARCH=$(uname -m)
PLATFORM=""

case "$ARCH" in
  x86_64)
    PLATFORM="linux-x64"
    ;;
  aarch64 | arm64)
    PLATFORM="linux-arm64"
    ;;
  *)
    echo "Sorry, your architecture is not on the guest list: $ARCH"
    exit 1
    ;;
esac

echo "Platform detected: $PLATFORM"

# Find all prebuilds folders
find node_modules -type d -name prebuilds | while read prebuild_dir; do
  echo "Processing: $prebuild_dir"
  
  for subdir in "$prebuild_dir"/*; do
    [ -d "$subdir" ] || continue
    foldername=$(basename "$subdir")
    if [ "$foldername" != "$PLATFORM" ]; then
      echo "  ➜ Deleting: $subdir (you won't miss it)"
      rm -rf "$subdir"
    else
      echo "  ✓ Keeping: $subdir (it's a keeper)"
    fi
  done
done
