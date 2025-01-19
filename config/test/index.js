const Joi = require('joi')
const commonSchema = require('../src/commonSchema')

const schema = Joi.object({
  commonSchema
})

// console.log(commonSchema.DECAY_START_TIME)