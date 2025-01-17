# TODO this is the quick&dirty solution for the openssl security topic, please see https://stackoverflow.com/questions/69692842/error-message-error0308010cdigital-envelope-routinesunsupported
$env:NODE_OPTIONS = "--openssl-legacy-provider"

nvm use
yarn cache clean
yarn install
yarn build
