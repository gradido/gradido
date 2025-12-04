export enum GradidoNodeErrorCodes {
  NONE = 0,
  GRADIDO_NODE_ERROR = -10000,
  UNKNOWN_GROUP = -10001,
  NOT_IMPLEMENTED = -10002,
  TRANSACTION_NOT_FOUND = -10003,
  JSON_RPC_ERROR_ADDRESS_NOT_FOUND = -10004,
  // default errors from json rpc standard: https://www.jsonrpc.org/specification
  // -32700 	Parse error 	Invalid JSON was received by the server.
  PARSE_ERROR = -32700,
  // -32600 	Invalid Request The JSON sent is not a valid Request object.
  INVALID_REQUEST = -32600,
  // -32601 	Method not found 	The method does not exist / is not available.
  METHODE_NOT_FOUND = -32601,
  // -32602 	Invalid params 	Invalid method parameter(s).
  INVALID_PARAMS = -32602,
  // -32603 	Internal error 	Internal JSON - RPC error.
  INTERNAL_ERROR = -32603,
  // -32000 to -32099 	Server error 	Reserved for implementation-defined server-errors.
}
