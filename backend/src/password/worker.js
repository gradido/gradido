const { worker } = require('workerpool')
const { SecretKeyCryptographyCreateKeyFunc } = require('./EncryptionWorker')

worker({
  SecretKeyCryptographyCreateKeyFunc,
})

