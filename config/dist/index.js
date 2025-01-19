"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = validate;
__exportStar(require("./commonSchema"), exports);
function validate(schema, data) {
    const { error } = schema.validate(data);
    const schemaJson = schema.describe();
    if (error) {
        error.details.forEach((err) => {
            if (!err.context) {
                throw new Error('missing context in config validation with joi');
            }
            const key = err.context.key;
            if (!key) {
                throw new Error('missing key in config validation with joi');
            }
            const value = err.context.value;
            const description = schemaJson.keys[key]
                ? schema.describe().keys[key].flags.description
                : 'No description available';
            if (data[key] === undefined) {
                throw new Error(`Environment Variable '${key}' is missing. ${description}`);
            }
            else {
                throw new Error(`Error on Environment Variable ${key} with value = ${value}: ${err.message}. ${description}`);
            }
        });
    }
}
