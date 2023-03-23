#!/bin/bash

# find directories
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
PROJECT_DIR="${SCRIPT_DIR}/../"
FRONTEND_DIR="${PROJECT_DIR}/frontend/"
BACKEND_DIR="${PROJECT_DIR}/backend/"
DATABASE_DIR="${PROJECT_DIR}/database/"
ADMIN_DIR="${PROJECT_DIR}/admin/"
DHTNODE_DIR="${PROJECT_DIR}/dht-node/"
FEDERATION_DIR="${PROJECT_DIR}/federation/"

# navigate to project directory
cd ${PROJECT_DIR}

# ask for new version
yarn version --no-git-tag-version --no-commit-hooks --no-commit

# find new version
VERSION="$(node -p -e "require('./package.json').version")"

# update version in sub projects
cd ${FRONTEND_DIR}
yarn version --no-git-tag-version --no-commit-hooks --no-commit --new-version ${VERSION}
cd ${BACKEND_DIR}
yarn version --no-git-tag-version --no-commit-hooks --no-commit --new-version ${VERSION}
cd ${DATABASE_DIR}
yarn version --no-git-tag-version --no-commit-hooks --no-commit --new-version ${VERSION}
cd ${ADMIN_DIR}
yarn version --no-git-tag-version --no-commit-hooks --no-commit --new-version ${VERSION}
cd ${DHTNODE_DIR}
yarn version --no-git-tag-version --no-commit-hooks --no-commit --new-version ${VERSION}
cd ${FEDERATION_DIR}
yarn version --no-git-tag-version --no-commit-hooks --no-commit --new-version ${VERSION}

# generate changelog
cd ${PROJECT_DIR}
auto-changelog --commit-limit 0 --latest-version ${VERSION}