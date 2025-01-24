const Joi = require('joi')
const commonSchema = require('../dist/commonSchema')

const schema = Joi.object({
  commonSchema
})

// console.log(commonSchema.DECAY_START_TIME)