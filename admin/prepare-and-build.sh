# TODO this is the quick&dirty solution for the openssl security topic, please see https://stackoverflow.com/questions/69692842/error-message-error0308010cdigital-envelope-routinesunsupported
$env:NODE_OPTIONS = "--openssl-legacy-provider"

# upgrade yarn and node versions
nvm use v20.0.0
yarn set version stable
yarn cache clear
yarn install
yarn build
