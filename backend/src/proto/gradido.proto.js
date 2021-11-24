/*eslint-disable block-scoped-var, id-length, no-control-regex, no-magic-numbers, no-prototype-builtins, no-redeclare, no-shadow, no-var, sort-vars*/
"use strict";

var $protobuf = require("protobufjs/minimal");

// Common aliases
var $Reader = $protobuf.Reader, $Writer = $protobuf.Writer, $util = $protobuf.util;

// Exported root namespace
var $root = $protobuf.roots["default"] || ($protobuf.roots["default"] = {});

$root.proto = (function() {

    /**
     * Namespace proto.
     * @exports proto
     * @namespace
     */
    var proto = {};

    proto.gradido = (function() {

        /**
         * Namespace gradido.
         * @memberof proto
         * @namespace
         */
        var gradido = {};

        gradido.Key = (function() {

            /**
             * Properties of a Key.
             * @memberof proto.gradido
             * @interface IKey
             * @property {Uint8Array|null} [ed25519] Key ed25519
             * @property {Uint8Array|null} [ed25519Ref10] Key ed25519Ref10
             */

            /**
             * Constructs a new Key.
             * @memberof proto.gradido
             * @classdesc Represents a Key.
             * @implements IKey
             * @constructor
             * @param {proto.gradido.IKey=} [properties] Properties to set
             */
            function Key(properties) {
                if (properties)
                    for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * Key ed25519.
             * @member {Uint8Array|null|undefined} ed25519
             * @memberof proto.gradido.Key
             * @instance
             */
            Key.prototype.ed25519 = null;

            /**
             * Key ed25519Ref10.
             * @member {Uint8Array|null|undefined} ed25519Ref10
             * @memberof proto.gradido.Key
             * @instance
             */
            Key.prototype.ed25519Ref10 = null;

            // OneOf field names bound to virtual getters and setters
            var $oneOfFields;

            /**
             * Key key.
             * @member {"ed25519"|"ed25519Ref10"|undefined} key
             * @memberof proto.gradido.Key
             * @instance
             */
            Object.defineProperty(Key.prototype, "key", {
                get: $util.oneOfGetter($oneOfFields = ["ed25519", "ed25519Ref10"]),
                set: $util.oneOfSetter($oneOfFields)
            });

            /**
             * Creates a new Key instance using the specified properties.
             * @function create
             * @memberof proto.gradido.Key
             * @static
             * @param {proto.gradido.IKey=} [properties] Properties to set
             * @returns {proto.gradido.Key} Key instance
             */
            Key.create = function create(properties) {
                return new Key(properties);
            };

            /**
             * Encodes the specified Key message. Does not implicitly {@link proto.gradido.Key.verify|verify} messages.
             * @function encode
             * @memberof proto.gradido.Key
             * @static
             * @param {proto.gradido.IKey} message Key message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            Key.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.ed25519 != null && Object.hasOwnProperty.call(message, "ed25519"))
                    writer.uint32(/* id 2, wireType 2 =*/18).bytes(message.ed25519);
                if (message.ed25519Ref10 != null && Object.hasOwnProperty.call(message, "ed25519Ref10"))
                    writer.uint32(/* id 3, wireType 2 =*/26).bytes(message.ed25519Ref10);
                return writer;
            };

            /**
             * Encodes the specified Key message, length delimited. Does not implicitly {@link proto.gradido.Key.verify|verify} messages.
             * @function encodeDelimited
             * @memberof proto.gradido.Key
             * @static
             * @param {proto.gradido.IKey} message Key message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            Key.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes a Key message from the specified reader or buffer.
             * @function decode
             * @memberof proto.gradido.Key
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {proto.gradido.Key} Key
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            Key.decode = function decode(reader, length) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                var end = length === undefined ? reader.len : reader.pos + length, message = new $root.proto.gradido.Key();
                while (reader.pos < end) {
                    var tag = reader.uint32();
                    switch (tag >>> 3) {
                    case 2:
                        message.ed25519 = reader.bytes();
                        break;
                    case 3:
                        message.ed25519Ref10 = reader.bytes();
                        break;
                    default:
                        reader.skipType(tag & 7);
                        break;
                    }
                }
                return message;
            };

            /**
             * Decodes a Key message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof proto.gradido.Key
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {proto.gradido.Key} Key
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            Key.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a Key message.
             * @function verify
             * @memberof proto.gradido.Key
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            Key.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                var properties = {};
                if (message.ed25519 != null && message.hasOwnProperty("ed25519")) {
                    properties.key = 1;
                    if (!(message.ed25519 && typeof message.ed25519.length === "number" || $util.isString(message.ed25519)))
                        return "ed25519: buffer expected";
                }
                if (message.ed25519Ref10 != null && message.hasOwnProperty("ed25519Ref10")) {
                    if (properties.key === 1)
                        return "key: multiple values";
                    properties.key = 1;
                    if (!(message.ed25519Ref10 && typeof message.ed25519Ref10.length === "number" || $util.isString(message.ed25519Ref10)))
                        return "ed25519Ref10: buffer expected";
                }
                return null;
            };

            /**
             * Creates a Key message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof proto.gradido.Key
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {proto.gradido.Key} Key
             */
            Key.fromObject = function fromObject(object) {
                if (object instanceof $root.proto.gradido.Key)
                    return object;
                var message = new $root.proto.gradido.Key();
                if (object.ed25519 != null)
                    if (typeof object.ed25519 === "string")
                        $util.base64.decode(object.ed25519, message.ed25519 = $util.newBuffer($util.base64.length(object.ed25519)), 0);
                    else if (object.ed25519.length)
                        message.ed25519 = object.ed25519;
                if (object.ed25519Ref10 != null)
                    if (typeof object.ed25519Ref10 === "string")
                        $util.base64.decode(object.ed25519Ref10, message.ed25519Ref10 = $util.newBuffer($util.base64.length(object.ed25519Ref10)), 0);
                    else if (object.ed25519Ref10.length)
                        message.ed25519Ref10 = object.ed25519Ref10;
                return message;
            };

            /**
             * Creates a plain object from a Key message. Also converts values to other types if specified.
             * @function toObject
             * @memberof proto.gradido.Key
             * @static
             * @param {proto.gradido.Key} message Key
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            Key.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                var object = {};
                if (message.ed25519 != null && message.hasOwnProperty("ed25519")) {
                    object.ed25519 = options.bytes === String ? $util.base64.encode(message.ed25519, 0, message.ed25519.length) : options.bytes === Array ? Array.prototype.slice.call(message.ed25519) : message.ed25519;
                    if (options.oneofs)
                        object.key = "ed25519";
                }
                if (message.ed25519Ref10 != null && message.hasOwnProperty("ed25519Ref10")) {
                    object.ed25519Ref10 = options.bytes === String ? $util.base64.encode(message.ed25519Ref10, 0, message.ed25519Ref10.length) : options.bytes === Array ? Array.prototype.slice.call(message.ed25519Ref10) : message.ed25519Ref10;
                    if (options.oneofs)
                        object.key = "ed25519Ref10";
                }
                return object;
            };

            /**
             * Converts this Key to JSON.
             * @function toJSON
             * @memberof proto.gradido.Key
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            Key.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            return Key;
        })();

        gradido.SignaturePair = (function() {

            /**
             * Properties of a SignaturePair.
             * @memberof proto.gradido
             * @interface ISignaturePair
             * @property {Uint8Array|null} [pubKey] SignaturePair pubKey
             * @property {Uint8Array|null} [ed25519] SignaturePair ed25519
             * @property {Uint8Array|null} [ed25519Ref10] SignaturePair ed25519Ref10
             */

            /**
             * Constructs a new SignaturePair.
             * @memberof proto.gradido
             * @classdesc Represents a SignaturePair.
             * @implements ISignaturePair
             * @constructor
             * @param {proto.gradido.ISignaturePair=} [properties] Properties to set
             */
            function SignaturePair(properties) {
                if (properties)
                    for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * SignaturePair pubKey.
             * @member {Uint8Array} pubKey
             * @memberof proto.gradido.SignaturePair
             * @instance
             */
            SignaturePair.prototype.pubKey = $util.newBuffer([]);

            /**
             * SignaturePair ed25519.
             * @member {Uint8Array|null|undefined} ed25519
             * @memberof proto.gradido.SignaturePair
             * @instance
             */
            SignaturePair.prototype.ed25519 = null;

            /**
             * SignaturePair ed25519Ref10.
             * @member {Uint8Array|null|undefined} ed25519Ref10
             * @memberof proto.gradido.SignaturePair
             * @instance
             */
            SignaturePair.prototype.ed25519Ref10 = null;

            // OneOf field names bound to virtual getters and setters
            var $oneOfFields;

            /**
             * SignaturePair signature.
             * @member {"ed25519"|"ed25519Ref10"|undefined} signature
             * @memberof proto.gradido.SignaturePair
             * @instance
             */
            Object.defineProperty(SignaturePair.prototype, "signature", {
                get: $util.oneOfGetter($oneOfFields = ["ed25519", "ed25519Ref10"]),
                set: $util.oneOfSetter($oneOfFields)
            });

            /**
             * Creates a new SignaturePair instance using the specified properties.
             * @function create
             * @memberof proto.gradido.SignaturePair
             * @static
             * @param {proto.gradido.ISignaturePair=} [properties] Properties to set
             * @returns {proto.gradido.SignaturePair} SignaturePair instance
             */
            SignaturePair.create = function create(properties) {
                return new SignaturePair(properties);
            };

            /**
             * Encodes the specified SignaturePair message. Does not implicitly {@link proto.gradido.SignaturePair.verify|verify} messages.
             * @function encode
             * @memberof proto.gradido.SignaturePair
             * @static
             * @param {proto.gradido.ISignaturePair} message SignaturePair message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            SignaturePair.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.pubKey != null && Object.hasOwnProperty.call(message, "pubKey"))
                    writer.uint32(/* id 1, wireType 2 =*/10).bytes(message.pubKey);
                if (message.ed25519 != null && Object.hasOwnProperty.call(message, "ed25519"))
                    writer.uint32(/* id 2, wireType 2 =*/18).bytes(message.ed25519);
                if (message.ed25519Ref10 != null && Object.hasOwnProperty.call(message, "ed25519Ref10"))
                    writer.uint32(/* id 3, wireType 2 =*/26).bytes(message.ed25519Ref10);
                return writer;
            };

            /**
             * Encodes the specified SignaturePair message, length delimited. Does not implicitly {@link proto.gradido.SignaturePair.verify|verify} messages.
             * @function encodeDelimited
             * @memberof proto.gradido.SignaturePair
             * @static
             * @param {proto.gradido.ISignaturePair} message SignaturePair message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            SignaturePair.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes a SignaturePair message from the specified reader or buffer.
             * @function decode
             * @memberof proto.gradido.SignaturePair
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {proto.gradido.SignaturePair} SignaturePair
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            SignaturePair.decode = function decode(reader, length) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                var end = length === undefined ? reader.len : reader.pos + length, message = new $root.proto.gradido.SignaturePair();
                while (reader.pos < end) {
                    var tag = reader.uint32();
                    switch (tag >>> 3) {
                    case 1:
                        message.pubKey = reader.bytes();
                        break;
                    case 2:
                        message.ed25519 = reader.bytes();
                        break;
                    case 3:
                        message.ed25519Ref10 = reader.bytes();
                        break;
                    default:
                        reader.skipType(tag & 7);
                        break;
                    }
                }
                return message;
            };

            /**
             * Decodes a SignaturePair message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof proto.gradido.SignaturePair
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {proto.gradido.SignaturePair} SignaturePair
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            SignaturePair.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a SignaturePair message.
             * @function verify
             * @memberof proto.gradido.SignaturePair
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            SignaturePair.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                var properties = {};
                if (message.pubKey != null && message.hasOwnProperty("pubKey"))
                    if (!(message.pubKey && typeof message.pubKey.length === "number" || $util.isString(message.pubKey)))
                        return "pubKey: buffer expected";
                if (message.ed25519 != null && message.hasOwnProperty("ed25519")) {
                    properties.signature = 1;
                    if (!(message.ed25519 && typeof message.ed25519.length === "number" || $util.isString(message.ed25519)))
                        return "ed25519: buffer expected";
                }
                if (message.ed25519Ref10 != null && message.hasOwnProperty("ed25519Ref10")) {
                    if (properties.signature === 1)
                        return "signature: multiple values";
                    properties.signature = 1;
                    if (!(message.ed25519Ref10 && typeof message.ed25519Ref10.length === "number" || $util.isString(message.ed25519Ref10)))
                        return "ed25519Ref10: buffer expected";
                }
                return null;
            };

            /**
             * Creates a SignaturePair message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof proto.gradido.SignaturePair
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {proto.gradido.SignaturePair} SignaturePair
             */
            SignaturePair.fromObject = function fromObject(object) {
                if (object instanceof $root.proto.gradido.SignaturePair)
                    return object;
                var message = new $root.proto.gradido.SignaturePair();
                if (object.pubKey != null)
                    if (typeof object.pubKey === "string")
                        $util.base64.decode(object.pubKey, message.pubKey = $util.newBuffer($util.base64.length(object.pubKey)), 0);
                    else if (object.pubKey.length)
                        message.pubKey = object.pubKey;
                if (object.ed25519 != null)
                    if (typeof object.ed25519 === "string")
                        $util.base64.decode(object.ed25519, message.ed25519 = $util.newBuffer($util.base64.length(object.ed25519)), 0);
                    else if (object.ed25519.length)
                        message.ed25519 = object.ed25519;
                if (object.ed25519Ref10 != null)
                    if (typeof object.ed25519Ref10 === "string")
                        $util.base64.decode(object.ed25519Ref10, message.ed25519Ref10 = $util.newBuffer($util.base64.length(object.ed25519Ref10)), 0);
                    else if (object.ed25519Ref10.length)
                        message.ed25519Ref10 = object.ed25519Ref10;
                return message;
            };

            /**
             * Creates a plain object from a SignaturePair message. Also converts values to other types if specified.
             * @function toObject
             * @memberof proto.gradido.SignaturePair
             * @static
             * @param {proto.gradido.SignaturePair} message SignaturePair
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            SignaturePair.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                var object = {};
                if (options.defaults)
                    if (options.bytes === String)
                        object.pubKey = "";
                    else {
                        object.pubKey = [];
                        if (options.bytes !== Array)
                            object.pubKey = $util.newBuffer(object.pubKey);
                    }
                if (message.pubKey != null && message.hasOwnProperty("pubKey"))
                    object.pubKey = options.bytes === String ? $util.base64.encode(message.pubKey, 0, message.pubKey.length) : options.bytes === Array ? Array.prototype.slice.call(message.pubKey) : message.pubKey;
                if (message.ed25519 != null && message.hasOwnProperty("ed25519")) {
                    object.ed25519 = options.bytes === String ? $util.base64.encode(message.ed25519, 0, message.ed25519.length) : options.bytes === Array ? Array.prototype.slice.call(message.ed25519) : message.ed25519;
                    if (options.oneofs)
                        object.signature = "ed25519";
                }
                if (message.ed25519Ref10 != null && message.hasOwnProperty("ed25519Ref10")) {
                    object.ed25519Ref10 = options.bytes === String ? $util.base64.encode(message.ed25519Ref10, 0, message.ed25519Ref10.length) : options.bytes === Array ? Array.prototype.slice.call(message.ed25519Ref10) : message.ed25519Ref10;
                    if (options.oneofs)
                        object.signature = "ed25519Ref10";
                }
                return object;
            };

            /**
             * Converts this SignaturePair to JSON.
             * @function toJSON
             * @memberof proto.gradido.SignaturePair
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            SignaturePair.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            return SignaturePair;
        })();

        gradido.SignatureMap = (function() {

            /**
             * Properties of a SignatureMap.
             * @memberof proto.gradido
             * @interface ISignatureMap
             * @property {Array.<proto.gradido.ISignaturePair>|null} [sigPair] SignatureMap sigPair
             */

            /**
             * Constructs a new SignatureMap.
             * @memberof proto.gradido
             * @classdesc Represents a SignatureMap.
             * @implements ISignatureMap
             * @constructor
             * @param {proto.gradido.ISignatureMap=} [properties] Properties to set
             */
            function SignatureMap(properties) {
                this.sigPair = [];
                if (properties)
                    for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * SignatureMap sigPair.
             * @member {Array.<proto.gradido.ISignaturePair>} sigPair
             * @memberof proto.gradido.SignatureMap
             * @instance
             */
            SignatureMap.prototype.sigPair = $util.emptyArray;

            /**
             * Creates a new SignatureMap instance using the specified properties.
             * @function create
             * @memberof proto.gradido.SignatureMap
             * @static
             * @param {proto.gradido.ISignatureMap=} [properties] Properties to set
             * @returns {proto.gradido.SignatureMap} SignatureMap instance
             */
            SignatureMap.create = function create(properties) {
                return new SignatureMap(properties);
            };

            /**
             * Encodes the specified SignatureMap message. Does not implicitly {@link proto.gradido.SignatureMap.verify|verify} messages.
             * @function encode
             * @memberof proto.gradido.SignatureMap
             * @static
             * @param {proto.gradido.ISignatureMap} message SignatureMap message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            SignatureMap.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.sigPair != null && message.sigPair.length)
                    for (var i = 0; i < message.sigPair.length; ++i)
                        $root.proto.gradido.SignaturePair.encode(message.sigPair[i], writer.uint32(/* id 1, wireType 2 =*/10).fork()).ldelim();
                return writer;
            };

            /**
             * Encodes the specified SignatureMap message, length delimited. Does not implicitly {@link proto.gradido.SignatureMap.verify|verify} messages.
             * @function encodeDelimited
             * @memberof proto.gradido.SignatureMap
             * @static
             * @param {proto.gradido.ISignatureMap} message SignatureMap message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            SignatureMap.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes a SignatureMap message from the specified reader or buffer.
             * @function decode
             * @memberof proto.gradido.SignatureMap
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {proto.gradido.SignatureMap} SignatureMap
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            SignatureMap.decode = function decode(reader, length) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                var end = length === undefined ? reader.len : reader.pos + length, message = new $root.proto.gradido.SignatureMap();
                while (reader.pos < end) {
                    var tag = reader.uint32();
                    switch (tag >>> 3) {
                    case 1:
                        if (!(message.sigPair && message.sigPair.length))
                            message.sigPair = [];
                        message.sigPair.push($root.proto.gradido.SignaturePair.decode(reader, reader.uint32()));
                        break;
                    default:
                        reader.skipType(tag & 7);
                        break;
                    }
                }
                return message;
            };

            /**
             * Decodes a SignatureMap message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof proto.gradido.SignatureMap
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {proto.gradido.SignatureMap} SignatureMap
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            SignatureMap.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a SignatureMap message.
             * @function verify
             * @memberof proto.gradido.SignatureMap
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            SignatureMap.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (message.sigPair != null && message.hasOwnProperty("sigPair")) {
                    if (!Array.isArray(message.sigPair))
                        return "sigPair: array expected";
                    for (var i = 0; i < message.sigPair.length; ++i) {
                        var error = $root.proto.gradido.SignaturePair.verify(message.sigPair[i]);
                        if (error)
                            return "sigPair." + error;
                    }
                }
                return null;
            };

            /**
             * Creates a SignatureMap message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof proto.gradido.SignatureMap
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {proto.gradido.SignatureMap} SignatureMap
             */
            SignatureMap.fromObject = function fromObject(object) {
                if (object instanceof $root.proto.gradido.SignatureMap)
                    return object;
                var message = new $root.proto.gradido.SignatureMap();
                if (object.sigPair) {
                    if (!Array.isArray(object.sigPair))
                        throw TypeError(".proto.gradido.SignatureMap.sigPair: array expected");
                    message.sigPair = [];
                    for (var i = 0; i < object.sigPair.length; ++i) {
                        if (typeof object.sigPair[i] !== "object")
                            throw TypeError(".proto.gradido.SignatureMap.sigPair: object expected");
                        message.sigPair[i] = $root.proto.gradido.SignaturePair.fromObject(object.sigPair[i]);
                    }
                }
                return message;
            };

            /**
             * Creates a plain object from a SignatureMap message. Also converts values to other types if specified.
             * @function toObject
             * @memberof proto.gradido.SignatureMap
             * @static
             * @param {proto.gradido.SignatureMap} message SignatureMap
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            SignatureMap.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                var object = {};
                if (options.arrays || options.defaults)
                    object.sigPair = [];
                if (message.sigPair && message.sigPair.length) {
                    object.sigPair = [];
                    for (var j = 0; j < message.sigPair.length; ++j)
                        object.sigPair[j] = $root.proto.gradido.SignaturePair.toObject(message.sigPair[j], options);
                }
                return object;
            };

            /**
             * Converts this SignatureMap to JSON.
             * @function toJSON
             * @memberof proto.gradido.SignatureMap
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            SignatureMap.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            return SignatureMap;
        })();

        gradido.Timestamp = (function() {

            /**
             * Properties of a Timestamp.
             * @memberof proto.gradido
             * @interface ITimestamp
             * @property {number|Long|null} [seconds] Timestamp seconds
             * @property {number|null} [nanos] Timestamp nanos
             */

            /**
             * Constructs a new Timestamp.
             * @memberof proto.gradido
             * @classdesc Represents a Timestamp.
             * @implements ITimestamp
             * @constructor
             * @param {proto.gradido.ITimestamp=} [properties] Properties to set
             */
            function Timestamp(properties) {
                if (properties)
                    for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * Timestamp seconds.
             * @member {number|Long} seconds
             * @memberof proto.gradido.Timestamp
             * @instance
             */
            Timestamp.prototype.seconds = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

            /**
             * Timestamp nanos.
             * @member {number} nanos
             * @memberof proto.gradido.Timestamp
             * @instance
             */
            Timestamp.prototype.nanos = 0;

            /**
             * Creates a new Timestamp instance using the specified properties.
             * @function create
             * @memberof proto.gradido.Timestamp
             * @static
             * @param {proto.gradido.ITimestamp=} [properties] Properties to set
             * @returns {proto.gradido.Timestamp} Timestamp instance
             */
            Timestamp.create = function create(properties) {
                return new Timestamp(properties);
            };

            /**
             * Encodes the specified Timestamp message. Does not implicitly {@link proto.gradido.Timestamp.verify|verify} messages.
             * @function encode
             * @memberof proto.gradido.Timestamp
             * @static
             * @param {proto.gradido.ITimestamp} message Timestamp message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            Timestamp.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.seconds != null && Object.hasOwnProperty.call(message, "seconds"))
                    writer.uint32(/* id 1, wireType 0 =*/8).int64(message.seconds);
                if (message.nanos != null && Object.hasOwnProperty.call(message, "nanos"))
                    writer.uint32(/* id 2, wireType 0 =*/16).int32(message.nanos);
                return writer;
            };

            /**
             * Encodes the specified Timestamp message, length delimited. Does not implicitly {@link proto.gradido.Timestamp.verify|verify} messages.
             * @function encodeDelimited
             * @memberof proto.gradido.Timestamp
             * @static
             * @param {proto.gradido.ITimestamp} message Timestamp message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            Timestamp.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes a Timestamp message from the specified reader or buffer.
             * @function decode
             * @memberof proto.gradido.Timestamp
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {proto.gradido.Timestamp} Timestamp
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            Timestamp.decode = function decode(reader, length) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                var end = length === undefined ? reader.len : reader.pos + length, message = new $root.proto.gradido.Timestamp();
                while (reader.pos < end) {
                    var tag = reader.uint32();
                    switch (tag >>> 3) {
                    case 1:
                        message.seconds = reader.int64();
                        break;
                    case 2:
                        message.nanos = reader.int32();
                        break;
                    default:
                        reader.skipType(tag & 7);
                        break;
                    }
                }
                return message;
            };

            /**
             * Decodes a Timestamp message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof proto.gradido.Timestamp
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {proto.gradido.Timestamp} Timestamp
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            Timestamp.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a Timestamp message.
             * @function verify
             * @memberof proto.gradido.Timestamp
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            Timestamp.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (message.seconds != null && message.hasOwnProperty("seconds"))
                    if (!$util.isInteger(message.seconds) && !(message.seconds && $util.isInteger(message.seconds.low) && $util.isInteger(message.seconds.high)))
                        return "seconds: integer|Long expected";
                if (message.nanos != null && message.hasOwnProperty("nanos"))
                    if (!$util.isInteger(message.nanos))
                        return "nanos: integer expected";
                return null;
            };

            /**
             * Creates a Timestamp message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof proto.gradido.Timestamp
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {proto.gradido.Timestamp} Timestamp
             */
            Timestamp.fromObject = function fromObject(object) {
                if (object instanceof $root.proto.gradido.Timestamp)
                    return object;
                var message = new $root.proto.gradido.Timestamp();
                if (object.seconds != null)
                    if ($util.Long)
                        (message.seconds = $util.Long.fromValue(object.seconds)).unsigned = false;
                    else if (typeof object.seconds === "string")
                        message.seconds = parseInt(object.seconds, 10);
                    else if (typeof object.seconds === "number")
                        message.seconds = object.seconds;
                    else if (typeof object.seconds === "object")
                        message.seconds = new $util.LongBits(object.seconds.low >>> 0, object.seconds.high >>> 0).toNumber();
                if (object.nanos != null)
                    message.nanos = object.nanos | 0;
                return message;
            };

            /**
             * Creates a plain object from a Timestamp message. Also converts values to other types if specified.
             * @function toObject
             * @memberof proto.gradido.Timestamp
             * @static
             * @param {proto.gradido.Timestamp} message Timestamp
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            Timestamp.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                var object = {};
                if (options.defaults) {
                    if ($util.Long) {
                        var long = new $util.Long(0, 0, false);
                        object.seconds = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
                    } else
                        object.seconds = options.longs === String ? "0" : 0;
                    object.nanos = 0;
                }
                if (message.seconds != null && message.hasOwnProperty("seconds"))
                    if (typeof message.seconds === "number")
                        object.seconds = options.longs === String ? String(message.seconds) : message.seconds;
                    else
                        object.seconds = options.longs === String ? $util.Long.prototype.toString.call(message.seconds) : options.longs === Number ? new $util.LongBits(message.seconds.low >>> 0, message.seconds.high >>> 0).toNumber() : message.seconds;
                if (message.nanos != null && message.hasOwnProperty("nanos"))
                    object.nanos = message.nanos;
                return object;
            };

            /**
             * Converts this Timestamp to JSON.
             * @function toJSON
             * @memberof proto.gradido.Timestamp
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            Timestamp.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            return Timestamp;
        })();

        gradido.TimestampSeconds = (function() {

            /**
             * Properties of a TimestampSeconds.
             * @memberof proto.gradido
             * @interface ITimestampSeconds
             * @property {number|Long|null} [seconds] TimestampSeconds seconds
             */

            /**
             * Constructs a new TimestampSeconds.
             * @memberof proto.gradido
             * @classdesc Represents a TimestampSeconds.
             * @implements ITimestampSeconds
             * @constructor
             * @param {proto.gradido.ITimestampSeconds=} [properties] Properties to set
             */
            function TimestampSeconds(properties) {
                if (properties)
                    for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * TimestampSeconds seconds.
             * @member {number|Long} seconds
             * @memberof proto.gradido.TimestampSeconds
             * @instance
             */
            TimestampSeconds.prototype.seconds = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

            /**
             * Creates a new TimestampSeconds instance using the specified properties.
             * @function create
             * @memberof proto.gradido.TimestampSeconds
             * @static
             * @param {proto.gradido.ITimestampSeconds=} [properties] Properties to set
             * @returns {proto.gradido.TimestampSeconds} TimestampSeconds instance
             */
            TimestampSeconds.create = function create(properties) {
                return new TimestampSeconds(properties);
            };

            /**
             * Encodes the specified TimestampSeconds message. Does not implicitly {@link proto.gradido.TimestampSeconds.verify|verify} messages.
             * @function encode
             * @memberof proto.gradido.TimestampSeconds
             * @static
             * @param {proto.gradido.ITimestampSeconds} message TimestampSeconds message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            TimestampSeconds.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.seconds != null && Object.hasOwnProperty.call(message, "seconds"))
                    writer.uint32(/* id 1, wireType 0 =*/8).int64(message.seconds);
                return writer;
            };

            /**
             * Encodes the specified TimestampSeconds message, length delimited. Does not implicitly {@link proto.gradido.TimestampSeconds.verify|verify} messages.
             * @function encodeDelimited
             * @memberof proto.gradido.TimestampSeconds
             * @static
             * @param {proto.gradido.ITimestampSeconds} message TimestampSeconds message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            TimestampSeconds.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes a TimestampSeconds message from the specified reader or buffer.
             * @function decode
             * @memberof proto.gradido.TimestampSeconds
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {proto.gradido.TimestampSeconds} TimestampSeconds
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            TimestampSeconds.decode = function decode(reader, length) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                var end = length === undefined ? reader.len : reader.pos + length, message = new $root.proto.gradido.TimestampSeconds();
                while (reader.pos < end) {
                    var tag = reader.uint32();
                    switch (tag >>> 3) {
                    case 1:
                        message.seconds = reader.int64();
                        break;
                    default:
                        reader.skipType(tag & 7);
                        break;
                    }
                }
                return message;
            };

            /**
             * Decodes a TimestampSeconds message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof proto.gradido.TimestampSeconds
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {proto.gradido.TimestampSeconds} TimestampSeconds
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            TimestampSeconds.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a TimestampSeconds message.
             * @function verify
             * @memberof proto.gradido.TimestampSeconds
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            TimestampSeconds.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (message.seconds != null && message.hasOwnProperty("seconds"))
                    if (!$util.isInteger(message.seconds) && !(message.seconds && $util.isInteger(message.seconds.low) && $util.isInteger(message.seconds.high)))
                        return "seconds: integer|Long expected";
                return null;
            };

            /**
             * Creates a TimestampSeconds message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof proto.gradido.TimestampSeconds
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {proto.gradido.TimestampSeconds} TimestampSeconds
             */
            TimestampSeconds.fromObject = function fromObject(object) {
                if (object instanceof $root.proto.gradido.TimestampSeconds)
                    return object;
                var message = new $root.proto.gradido.TimestampSeconds();
                if (object.seconds != null)
                    if ($util.Long)
                        (message.seconds = $util.Long.fromValue(object.seconds)).unsigned = false;
                    else if (typeof object.seconds === "string")
                        message.seconds = parseInt(object.seconds, 10);
                    else if (typeof object.seconds === "number")
                        message.seconds = object.seconds;
                    else if (typeof object.seconds === "object")
                        message.seconds = new $util.LongBits(object.seconds.low >>> 0, object.seconds.high >>> 0).toNumber();
                return message;
            };

            /**
             * Creates a plain object from a TimestampSeconds message. Also converts values to other types if specified.
             * @function toObject
             * @memberof proto.gradido.TimestampSeconds
             * @static
             * @param {proto.gradido.TimestampSeconds} message TimestampSeconds
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            TimestampSeconds.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                var object = {};
                if (options.defaults)
                    if ($util.Long) {
                        var long = new $util.Long(0, 0, false);
                        object.seconds = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
                    } else
                        object.seconds = options.longs === String ? "0" : 0;
                if (message.seconds != null && message.hasOwnProperty("seconds"))
                    if (typeof message.seconds === "number")
                        object.seconds = options.longs === String ? String(message.seconds) : message.seconds;
                    else
                        object.seconds = options.longs === String ? $util.Long.prototype.toString.call(message.seconds) : options.longs === Number ? new $util.LongBits(message.seconds.low >>> 0, message.seconds.high >>> 0).toNumber() : message.seconds;
                return object;
            };

            /**
             * Converts this TimestampSeconds to JSON.
             * @function toJSON
             * @memberof proto.gradido.TimestampSeconds
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            TimestampSeconds.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            return TimestampSeconds;
        })();

        gradido.TransferAmount = (function() {

            /**
             * Properties of a TransferAmount.
             * @memberof proto.gradido
             * @interface ITransferAmount
             * @property {Uint8Array|null} [pubkey] TransferAmount pubkey
             * @property {number|Long|null} [amount] TransferAmount amount
             */

            /**
             * Constructs a new TransferAmount.
             * @memberof proto.gradido
             * @classdesc Represents a TransferAmount.
             * @implements ITransferAmount
             * @constructor
             * @param {proto.gradido.ITransferAmount=} [properties] Properties to set
             */
            function TransferAmount(properties) {
                if (properties)
                    for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * TransferAmount pubkey.
             * @member {Uint8Array} pubkey
             * @memberof proto.gradido.TransferAmount
             * @instance
             */
            TransferAmount.prototype.pubkey = $util.newBuffer([]);

            /**
             * TransferAmount amount.
             * @member {number|Long} amount
             * @memberof proto.gradido.TransferAmount
             * @instance
             */
            TransferAmount.prototype.amount = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

            /**
             * Creates a new TransferAmount instance using the specified properties.
             * @function create
             * @memberof proto.gradido.TransferAmount
             * @static
             * @param {proto.gradido.ITransferAmount=} [properties] Properties to set
             * @returns {proto.gradido.TransferAmount} TransferAmount instance
             */
            TransferAmount.create = function create(properties) {
                return new TransferAmount(properties);
            };

            /**
             * Encodes the specified TransferAmount message. Does not implicitly {@link proto.gradido.TransferAmount.verify|verify} messages.
             * @function encode
             * @memberof proto.gradido.TransferAmount
             * @static
             * @param {proto.gradido.ITransferAmount} message TransferAmount message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            TransferAmount.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.pubkey != null && Object.hasOwnProperty.call(message, "pubkey"))
                    writer.uint32(/* id 1, wireType 2 =*/10).bytes(message.pubkey);
                if (message.amount != null && Object.hasOwnProperty.call(message, "amount"))
                    writer.uint32(/* id 2, wireType 0 =*/16).sint64(message.amount);
                return writer;
            };

            /**
             * Encodes the specified TransferAmount message, length delimited. Does not implicitly {@link proto.gradido.TransferAmount.verify|verify} messages.
             * @function encodeDelimited
             * @memberof proto.gradido.TransferAmount
             * @static
             * @param {proto.gradido.ITransferAmount} message TransferAmount message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            TransferAmount.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes a TransferAmount message from the specified reader or buffer.
             * @function decode
             * @memberof proto.gradido.TransferAmount
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {proto.gradido.TransferAmount} TransferAmount
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            TransferAmount.decode = function decode(reader, length) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                var end = length === undefined ? reader.len : reader.pos + length, message = new $root.proto.gradido.TransferAmount();
                while (reader.pos < end) {
                    var tag = reader.uint32();
                    switch (tag >>> 3) {
                    case 1:
                        message.pubkey = reader.bytes();
                        break;
                    case 2:
                        message.amount = reader.sint64();
                        break;
                    default:
                        reader.skipType(tag & 7);
                        break;
                    }
                }
                return message;
            };

            /**
             * Decodes a TransferAmount message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof proto.gradido.TransferAmount
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {proto.gradido.TransferAmount} TransferAmount
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            TransferAmount.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a TransferAmount message.
             * @function verify
             * @memberof proto.gradido.TransferAmount
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            TransferAmount.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (message.pubkey != null && message.hasOwnProperty("pubkey"))
                    if (!(message.pubkey && typeof message.pubkey.length === "number" || $util.isString(message.pubkey)))
                        return "pubkey: buffer expected";
                if (message.amount != null && message.hasOwnProperty("amount"))
                    if (!$util.isInteger(message.amount) && !(message.amount && $util.isInteger(message.amount.low) && $util.isInteger(message.amount.high)))
                        return "amount: integer|Long expected";
                return null;
            };

            /**
             * Creates a TransferAmount message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof proto.gradido.TransferAmount
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {proto.gradido.TransferAmount} TransferAmount
             */
            TransferAmount.fromObject = function fromObject(object) {
                if (object instanceof $root.proto.gradido.TransferAmount)
                    return object;
                var message = new $root.proto.gradido.TransferAmount();
                if (object.pubkey != null)
                    if (typeof object.pubkey === "string")
                        $util.base64.decode(object.pubkey, message.pubkey = $util.newBuffer($util.base64.length(object.pubkey)), 0);
                    else if (object.pubkey.length)
                        message.pubkey = object.pubkey;
                if (object.amount != null)
                    if ($util.Long)
                        (message.amount = $util.Long.fromValue(object.amount)).unsigned = false;
                    else if (typeof object.amount === "string")
                        message.amount = parseInt(object.amount, 10);
                    else if (typeof object.amount === "number")
                        message.amount = object.amount;
                    else if (typeof object.amount === "object")
                        message.amount = new $util.LongBits(object.amount.low >>> 0, object.amount.high >>> 0).toNumber();
                return message;
            };

            /**
             * Creates a plain object from a TransferAmount message. Also converts values to other types if specified.
             * @function toObject
             * @memberof proto.gradido.TransferAmount
             * @static
             * @param {proto.gradido.TransferAmount} message TransferAmount
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            TransferAmount.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                var object = {};
                if (options.defaults) {
                    if (options.bytes === String)
                        object.pubkey = "";
                    else {
                        object.pubkey = [];
                        if (options.bytes !== Array)
                            object.pubkey = $util.newBuffer(object.pubkey);
                    }
                    if ($util.Long) {
                        var long = new $util.Long(0, 0, false);
                        object.amount = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
                    } else
                        object.amount = options.longs === String ? "0" : 0;
                }
                if (message.pubkey != null && message.hasOwnProperty("pubkey"))
                    object.pubkey = options.bytes === String ? $util.base64.encode(message.pubkey, 0, message.pubkey.length) : options.bytes === Array ? Array.prototype.slice.call(message.pubkey) : message.pubkey;
                if (message.amount != null && message.hasOwnProperty("amount"))
                    if (typeof message.amount === "number")
                        object.amount = options.longs === String ? String(message.amount) : message.amount;
                    else
                        object.amount = options.longs === String ? $util.Long.prototype.toString.call(message.amount) : options.longs === Number ? new $util.LongBits(message.amount.low >>> 0, message.amount.high >>> 0).toNumber() : message.amount;
                return object;
            };

            /**
             * Converts this TransferAmount to JSON.
             * @function toJSON
             * @memberof proto.gradido.TransferAmount
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            TransferAmount.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            return TransferAmount;
        })();

        gradido.HederaID = (function() {

            /**
             * Properties of a HederaID.
             * @memberof proto.gradido
             * @interface IHederaID
             * @property {number|Long|null} [shardNum] HederaID shardNum
             * @property {number|Long|null} [realmNum] HederaID realmNum
             * @property {number|Long|null} [topicNum] HederaID topicNum
             */

            /**
             * Constructs a new HederaID.
             * @memberof proto.gradido
             * @classdesc Represents a HederaID.
             * @implements IHederaID
             * @constructor
             * @param {proto.gradido.IHederaID=} [properties] Properties to set
             */
            function HederaID(properties) {
                if (properties)
                    for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * HederaID shardNum.
             * @member {number|Long} shardNum
             * @memberof proto.gradido.HederaID
             * @instance
             */
            HederaID.prototype.shardNum = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

            /**
             * HederaID realmNum.
             * @member {number|Long} realmNum
             * @memberof proto.gradido.HederaID
             * @instance
             */
            HederaID.prototype.realmNum = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

            /**
             * HederaID topicNum.
             * @member {number|Long} topicNum
             * @memberof proto.gradido.HederaID
             * @instance
             */
            HederaID.prototype.topicNum = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

            /**
             * Creates a new HederaID instance using the specified properties.
             * @function create
             * @memberof proto.gradido.HederaID
             * @static
             * @param {proto.gradido.IHederaID=} [properties] Properties to set
             * @returns {proto.gradido.HederaID} HederaID instance
             */
            HederaID.create = function create(properties) {
                return new HederaID(properties);
            };

            /**
             * Encodes the specified HederaID message. Does not implicitly {@link proto.gradido.HederaID.verify|verify} messages.
             * @function encode
             * @memberof proto.gradido.HederaID
             * @static
             * @param {proto.gradido.IHederaID} message HederaID message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            HederaID.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.shardNum != null && Object.hasOwnProperty.call(message, "shardNum"))
                    writer.uint32(/* id 1, wireType 0 =*/8).int64(message.shardNum);
                if (message.realmNum != null && Object.hasOwnProperty.call(message, "realmNum"))
                    writer.uint32(/* id 2, wireType 0 =*/16).int64(message.realmNum);
                if (message.topicNum != null && Object.hasOwnProperty.call(message, "topicNum"))
                    writer.uint32(/* id 3, wireType 0 =*/24).int64(message.topicNum);
                return writer;
            };

            /**
             * Encodes the specified HederaID message, length delimited. Does not implicitly {@link proto.gradido.HederaID.verify|verify} messages.
             * @function encodeDelimited
             * @memberof proto.gradido.HederaID
             * @static
             * @param {proto.gradido.IHederaID} message HederaID message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            HederaID.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes a HederaID message from the specified reader or buffer.
             * @function decode
             * @memberof proto.gradido.HederaID
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {proto.gradido.HederaID} HederaID
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            HederaID.decode = function decode(reader, length) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                var end = length === undefined ? reader.len : reader.pos + length, message = new $root.proto.gradido.HederaID();
                while (reader.pos < end) {
                    var tag = reader.uint32();
                    switch (tag >>> 3) {
                    case 1:
                        message.shardNum = reader.int64();
                        break;
                    case 2:
                        message.realmNum = reader.int64();
                        break;
                    case 3:
                        message.topicNum = reader.int64();
                        break;
                    default:
                        reader.skipType(tag & 7);
                        break;
                    }
                }
                return message;
            };

            /**
             * Decodes a HederaID message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof proto.gradido.HederaID
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {proto.gradido.HederaID} HederaID
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            HederaID.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a HederaID message.
             * @function verify
             * @memberof proto.gradido.HederaID
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            HederaID.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (message.shardNum != null && message.hasOwnProperty("shardNum"))
                    if (!$util.isInteger(message.shardNum) && !(message.shardNum && $util.isInteger(message.shardNum.low) && $util.isInteger(message.shardNum.high)))
                        return "shardNum: integer|Long expected";
                if (message.realmNum != null && message.hasOwnProperty("realmNum"))
                    if (!$util.isInteger(message.realmNum) && !(message.realmNum && $util.isInteger(message.realmNum.low) && $util.isInteger(message.realmNum.high)))
                        return "realmNum: integer|Long expected";
                if (message.topicNum != null && message.hasOwnProperty("topicNum"))
                    if (!$util.isInteger(message.topicNum) && !(message.topicNum && $util.isInteger(message.topicNum.low) && $util.isInteger(message.topicNum.high)))
                        return "topicNum: integer|Long expected";
                return null;
            };

            /**
             * Creates a HederaID message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof proto.gradido.HederaID
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {proto.gradido.HederaID} HederaID
             */
            HederaID.fromObject = function fromObject(object) {
                if (object instanceof $root.proto.gradido.HederaID)
                    return object;
                var message = new $root.proto.gradido.HederaID();
                if (object.shardNum != null)
                    if ($util.Long)
                        (message.shardNum = $util.Long.fromValue(object.shardNum)).unsigned = false;
                    else if (typeof object.shardNum === "string")
                        message.shardNum = parseInt(object.shardNum, 10);
                    else if (typeof object.shardNum === "number")
                        message.shardNum = object.shardNum;
                    else if (typeof object.shardNum === "object")
                        message.shardNum = new $util.LongBits(object.shardNum.low >>> 0, object.shardNum.high >>> 0).toNumber();
                if (object.realmNum != null)
                    if ($util.Long)
                        (message.realmNum = $util.Long.fromValue(object.realmNum)).unsigned = false;
                    else if (typeof object.realmNum === "string")
                        message.realmNum = parseInt(object.realmNum, 10);
                    else if (typeof object.realmNum === "number")
                        message.realmNum = object.realmNum;
                    else if (typeof object.realmNum === "object")
                        message.realmNum = new $util.LongBits(object.realmNum.low >>> 0, object.realmNum.high >>> 0).toNumber();
                if (object.topicNum != null)
                    if ($util.Long)
                        (message.topicNum = $util.Long.fromValue(object.topicNum)).unsigned = false;
                    else if (typeof object.topicNum === "string")
                        message.topicNum = parseInt(object.topicNum, 10);
                    else if (typeof object.topicNum === "number")
                        message.topicNum = object.topicNum;
                    else if (typeof object.topicNum === "object")
                        message.topicNum = new $util.LongBits(object.topicNum.low >>> 0, object.topicNum.high >>> 0).toNumber();
                return message;
            };

            /**
             * Creates a plain object from a HederaID message. Also converts values to other types if specified.
             * @function toObject
             * @memberof proto.gradido.HederaID
             * @static
             * @param {proto.gradido.HederaID} message HederaID
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            HederaID.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                var object = {};
                if (options.defaults) {
                    if ($util.Long) {
                        var long = new $util.Long(0, 0, false);
                        object.shardNum = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
                    } else
                        object.shardNum = options.longs === String ? "0" : 0;
                    if ($util.Long) {
                        var long = new $util.Long(0, 0, false);
                        object.realmNum = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
                    } else
                        object.realmNum = options.longs === String ? "0" : 0;
                    if ($util.Long) {
                        var long = new $util.Long(0, 0, false);
                        object.topicNum = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
                    } else
                        object.topicNum = options.longs === String ? "0" : 0;
                }
                if (message.shardNum != null && message.hasOwnProperty("shardNum"))
                    if (typeof message.shardNum === "number")
                        object.shardNum = options.longs === String ? String(message.shardNum) : message.shardNum;
                    else
                        object.shardNum = options.longs === String ? $util.Long.prototype.toString.call(message.shardNum) : options.longs === Number ? new $util.LongBits(message.shardNum.low >>> 0, message.shardNum.high >>> 0).toNumber() : message.shardNum;
                if (message.realmNum != null && message.hasOwnProperty("realmNum"))
                    if (typeof message.realmNum === "number")
                        object.realmNum = options.longs === String ? String(message.realmNum) : message.realmNum;
                    else
                        object.realmNum = options.longs === String ? $util.Long.prototype.toString.call(message.realmNum) : options.longs === Number ? new $util.LongBits(message.realmNum.low >>> 0, message.realmNum.high >>> 0).toNumber() : message.realmNum;
                if (message.topicNum != null && message.hasOwnProperty("topicNum"))
                    if (typeof message.topicNum === "number")
                        object.topicNum = options.longs === String ? String(message.topicNum) : message.topicNum;
                    else
                        object.topicNum = options.longs === String ? $util.Long.prototype.toString.call(message.topicNum) : options.longs === Number ? new $util.LongBits(message.topicNum.low >>> 0, message.topicNum.high >>> 0).toNumber() : message.topicNum;
                return object;
            };

            /**
             * Converts this HederaID to JSON.
             * @function toJSON
             * @memberof proto.gradido.HederaID
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            HederaID.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            return HederaID;
        })();

        gradido.GradidoCreation = (function() {

            /**
             * Properties of a GradidoCreation.
             * @memberof proto.gradido
             * @interface IGradidoCreation
             * @property {proto.gradido.ITransferAmount|null} [receiver] GradidoCreation receiver
             * @property {proto.gradido.ITimestampSeconds|null} [targetDate] GradidoCreation targetDate
             */

            /**
             * Constructs a new GradidoCreation.
             * @memberof proto.gradido
             * @classdesc Represents a GradidoCreation.
             * @implements IGradidoCreation
             * @constructor
             * @param {proto.gradido.IGradidoCreation=} [properties] Properties to set
             */
            function GradidoCreation(properties) {
                if (properties)
                    for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * GradidoCreation receiver.
             * @member {proto.gradido.ITransferAmount|null|undefined} receiver
             * @memberof proto.gradido.GradidoCreation
             * @instance
             */
            GradidoCreation.prototype.receiver = null;

            /**
             * GradidoCreation targetDate.
             * @member {proto.gradido.ITimestampSeconds|null|undefined} targetDate
             * @memberof proto.gradido.GradidoCreation
             * @instance
             */
            GradidoCreation.prototype.targetDate = null;

            /**
             * Creates a new GradidoCreation instance using the specified properties.
             * @function create
             * @memberof proto.gradido.GradidoCreation
             * @static
             * @param {proto.gradido.IGradidoCreation=} [properties] Properties to set
             * @returns {proto.gradido.GradidoCreation} GradidoCreation instance
             */
            GradidoCreation.create = function create(properties) {
                return new GradidoCreation(properties);
            };

            /**
             * Encodes the specified GradidoCreation message. Does not implicitly {@link proto.gradido.GradidoCreation.verify|verify} messages.
             * @function encode
             * @memberof proto.gradido.GradidoCreation
             * @static
             * @param {proto.gradido.IGradidoCreation} message GradidoCreation message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            GradidoCreation.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.receiver != null && Object.hasOwnProperty.call(message, "receiver"))
                    $root.proto.gradido.TransferAmount.encode(message.receiver, writer.uint32(/* id 1, wireType 2 =*/10).fork()).ldelim();
                if (message.targetDate != null && Object.hasOwnProperty.call(message, "targetDate"))
                    $root.proto.gradido.TimestampSeconds.encode(message.targetDate, writer.uint32(/* id 3, wireType 2 =*/26).fork()).ldelim();
                return writer;
            };

            /**
             * Encodes the specified GradidoCreation message, length delimited. Does not implicitly {@link proto.gradido.GradidoCreation.verify|verify} messages.
             * @function encodeDelimited
             * @memberof proto.gradido.GradidoCreation
             * @static
             * @param {proto.gradido.IGradidoCreation} message GradidoCreation message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            GradidoCreation.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes a GradidoCreation message from the specified reader or buffer.
             * @function decode
             * @memberof proto.gradido.GradidoCreation
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {proto.gradido.GradidoCreation} GradidoCreation
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            GradidoCreation.decode = function decode(reader, length) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                var end = length === undefined ? reader.len : reader.pos + length, message = new $root.proto.gradido.GradidoCreation();
                while (reader.pos < end) {
                    var tag = reader.uint32();
                    switch (tag >>> 3) {
                    case 1:
                        message.receiver = $root.proto.gradido.TransferAmount.decode(reader, reader.uint32());
                        break;
                    case 3:
                        message.targetDate = $root.proto.gradido.TimestampSeconds.decode(reader, reader.uint32());
                        break;
                    default:
                        reader.skipType(tag & 7);
                        break;
                    }
                }
                return message;
            };

            /**
             * Decodes a GradidoCreation message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof proto.gradido.GradidoCreation
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {proto.gradido.GradidoCreation} GradidoCreation
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            GradidoCreation.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a GradidoCreation message.
             * @function verify
             * @memberof proto.gradido.GradidoCreation
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            GradidoCreation.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (message.receiver != null && message.hasOwnProperty("receiver")) {
                    var error = $root.proto.gradido.TransferAmount.verify(message.receiver);
                    if (error)
                        return "receiver." + error;
                }
                if (message.targetDate != null && message.hasOwnProperty("targetDate")) {
                    var error = $root.proto.gradido.TimestampSeconds.verify(message.targetDate);
                    if (error)
                        return "targetDate." + error;
                }
                return null;
            };

            /**
             * Creates a GradidoCreation message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof proto.gradido.GradidoCreation
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {proto.gradido.GradidoCreation} GradidoCreation
             */
            GradidoCreation.fromObject = function fromObject(object) {
                if (object instanceof $root.proto.gradido.GradidoCreation)
                    return object;
                var message = new $root.proto.gradido.GradidoCreation();
                if (object.receiver != null) {
                    if (typeof object.receiver !== "object")
                        throw TypeError(".proto.gradido.GradidoCreation.receiver: object expected");
                    message.receiver = $root.proto.gradido.TransferAmount.fromObject(object.receiver);
                }
                if (object.targetDate != null) {
                    if (typeof object.targetDate !== "object")
                        throw TypeError(".proto.gradido.GradidoCreation.targetDate: object expected");
                    message.targetDate = $root.proto.gradido.TimestampSeconds.fromObject(object.targetDate);
                }
                return message;
            };

            /**
             * Creates a plain object from a GradidoCreation message. Also converts values to other types if specified.
             * @function toObject
             * @memberof proto.gradido.GradidoCreation
             * @static
             * @param {proto.gradido.GradidoCreation} message GradidoCreation
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            GradidoCreation.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                var object = {};
                if (options.defaults) {
                    object.receiver = null;
                    object.targetDate = null;
                }
                if (message.receiver != null && message.hasOwnProperty("receiver"))
                    object.receiver = $root.proto.gradido.TransferAmount.toObject(message.receiver, options);
                if (message.targetDate != null && message.hasOwnProperty("targetDate"))
                    object.targetDate = $root.proto.gradido.TimestampSeconds.toObject(message.targetDate, options);
                return object;
            };

            /**
             * Converts this GradidoCreation to JSON.
             * @function toJSON
             * @memberof proto.gradido.GradidoCreation
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            GradidoCreation.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            return GradidoCreation;
        })();

        gradido.GradidoTransaction = (function() {

            /**
             * Properties of a GradidoTransaction.
             * @memberof proto.gradido
             * @interface IGradidoTransaction
             * @property {proto.gradido.ISignatureMap|null} [sigMap] GradidoTransaction sigMap
             * @property {Uint8Array|null} [bodyBytes] GradidoTransaction bodyBytes
             */

            /**
             * Constructs a new GradidoTransaction.
             * @memberof proto.gradido
             * @classdesc Represents a GradidoTransaction.
             * @implements IGradidoTransaction
             * @constructor
             * @param {proto.gradido.IGradidoTransaction=} [properties] Properties to set
             */
            function GradidoTransaction(properties) {
                if (properties)
                    for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * GradidoTransaction sigMap.
             * @member {proto.gradido.ISignatureMap|null|undefined} sigMap
             * @memberof proto.gradido.GradidoTransaction
             * @instance
             */
            GradidoTransaction.prototype.sigMap = null;

            /**
             * GradidoTransaction bodyBytes.
             * @member {Uint8Array} bodyBytes
             * @memberof proto.gradido.GradidoTransaction
             * @instance
             */
            GradidoTransaction.prototype.bodyBytes = $util.newBuffer([]);

            /**
             * Creates a new GradidoTransaction instance using the specified properties.
             * @function create
             * @memberof proto.gradido.GradidoTransaction
             * @static
             * @param {proto.gradido.IGradidoTransaction=} [properties] Properties to set
             * @returns {proto.gradido.GradidoTransaction} GradidoTransaction instance
             */
            GradidoTransaction.create = function create(properties) {
                return new GradidoTransaction(properties);
            };

            /**
             * Encodes the specified GradidoTransaction message. Does not implicitly {@link proto.gradido.GradidoTransaction.verify|verify} messages.
             * @function encode
             * @memberof proto.gradido.GradidoTransaction
             * @static
             * @param {proto.gradido.IGradidoTransaction} message GradidoTransaction message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            GradidoTransaction.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.sigMap != null && Object.hasOwnProperty.call(message, "sigMap"))
                    $root.proto.gradido.SignatureMap.encode(message.sigMap, writer.uint32(/* id 1, wireType 2 =*/10).fork()).ldelim();
                if (message.bodyBytes != null && Object.hasOwnProperty.call(message, "bodyBytes"))
                    writer.uint32(/* id 2, wireType 2 =*/18).bytes(message.bodyBytes);
                return writer;
            };

            /**
             * Encodes the specified GradidoTransaction message, length delimited. Does not implicitly {@link proto.gradido.GradidoTransaction.verify|verify} messages.
             * @function encodeDelimited
             * @memberof proto.gradido.GradidoTransaction
             * @static
             * @param {proto.gradido.IGradidoTransaction} message GradidoTransaction message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            GradidoTransaction.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes a GradidoTransaction message from the specified reader or buffer.
             * @function decode
             * @memberof proto.gradido.GradidoTransaction
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {proto.gradido.GradidoTransaction} GradidoTransaction
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            GradidoTransaction.decode = function decode(reader, length) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                var end = length === undefined ? reader.len : reader.pos + length, message = new $root.proto.gradido.GradidoTransaction();
                while (reader.pos < end) {
                    var tag = reader.uint32();
                    switch (tag >>> 3) {
                    case 1:
                        message.sigMap = $root.proto.gradido.SignatureMap.decode(reader, reader.uint32());
                        break;
                    case 2:
                        message.bodyBytes = reader.bytes();
                        break;
                    default:
                        reader.skipType(tag & 7);
                        break;
                    }
                }
                return message;
            };

            /**
             * Decodes a GradidoTransaction message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof proto.gradido.GradidoTransaction
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {proto.gradido.GradidoTransaction} GradidoTransaction
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            GradidoTransaction.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a GradidoTransaction message.
             * @function verify
             * @memberof proto.gradido.GradidoTransaction
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            GradidoTransaction.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (message.sigMap != null && message.hasOwnProperty("sigMap")) {
                    var error = $root.proto.gradido.SignatureMap.verify(message.sigMap);
                    if (error)
                        return "sigMap." + error;
                }
                if (message.bodyBytes != null && message.hasOwnProperty("bodyBytes"))
                    if (!(message.bodyBytes && typeof message.bodyBytes.length === "number" || $util.isString(message.bodyBytes)))
                        return "bodyBytes: buffer expected";
                return null;
            };

            /**
             * Creates a GradidoTransaction message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof proto.gradido.GradidoTransaction
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {proto.gradido.GradidoTransaction} GradidoTransaction
             */
            GradidoTransaction.fromObject = function fromObject(object) {
                if (object instanceof $root.proto.gradido.GradidoTransaction)
                    return object;
                var message = new $root.proto.gradido.GradidoTransaction();
                if (object.sigMap != null) {
                    if (typeof object.sigMap !== "object")
                        throw TypeError(".proto.gradido.GradidoTransaction.sigMap: object expected");
                    message.sigMap = $root.proto.gradido.SignatureMap.fromObject(object.sigMap);
                }
                if (object.bodyBytes != null)
                    if (typeof object.bodyBytes === "string")
                        $util.base64.decode(object.bodyBytes, message.bodyBytes = $util.newBuffer($util.base64.length(object.bodyBytes)), 0);
                    else if (object.bodyBytes.length)
                        message.bodyBytes = object.bodyBytes;
                return message;
            };

            /**
             * Creates a plain object from a GradidoTransaction message. Also converts values to other types if specified.
             * @function toObject
             * @memberof proto.gradido.GradidoTransaction
             * @static
             * @param {proto.gradido.GradidoTransaction} message GradidoTransaction
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            GradidoTransaction.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                var object = {};
                if (options.defaults) {
                    object.sigMap = null;
                    if (options.bytes === String)
                        object.bodyBytes = "";
                    else {
                        object.bodyBytes = [];
                        if (options.bytes !== Array)
                            object.bodyBytes = $util.newBuffer(object.bodyBytes);
                    }
                }
                if (message.sigMap != null && message.hasOwnProperty("sigMap"))
                    object.sigMap = $root.proto.gradido.SignatureMap.toObject(message.sigMap, options);
                if (message.bodyBytes != null && message.hasOwnProperty("bodyBytes"))
                    object.bodyBytes = options.bytes === String ? $util.base64.encode(message.bodyBytes, 0, message.bodyBytes.length) : options.bytes === Array ? Array.prototype.slice.call(message.bodyBytes) : message.bodyBytes;
                return object;
            };

            /**
             * Converts this GradidoTransaction to JSON.
             * @function toJSON
             * @memberof proto.gradido.GradidoTransaction
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            GradidoTransaction.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            return GradidoTransaction;
        })();

        gradido.LocalTransfer = (function() {

            /**
             * Properties of a LocalTransfer.
             * @memberof proto.gradido
             * @interface ILocalTransfer
             * @property {proto.gradido.ITransferAmount|null} [sender] LocalTransfer sender
             * @property {Uint8Array|null} [receiver] LocalTransfer receiver
             */

            /**
             * Constructs a new LocalTransfer.
             * @memberof proto.gradido
             * @classdesc Represents a LocalTransfer.
             * @implements ILocalTransfer
             * @constructor
             * @param {proto.gradido.ILocalTransfer=} [properties] Properties to set
             */
            function LocalTransfer(properties) {
                if (properties)
                    for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * LocalTransfer sender.
             * @member {proto.gradido.ITransferAmount|null|undefined} sender
             * @memberof proto.gradido.LocalTransfer
             * @instance
             */
            LocalTransfer.prototype.sender = null;

            /**
             * LocalTransfer receiver.
             * @member {Uint8Array} receiver
             * @memberof proto.gradido.LocalTransfer
             * @instance
             */
            LocalTransfer.prototype.receiver = $util.newBuffer([]);

            /**
             * Creates a new LocalTransfer instance using the specified properties.
             * @function create
             * @memberof proto.gradido.LocalTransfer
             * @static
             * @param {proto.gradido.ILocalTransfer=} [properties] Properties to set
             * @returns {proto.gradido.LocalTransfer} LocalTransfer instance
             */
            LocalTransfer.create = function create(properties) {
                return new LocalTransfer(properties);
            };

            /**
             * Encodes the specified LocalTransfer message. Does not implicitly {@link proto.gradido.LocalTransfer.verify|verify} messages.
             * @function encode
             * @memberof proto.gradido.LocalTransfer
             * @static
             * @param {proto.gradido.ILocalTransfer} message LocalTransfer message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            LocalTransfer.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.sender != null && Object.hasOwnProperty.call(message, "sender"))
                    $root.proto.gradido.TransferAmount.encode(message.sender, writer.uint32(/* id 1, wireType 2 =*/10).fork()).ldelim();
                if (message.receiver != null && Object.hasOwnProperty.call(message, "receiver"))
                    writer.uint32(/* id 2, wireType 2 =*/18).bytes(message.receiver);
                return writer;
            };

            /**
             * Encodes the specified LocalTransfer message, length delimited. Does not implicitly {@link proto.gradido.LocalTransfer.verify|verify} messages.
             * @function encodeDelimited
             * @memberof proto.gradido.LocalTransfer
             * @static
             * @param {proto.gradido.ILocalTransfer} message LocalTransfer message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            LocalTransfer.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes a LocalTransfer message from the specified reader or buffer.
             * @function decode
             * @memberof proto.gradido.LocalTransfer
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {proto.gradido.LocalTransfer} LocalTransfer
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            LocalTransfer.decode = function decode(reader, length) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                var end = length === undefined ? reader.len : reader.pos + length, message = new $root.proto.gradido.LocalTransfer();
                while (reader.pos < end) {
                    var tag = reader.uint32();
                    switch (tag >>> 3) {
                    case 1:
                        message.sender = $root.proto.gradido.TransferAmount.decode(reader, reader.uint32());
                        break;
                    case 2:
                        message.receiver = reader.bytes();
                        break;
                    default:
                        reader.skipType(tag & 7);
                        break;
                    }
                }
                return message;
            };

            /**
             * Decodes a LocalTransfer message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof proto.gradido.LocalTransfer
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {proto.gradido.LocalTransfer} LocalTransfer
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            LocalTransfer.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a LocalTransfer message.
             * @function verify
             * @memberof proto.gradido.LocalTransfer
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            LocalTransfer.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (message.sender != null && message.hasOwnProperty("sender")) {
                    var error = $root.proto.gradido.TransferAmount.verify(message.sender);
                    if (error)
                        return "sender." + error;
                }
                if (message.receiver != null && message.hasOwnProperty("receiver"))
                    if (!(message.receiver && typeof message.receiver.length === "number" || $util.isString(message.receiver)))
                        return "receiver: buffer expected";
                return null;
            };

            /**
             * Creates a LocalTransfer message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof proto.gradido.LocalTransfer
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {proto.gradido.LocalTransfer} LocalTransfer
             */
            LocalTransfer.fromObject = function fromObject(object) {
                if (object instanceof $root.proto.gradido.LocalTransfer)
                    return object;
                var message = new $root.proto.gradido.LocalTransfer();
                if (object.sender != null) {
                    if (typeof object.sender !== "object")
                        throw TypeError(".proto.gradido.LocalTransfer.sender: object expected");
                    message.sender = $root.proto.gradido.TransferAmount.fromObject(object.sender);
                }
                if (object.receiver != null)
                    if (typeof object.receiver === "string")
                        $util.base64.decode(object.receiver, message.receiver = $util.newBuffer($util.base64.length(object.receiver)), 0);
                    else if (object.receiver.length)
                        message.receiver = object.receiver;
                return message;
            };

            /**
             * Creates a plain object from a LocalTransfer message. Also converts values to other types if specified.
             * @function toObject
             * @memberof proto.gradido.LocalTransfer
             * @static
             * @param {proto.gradido.LocalTransfer} message LocalTransfer
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            LocalTransfer.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                var object = {};
                if (options.defaults) {
                    object.sender = null;
                    if (options.bytes === String)
                        object.receiver = "";
                    else {
                        object.receiver = [];
                        if (options.bytes !== Array)
                            object.receiver = $util.newBuffer(object.receiver);
                    }
                }
                if (message.sender != null && message.hasOwnProperty("sender"))
                    object.sender = $root.proto.gradido.TransferAmount.toObject(message.sender, options);
                if (message.receiver != null && message.hasOwnProperty("receiver"))
                    object.receiver = options.bytes === String ? $util.base64.encode(message.receiver, 0, message.receiver.length) : options.bytes === Array ? Array.prototype.slice.call(message.receiver) : message.receiver;
                return object;
            };

            /**
             * Converts this LocalTransfer to JSON.
             * @function toJSON
             * @memberof proto.gradido.LocalTransfer
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            LocalTransfer.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            return LocalTransfer;
        })();

        gradido.CrossGroupTransfer = (function() {

            /**
             * Properties of a CrossGroupTransfer.
             * @memberof proto.gradido
             * @interface ICrossGroupTransfer
             * @property {proto.gradido.ITransferAmount|null} [sender] CrossGroupTransfer sender
             * @property {Uint8Array|null} [receiver] CrossGroupTransfer receiver
             * @property {string|null} [otherGroup] CrossGroupTransfer otherGroup
             * @property {proto.gradido.ITimestamp|null} [pairedTransactionId] CrossGroupTransfer pairedTransactionId
             */

            /**
             * Constructs a new CrossGroupTransfer.
             * @memberof proto.gradido
             * @classdesc Represents a CrossGroupTransfer.
             * @implements ICrossGroupTransfer
             * @constructor
             * @param {proto.gradido.ICrossGroupTransfer=} [properties] Properties to set
             */
            function CrossGroupTransfer(properties) {
                if (properties)
                    for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * CrossGroupTransfer sender.
             * @member {proto.gradido.ITransferAmount|null|undefined} sender
             * @memberof proto.gradido.CrossGroupTransfer
             * @instance
             */
            CrossGroupTransfer.prototype.sender = null;

            /**
             * CrossGroupTransfer receiver.
             * @member {Uint8Array} receiver
             * @memberof proto.gradido.CrossGroupTransfer
             * @instance
             */
            CrossGroupTransfer.prototype.receiver = $util.newBuffer([]);

            /**
             * CrossGroupTransfer otherGroup.
             * @member {string} otherGroup
             * @memberof proto.gradido.CrossGroupTransfer
             * @instance
             */
            CrossGroupTransfer.prototype.otherGroup = "";

            /**
             * CrossGroupTransfer pairedTransactionId.
             * @member {proto.gradido.ITimestamp|null|undefined} pairedTransactionId
             * @memberof proto.gradido.CrossGroupTransfer
             * @instance
             */
            CrossGroupTransfer.prototype.pairedTransactionId = null;

            /**
             * Creates a new CrossGroupTransfer instance using the specified properties.
             * @function create
             * @memberof proto.gradido.CrossGroupTransfer
             * @static
             * @param {proto.gradido.ICrossGroupTransfer=} [properties] Properties to set
             * @returns {proto.gradido.CrossGroupTransfer} CrossGroupTransfer instance
             */
            CrossGroupTransfer.create = function create(properties) {
                return new CrossGroupTransfer(properties);
            };

            /**
             * Encodes the specified CrossGroupTransfer message. Does not implicitly {@link proto.gradido.CrossGroupTransfer.verify|verify} messages.
             * @function encode
             * @memberof proto.gradido.CrossGroupTransfer
             * @static
             * @param {proto.gradido.ICrossGroupTransfer} message CrossGroupTransfer message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            CrossGroupTransfer.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.sender != null && Object.hasOwnProperty.call(message, "sender"))
                    $root.proto.gradido.TransferAmount.encode(message.sender, writer.uint32(/* id 1, wireType 2 =*/10).fork()).ldelim();
                if (message.receiver != null && Object.hasOwnProperty.call(message, "receiver"))
                    writer.uint32(/* id 2, wireType 2 =*/18).bytes(message.receiver);
                if (message.otherGroup != null && Object.hasOwnProperty.call(message, "otherGroup"))
                    writer.uint32(/* id 3, wireType 2 =*/26).string(message.otherGroup);
                if (message.pairedTransactionId != null && Object.hasOwnProperty.call(message, "pairedTransactionId"))
                    $root.proto.gradido.Timestamp.encode(message.pairedTransactionId, writer.uint32(/* id 4, wireType 2 =*/34).fork()).ldelim();
                return writer;
            };

            /**
             * Encodes the specified CrossGroupTransfer message, length delimited. Does not implicitly {@link proto.gradido.CrossGroupTransfer.verify|verify} messages.
             * @function encodeDelimited
             * @memberof proto.gradido.CrossGroupTransfer
             * @static
             * @param {proto.gradido.ICrossGroupTransfer} message CrossGroupTransfer message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            CrossGroupTransfer.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes a CrossGroupTransfer message from the specified reader or buffer.
             * @function decode
             * @memberof proto.gradido.CrossGroupTransfer
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {proto.gradido.CrossGroupTransfer} CrossGroupTransfer
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            CrossGroupTransfer.decode = function decode(reader, length) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                var end = length === undefined ? reader.len : reader.pos + length, message = new $root.proto.gradido.CrossGroupTransfer();
                while (reader.pos < end) {
                    var tag = reader.uint32();
                    switch (tag >>> 3) {
                    case 1:
                        message.sender = $root.proto.gradido.TransferAmount.decode(reader, reader.uint32());
                        break;
                    case 2:
                        message.receiver = reader.bytes();
                        break;
                    case 3:
                        message.otherGroup = reader.string();
                        break;
                    case 4:
                        message.pairedTransactionId = $root.proto.gradido.Timestamp.decode(reader, reader.uint32());
                        break;
                    default:
                        reader.skipType(tag & 7);
                        break;
                    }
                }
                return message;
            };

            /**
             * Decodes a CrossGroupTransfer message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof proto.gradido.CrossGroupTransfer
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {proto.gradido.CrossGroupTransfer} CrossGroupTransfer
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            CrossGroupTransfer.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a CrossGroupTransfer message.
             * @function verify
             * @memberof proto.gradido.CrossGroupTransfer
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            CrossGroupTransfer.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (message.sender != null && message.hasOwnProperty("sender")) {
                    var error = $root.proto.gradido.TransferAmount.verify(message.sender);
                    if (error)
                        return "sender." + error;
                }
                if (message.receiver != null && message.hasOwnProperty("receiver"))
                    if (!(message.receiver && typeof message.receiver.length === "number" || $util.isString(message.receiver)))
                        return "receiver: buffer expected";
                if (message.otherGroup != null && message.hasOwnProperty("otherGroup"))
                    if (!$util.isString(message.otherGroup))
                        return "otherGroup: string expected";
                if (message.pairedTransactionId != null && message.hasOwnProperty("pairedTransactionId")) {
                    var error = $root.proto.gradido.Timestamp.verify(message.pairedTransactionId);
                    if (error)
                        return "pairedTransactionId." + error;
                }
                return null;
            };

            /**
             * Creates a CrossGroupTransfer message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof proto.gradido.CrossGroupTransfer
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {proto.gradido.CrossGroupTransfer} CrossGroupTransfer
             */
            CrossGroupTransfer.fromObject = function fromObject(object) {
                if (object instanceof $root.proto.gradido.CrossGroupTransfer)
                    return object;
                var message = new $root.proto.gradido.CrossGroupTransfer();
                if (object.sender != null) {
                    if (typeof object.sender !== "object")
                        throw TypeError(".proto.gradido.CrossGroupTransfer.sender: object expected");
                    message.sender = $root.proto.gradido.TransferAmount.fromObject(object.sender);
                }
                if (object.receiver != null)
                    if (typeof object.receiver === "string")
                        $util.base64.decode(object.receiver, message.receiver = $util.newBuffer($util.base64.length(object.receiver)), 0);
                    else if (object.receiver.length)
                        message.receiver = object.receiver;
                if (object.otherGroup != null)
                    message.otherGroup = String(object.otherGroup);
                if (object.pairedTransactionId != null) {
                    if (typeof object.pairedTransactionId !== "object")
                        throw TypeError(".proto.gradido.CrossGroupTransfer.pairedTransactionId: object expected");
                    message.pairedTransactionId = $root.proto.gradido.Timestamp.fromObject(object.pairedTransactionId);
                }
                return message;
            };

            /**
             * Creates a plain object from a CrossGroupTransfer message. Also converts values to other types if specified.
             * @function toObject
             * @memberof proto.gradido.CrossGroupTransfer
             * @static
             * @param {proto.gradido.CrossGroupTransfer} message CrossGroupTransfer
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            CrossGroupTransfer.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                var object = {};
                if (options.defaults) {
                    object.sender = null;
                    if (options.bytes === String)
                        object.receiver = "";
                    else {
                        object.receiver = [];
                        if (options.bytes !== Array)
                            object.receiver = $util.newBuffer(object.receiver);
                    }
                    object.otherGroup = "";
                    object.pairedTransactionId = null;
                }
                if (message.sender != null && message.hasOwnProperty("sender"))
                    object.sender = $root.proto.gradido.TransferAmount.toObject(message.sender, options);
                if (message.receiver != null && message.hasOwnProperty("receiver"))
                    object.receiver = options.bytes === String ? $util.base64.encode(message.receiver, 0, message.receiver.length) : options.bytes === Array ? Array.prototype.slice.call(message.receiver) : message.receiver;
                if (message.otherGroup != null && message.hasOwnProperty("otherGroup"))
                    object.otherGroup = message.otherGroup;
                if (message.pairedTransactionId != null && message.hasOwnProperty("pairedTransactionId"))
                    object.pairedTransactionId = $root.proto.gradido.Timestamp.toObject(message.pairedTransactionId, options);
                return object;
            };

            /**
             * Converts this CrossGroupTransfer to JSON.
             * @function toJSON
             * @memberof proto.gradido.CrossGroupTransfer
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            CrossGroupTransfer.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            return CrossGroupTransfer;
        })();

        gradido.GradidoTransfer = (function() {

            /**
             * Properties of a GradidoTransfer.
             * @memberof proto.gradido
             * @interface IGradidoTransfer
             * @property {proto.gradido.ILocalTransfer|null} [local] GradidoTransfer local
             * @property {proto.gradido.ICrossGroupTransfer|null} [inbound] GradidoTransfer inbound
             * @property {proto.gradido.ICrossGroupTransfer|null} [outbound] GradidoTransfer outbound
             */

            /**
             * Constructs a new GradidoTransfer.
             * @memberof proto.gradido
             * @classdesc Represents a GradidoTransfer.
             * @implements IGradidoTransfer
             * @constructor
             * @param {proto.gradido.IGradidoTransfer=} [properties] Properties to set
             */
            function GradidoTransfer(properties) {
                if (properties)
                    for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * GradidoTransfer local.
             * @member {proto.gradido.ILocalTransfer|null|undefined} local
             * @memberof proto.gradido.GradidoTransfer
             * @instance
             */
            GradidoTransfer.prototype.local = null;

            /**
             * GradidoTransfer inbound.
             * @member {proto.gradido.ICrossGroupTransfer|null|undefined} inbound
             * @memberof proto.gradido.GradidoTransfer
             * @instance
             */
            GradidoTransfer.prototype.inbound = null;

            /**
             * GradidoTransfer outbound.
             * @member {proto.gradido.ICrossGroupTransfer|null|undefined} outbound
             * @memberof proto.gradido.GradidoTransfer
             * @instance
             */
            GradidoTransfer.prototype.outbound = null;

            // OneOf field names bound to virtual getters and setters
            var $oneOfFields;

            /**
             * GradidoTransfer data.
             * @member {"local"|"inbound"|"outbound"|undefined} data
             * @memberof proto.gradido.GradidoTransfer
             * @instance
             */
            Object.defineProperty(GradidoTransfer.prototype, "data", {
                get: $util.oneOfGetter($oneOfFields = ["local", "inbound", "outbound"]),
                set: $util.oneOfSetter($oneOfFields)
            });

            /**
             * Creates a new GradidoTransfer instance using the specified properties.
             * @function create
             * @memberof proto.gradido.GradidoTransfer
             * @static
             * @param {proto.gradido.IGradidoTransfer=} [properties] Properties to set
             * @returns {proto.gradido.GradidoTransfer} GradidoTransfer instance
             */
            GradidoTransfer.create = function create(properties) {
                return new GradidoTransfer(properties);
            };

            /**
             * Encodes the specified GradidoTransfer message. Does not implicitly {@link proto.gradido.GradidoTransfer.verify|verify} messages.
             * @function encode
             * @memberof proto.gradido.GradidoTransfer
             * @static
             * @param {proto.gradido.IGradidoTransfer} message GradidoTransfer message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            GradidoTransfer.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.local != null && Object.hasOwnProperty.call(message, "local"))
                    $root.proto.gradido.LocalTransfer.encode(message.local, writer.uint32(/* id 1, wireType 2 =*/10).fork()).ldelim();
                if (message.inbound != null && Object.hasOwnProperty.call(message, "inbound"))
                    $root.proto.gradido.CrossGroupTransfer.encode(message.inbound, writer.uint32(/* id 2, wireType 2 =*/18).fork()).ldelim();
                if (message.outbound != null && Object.hasOwnProperty.call(message, "outbound"))
                    $root.proto.gradido.CrossGroupTransfer.encode(message.outbound, writer.uint32(/* id 3, wireType 2 =*/26).fork()).ldelim();
                return writer;
            };

            /**
             * Encodes the specified GradidoTransfer message, length delimited. Does not implicitly {@link proto.gradido.GradidoTransfer.verify|verify} messages.
             * @function encodeDelimited
             * @memberof proto.gradido.GradidoTransfer
             * @static
             * @param {proto.gradido.IGradidoTransfer} message GradidoTransfer message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            GradidoTransfer.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes a GradidoTransfer message from the specified reader or buffer.
             * @function decode
             * @memberof proto.gradido.GradidoTransfer
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {proto.gradido.GradidoTransfer} GradidoTransfer
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            GradidoTransfer.decode = function decode(reader, length) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                var end = length === undefined ? reader.len : reader.pos + length, message = new $root.proto.gradido.GradidoTransfer();
                while (reader.pos < end) {
                    var tag = reader.uint32();
                    switch (tag >>> 3) {
                    case 1:
                        message.local = $root.proto.gradido.LocalTransfer.decode(reader, reader.uint32());
                        break;
                    case 2:
                        message.inbound = $root.proto.gradido.CrossGroupTransfer.decode(reader, reader.uint32());
                        break;
                    case 3:
                        message.outbound = $root.proto.gradido.CrossGroupTransfer.decode(reader, reader.uint32());
                        break;
                    default:
                        reader.skipType(tag & 7);
                        break;
                    }
                }
                return message;
            };

            /**
             * Decodes a GradidoTransfer message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof proto.gradido.GradidoTransfer
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {proto.gradido.GradidoTransfer} GradidoTransfer
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            GradidoTransfer.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a GradidoTransfer message.
             * @function verify
             * @memberof proto.gradido.GradidoTransfer
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            GradidoTransfer.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                var properties = {};
                if (message.local != null && message.hasOwnProperty("local")) {
                    properties.data = 1;
                    {
                        var error = $root.proto.gradido.LocalTransfer.verify(message.local);
                        if (error)
                            return "local." + error;
                    }
                }
                if (message.inbound != null && message.hasOwnProperty("inbound")) {
                    if (properties.data === 1)
                        return "data: multiple values";
                    properties.data = 1;
                    {
                        var error = $root.proto.gradido.CrossGroupTransfer.verify(message.inbound);
                        if (error)
                            return "inbound." + error;
                    }
                }
                if (message.outbound != null && message.hasOwnProperty("outbound")) {
                    if (properties.data === 1)
                        return "data: multiple values";
                    properties.data = 1;
                    {
                        var error = $root.proto.gradido.CrossGroupTransfer.verify(message.outbound);
                        if (error)
                            return "outbound." + error;
                    }
                }
                return null;
            };

            /**
             * Creates a GradidoTransfer message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof proto.gradido.GradidoTransfer
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {proto.gradido.GradidoTransfer} GradidoTransfer
             */
            GradidoTransfer.fromObject = function fromObject(object) {
                if (object instanceof $root.proto.gradido.GradidoTransfer)
                    return object;
                var message = new $root.proto.gradido.GradidoTransfer();
                if (object.local != null) {
                    if (typeof object.local !== "object")
                        throw TypeError(".proto.gradido.GradidoTransfer.local: object expected");
                    message.local = $root.proto.gradido.LocalTransfer.fromObject(object.local);
                }
                if (object.inbound != null) {
                    if (typeof object.inbound !== "object")
                        throw TypeError(".proto.gradido.GradidoTransfer.inbound: object expected");
                    message.inbound = $root.proto.gradido.CrossGroupTransfer.fromObject(object.inbound);
                }
                if (object.outbound != null) {
                    if (typeof object.outbound !== "object")
                        throw TypeError(".proto.gradido.GradidoTransfer.outbound: object expected");
                    message.outbound = $root.proto.gradido.CrossGroupTransfer.fromObject(object.outbound);
                }
                return message;
            };

            /**
             * Creates a plain object from a GradidoTransfer message. Also converts values to other types if specified.
             * @function toObject
             * @memberof proto.gradido.GradidoTransfer
             * @static
             * @param {proto.gradido.GradidoTransfer} message GradidoTransfer
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            GradidoTransfer.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                var object = {};
                if (message.local != null && message.hasOwnProperty("local")) {
                    object.local = $root.proto.gradido.LocalTransfer.toObject(message.local, options);
                    if (options.oneofs)
                        object.data = "local";
                }
                if (message.inbound != null && message.hasOwnProperty("inbound")) {
                    object.inbound = $root.proto.gradido.CrossGroupTransfer.toObject(message.inbound, options);
                    if (options.oneofs)
                        object.data = "inbound";
                }
                if (message.outbound != null && message.hasOwnProperty("outbound")) {
                    object.outbound = $root.proto.gradido.CrossGroupTransfer.toObject(message.outbound, options);
                    if (options.oneofs)
                        object.data = "outbound";
                }
                return object;
            };

            /**
             * Converts this GradidoTransfer to JSON.
             * @function toJSON
             * @memberof proto.gradido.GradidoTransfer
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            GradidoTransfer.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            return GradidoTransfer;
        })();

        gradido.GroupFriendsUpdate = (function() {

            /**
             * Properties of a GroupFriendsUpdate.
             * @memberof proto.gradido
             * @interface IGroupFriendsUpdate
             * @property {string|null} [group] GroupFriendsUpdate group
             * @property {proto.gradido.GroupFriendsUpdate.Action|null} [action] GroupFriendsUpdate action
             */

            /**
             * Constructs a new GroupFriendsUpdate.
             * @memberof proto.gradido
             * @classdesc Represents a GroupFriendsUpdate.
             * @implements IGroupFriendsUpdate
             * @constructor
             * @param {proto.gradido.IGroupFriendsUpdate=} [properties] Properties to set
             */
            function GroupFriendsUpdate(properties) {
                if (properties)
                    for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * GroupFriendsUpdate group.
             * @member {string} group
             * @memberof proto.gradido.GroupFriendsUpdate
             * @instance
             */
            GroupFriendsUpdate.prototype.group = "";

            /**
             * GroupFriendsUpdate action.
             * @member {proto.gradido.GroupFriendsUpdate.Action} action
             * @memberof proto.gradido.GroupFriendsUpdate
             * @instance
             */
            GroupFriendsUpdate.prototype.action = 0;

            /**
             * Creates a new GroupFriendsUpdate instance using the specified properties.
             * @function create
             * @memberof proto.gradido.GroupFriendsUpdate
             * @static
             * @param {proto.gradido.IGroupFriendsUpdate=} [properties] Properties to set
             * @returns {proto.gradido.GroupFriendsUpdate} GroupFriendsUpdate instance
             */
            GroupFriendsUpdate.create = function create(properties) {
                return new GroupFriendsUpdate(properties);
            };

            /**
             * Encodes the specified GroupFriendsUpdate message. Does not implicitly {@link proto.gradido.GroupFriendsUpdate.verify|verify} messages.
             * @function encode
             * @memberof proto.gradido.GroupFriendsUpdate
             * @static
             * @param {proto.gradido.IGroupFriendsUpdate} message GroupFriendsUpdate message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            GroupFriendsUpdate.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.group != null && Object.hasOwnProperty.call(message, "group"))
                    writer.uint32(/* id 1, wireType 2 =*/10).string(message.group);
                if (message.action != null && Object.hasOwnProperty.call(message, "action"))
                    writer.uint32(/* id 2, wireType 0 =*/16).int32(message.action);
                return writer;
            };

            /**
             * Encodes the specified GroupFriendsUpdate message, length delimited. Does not implicitly {@link proto.gradido.GroupFriendsUpdate.verify|verify} messages.
             * @function encodeDelimited
             * @memberof proto.gradido.GroupFriendsUpdate
             * @static
             * @param {proto.gradido.IGroupFriendsUpdate} message GroupFriendsUpdate message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            GroupFriendsUpdate.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes a GroupFriendsUpdate message from the specified reader or buffer.
             * @function decode
             * @memberof proto.gradido.GroupFriendsUpdate
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {proto.gradido.GroupFriendsUpdate} GroupFriendsUpdate
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            GroupFriendsUpdate.decode = function decode(reader, length) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                var end = length === undefined ? reader.len : reader.pos + length, message = new $root.proto.gradido.GroupFriendsUpdate();
                while (reader.pos < end) {
                    var tag = reader.uint32();
                    switch (tag >>> 3) {
                    case 1:
                        message.group = reader.string();
                        break;
                    case 2:
                        message.action = reader.int32();
                        break;
                    default:
                        reader.skipType(tag & 7);
                        break;
                    }
                }
                return message;
            };

            /**
             * Decodes a GroupFriendsUpdate message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof proto.gradido.GroupFriendsUpdate
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {proto.gradido.GroupFriendsUpdate} GroupFriendsUpdate
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            GroupFriendsUpdate.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a GroupFriendsUpdate message.
             * @function verify
             * @memberof proto.gradido.GroupFriendsUpdate
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            GroupFriendsUpdate.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (message.group != null && message.hasOwnProperty("group"))
                    if (!$util.isString(message.group))
                        return "group: string expected";
                if (message.action != null && message.hasOwnProperty("action"))
                    switch (message.action) {
                    default:
                        return "action: enum value expected";
                    case 0:
                    case 1:
                        break;
                    }
                return null;
            };

            /**
             * Creates a GroupFriendsUpdate message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof proto.gradido.GroupFriendsUpdate
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {proto.gradido.GroupFriendsUpdate} GroupFriendsUpdate
             */
            GroupFriendsUpdate.fromObject = function fromObject(object) {
                if (object instanceof $root.proto.gradido.GroupFriendsUpdate)
                    return object;
                var message = new $root.proto.gradido.GroupFriendsUpdate();
                if (object.group != null)
                    message.group = String(object.group);
                switch (object.action) {
                case "ADD_FRIEND":
                case 0:
                    message.action = 0;
                    break;
                case "REMOVE_FRIEND":
                case 1:
                    message.action = 1;
                    break;
                }
                return message;
            };

            /**
             * Creates a plain object from a GroupFriendsUpdate message. Also converts values to other types if specified.
             * @function toObject
             * @memberof proto.gradido.GroupFriendsUpdate
             * @static
             * @param {proto.gradido.GroupFriendsUpdate} message GroupFriendsUpdate
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            GroupFriendsUpdate.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                var object = {};
                if (options.defaults) {
                    object.group = "";
                    object.action = options.enums === String ? "ADD_FRIEND" : 0;
                }
                if (message.group != null && message.hasOwnProperty("group"))
                    object.group = message.group;
                if (message.action != null && message.hasOwnProperty("action"))
                    object.action = options.enums === String ? $root.proto.gradido.GroupFriendsUpdate.Action[message.action] : message.action;
                return object;
            };

            /**
             * Converts this GroupFriendsUpdate to JSON.
             * @function toJSON
             * @memberof proto.gradido.GroupFriendsUpdate
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            GroupFriendsUpdate.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Action enum.
             * @name proto.gradido.GroupFriendsUpdate.Action
             * @enum {number}
             * @property {number} ADD_FRIEND=0 ADD_FRIEND value
             * @property {number} REMOVE_FRIEND=1 REMOVE_FRIEND value
             */
            GroupFriendsUpdate.Action = (function() {
                var valuesById = {}, values = Object.create(valuesById);
                values[valuesById[0] = "ADD_FRIEND"] = 0;
                values[valuesById[1] = "REMOVE_FRIEND"] = 1;
                return values;
            })();

            return GroupFriendsUpdate;
        })();

        gradido.GroupMemberUpdate = (function() {

            /**
             * Properties of a GroupMemberUpdate.
             * @memberof proto.gradido
             * @interface IGroupMemberUpdate
             * @property {Uint8Array|null} [userPubkey] GroupMemberUpdate userPubkey
             * @property {proto.gradido.GroupMemberUpdate.MemberUpdateType|null} [memberUpdateType] GroupMemberUpdate memberUpdateType
             * @property {proto.gradido.ITimestamp|null} [pairedTransactionId] GroupMemberUpdate pairedTransactionId
             * @property {string|null} [targetGroup] GroupMemberUpdate targetGroup
             */

            /**
             * Constructs a new GroupMemberUpdate.
             * @memberof proto.gradido
             * @classdesc Represents a GroupMemberUpdate.
             * @implements IGroupMemberUpdate
             * @constructor
             * @param {proto.gradido.IGroupMemberUpdate=} [properties] Properties to set
             */
            function GroupMemberUpdate(properties) {
                if (properties)
                    for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * GroupMemberUpdate userPubkey.
             * @member {Uint8Array} userPubkey
             * @memberof proto.gradido.GroupMemberUpdate
             * @instance
             */
            GroupMemberUpdate.prototype.userPubkey = $util.newBuffer([]);

            /**
             * GroupMemberUpdate memberUpdateType.
             * @member {proto.gradido.GroupMemberUpdate.MemberUpdateType} memberUpdateType
             * @memberof proto.gradido.GroupMemberUpdate
             * @instance
             */
            GroupMemberUpdate.prototype.memberUpdateType = 0;

            /**
             * GroupMemberUpdate pairedTransactionId.
             * @member {proto.gradido.ITimestamp|null|undefined} pairedTransactionId
             * @memberof proto.gradido.GroupMemberUpdate
             * @instance
             */
            GroupMemberUpdate.prototype.pairedTransactionId = null;

            /**
             * GroupMemberUpdate targetGroup.
             * @member {string} targetGroup
             * @memberof proto.gradido.GroupMemberUpdate
             * @instance
             */
            GroupMemberUpdate.prototype.targetGroup = "";

            /**
             * Creates a new GroupMemberUpdate instance using the specified properties.
             * @function create
             * @memberof proto.gradido.GroupMemberUpdate
             * @static
             * @param {proto.gradido.IGroupMemberUpdate=} [properties] Properties to set
             * @returns {proto.gradido.GroupMemberUpdate} GroupMemberUpdate instance
             */
            GroupMemberUpdate.create = function create(properties) {
                return new GroupMemberUpdate(properties);
            };

            /**
             * Encodes the specified GroupMemberUpdate message. Does not implicitly {@link proto.gradido.GroupMemberUpdate.verify|verify} messages.
             * @function encode
             * @memberof proto.gradido.GroupMemberUpdate
             * @static
             * @param {proto.gradido.IGroupMemberUpdate} message GroupMemberUpdate message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            GroupMemberUpdate.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.userPubkey != null && Object.hasOwnProperty.call(message, "userPubkey"))
                    writer.uint32(/* id 1, wireType 2 =*/10).bytes(message.userPubkey);
                if (message.memberUpdateType != null && Object.hasOwnProperty.call(message, "memberUpdateType"))
                    writer.uint32(/* id 2, wireType 0 =*/16).int32(message.memberUpdateType);
                if (message.pairedTransactionId != null && Object.hasOwnProperty.call(message, "pairedTransactionId"))
                    $root.proto.gradido.Timestamp.encode(message.pairedTransactionId, writer.uint32(/* id 3, wireType 2 =*/26).fork()).ldelim();
                if (message.targetGroup != null && Object.hasOwnProperty.call(message, "targetGroup"))
                    writer.uint32(/* id 4, wireType 2 =*/34).string(message.targetGroup);
                return writer;
            };

            /**
             * Encodes the specified GroupMemberUpdate message, length delimited. Does not implicitly {@link proto.gradido.GroupMemberUpdate.verify|verify} messages.
             * @function encodeDelimited
             * @memberof proto.gradido.GroupMemberUpdate
             * @static
             * @param {proto.gradido.IGroupMemberUpdate} message GroupMemberUpdate message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            GroupMemberUpdate.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes a GroupMemberUpdate message from the specified reader or buffer.
             * @function decode
             * @memberof proto.gradido.GroupMemberUpdate
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {proto.gradido.GroupMemberUpdate} GroupMemberUpdate
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            GroupMemberUpdate.decode = function decode(reader, length) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                var end = length === undefined ? reader.len : reader.pos + length, message = new $root.proto.gradido.GroupMemberUpdate();
                while (reader.pos < end) {
                    var tag = reader.uint32();
                    switch (tag >>> 3) {
                    case 1:
                        message.userPubkey = reader.bytes();
                        break;
                    case 2:
                        message.memberUpdateType = reader.int32();
                        break;
                    case 3:
                        message.pairedTransactionId = $root.proto.gradido.Timestamp.decode(reader, reader.uint32());
                        break;
                    case 4:
                        message.targetGroup = reader.string();
                        break;
                    default:
                        reader.skipType(tag & 7);
                        break;
                    }
                }
                return message;
            };

            /**
             * Decodes a GroupMemberUpdate message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof proto.gradido.GroupMemberUpdate
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {proto.gradido.GroupMemberUpdate} GroupMemberUpdate
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            GroupMemberUpdate.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a GroupMemberUpdate message.
             * @function verify
             * @memberof proto.gradido.GroupMemberUpdate
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            GroupMemberUpdate.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (message.userPubkey != null && message.hasOwnProperty("userPubkey"))
                    if (!(message.userPubkey && typeof message.userPubkey.length === "number" || $util.isString(message.userPubkey)))
                        return "userPubkey: buffer expected";
                if (message.memberUpdateType != null && message.hasOwnProperty("memberUpdateType"))
                    switch (message.memberUpdateType) {
                    default:
                        return "memberUpdateType: enum value expected";
                    case 0:
                    case 1:
                    case 2:
                        break;
                    }
                if (message.pairedTransactionId != null && message.hasOwnProperty("pairedTransactionId")) {
                    var error = $root.proto.gradido.Timestamp.verify(message.pairedTransactionId);
                    if (error)
                        return "pairedTransactionId." + error;
                }
                if (message.targetGroup != null && message.hasOwnProperty("targetGroup"))
                    if (!$util.isString(message.targetGroup))
                        return "targetGroup: string expected";
                return null;
            };

            /**
             * Creates a GroupMemberUpdate message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof proto.gradido.GroupMemberUpdate
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {proto.gradido.GroupMemberUpdate} GroupMemberUpdate
             */
            GroupMemberUpdate.fromObject = function fromObject(object) {
                if (object instanceof $root.proto.gradido.GroupMemberUpdate)
                    return object;
                var message = new $root.proto.gradido.GroupMemberUpdate();
                if (object.userPubkey != null)
                    if (typeof object.userPubkey === "string")
                        $util.base64.decode(object.userPubkey, message.userPubkey = $util.newBuffer($util.base64.length(object.userPubkey)), 0);
                    else if (object.userPubkey.length)
                        message.userPubkey = object.userPubkey;
                switch (object.memberUpdateType) {
                case "ADD_USER":
                case 0:
                    message.memberUpdateType = 0;
                    break;
                case "MOVE_USER_INBOUND":
                case 1:
                    message.memberUpdateType = 1;
                    break;
                case "MOVE_USER_OUTBOUND":
                case 2:
                    message.memberUpdateType = 2;
                    break;
                }
                if (object.pairedTransactionId != null) {
                    if (typeof object.pairedTransactionId !== "object")
                        throw TypeError(".proto.gradido.GroupMemberUpdate.pairedTransactionId: object expected");
                    message.pairedTransactionId = $root.proto.gradido.Timestamp.fromObject(object.pairedTransactionId);
                }
                if (object.targetGroup != null)
                    message.targetGroup = String(object.targetGroup);
                return message;
            };

            /**
             * Creates a plain object from a GroupMemberUpdate message. Also converts values to other types if specified.
             * @function toObject
             * @memberof proto.gradido.GroupMemberUpdate
             * @static
             * @param {proto.gradido.GroupMemberUpdate} message GroupMemberUpdate
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            GroupMemberUpdate.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                var object = {};
                if (options.defaults) {
                    if (options.bytes === String)
                        object.userPubkey = "";
                    else {
                        object.userPubkey = [];
                        if (options.bytes !== Array)
                            object.userPubkey = $util.newBuffer(object.userPubkey);
                    }
                    object.memberUpdateType = options.enums === String ? "ADD_USER" : 0;
                    object.pairedTransactionId = null;
                    object.targetGroup = "";
                }
                if (message.userPubkey != null && message.hasOwnProperty("userPubkey"))
                    object.userPubkey = options.bytes === String ? $util.base64.encode(message.userPubkey, 0, message.userPubkey.length) : options.bytes === Array ? Array.prototype.slice.call(message.userPubkey) : message.userPubkey;
                if (message.memberUpdateType != null && message.hasOwnProperty("memberUpdateType"))
                    object.memberUpdateType = options.enums === String ? $root.proto.gradido.GroupMemberUpdate.MemberUpdateType[message.memberUpdateType] : message.memberUpdateType;
                if (message.pairedTransactionId != null && message.hasOwnProperty("pairedTransactionId"))
                    object.pairedTransactionId = $root.proto.gradido.Timestamp.toObject(message.pairedTransactionId, options);
                if (message.targetGroup != null && message.hasOwnProperty("targetGroup"))
                    object.targetGroup = message.targetGroup;
                return object;
            };

            /**
             * Converts this GroupMemberUpdate to JSON.
             * @function toJSON
             * @memberof proto.gradido.GroupMemberUpdate
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            GroupMemberUpdate.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * MemberUpdateType enum.
             * @name proto.gradido.GroupMemberUpdate.MemberUpdateType
             * @enum {number}
             * @property {number} ADD_USER=0 ADD_USER value
             * @property {number} MOVE_USER_INBOUND=1 MOVE_USER_INBOUND value
             * @property {number} MOVE_USER_OUTBOUND=2 MOVE_USER_OUTBOUND value
             */
            GroupMemberUpdate.MemberUpdateType = (function() {
                var valuesById = {}, values = Object.create(valuesById);
                values[valuesById[0] = "ADD_USER"] = 0;
                values[valuesById[1] = "MOVE_USER_INBOUND"] = 1;
                values[valuesById[2] = "MOVE_USER_OUTBOUND"] = 2;
                return values;
            })();

            return GroupMemberUpdate;
        })();

        gradido.ManageNodeBody = (function() {

            /**
             * Properties of a ManageNodeBody.
             * @memberof proto.gradido
             * @interface IManageNodeBody
             * @property {number|Long|null} [versionNumber] ManageNodeBody versionNumber
             * @property {proto.gradido.IManageNodeGroupAdd|null} [groupAdd] ManageNodeBody groupAdd
             */

            /**
             * Constructs a new ManageNodeBody.
             * @memberof proto.gradido
             * @classdesc Represents a ManageNodeBody.
             * @implements IManageNodeBody
             * @constructor
             * @param {proto.gradido.IManageNodeBody=} [properties] Properties to set
             */
            function ManageNodeBody(properties) {
                if (properties)
                    for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * ManageNodeBody versionNumber.
             * @member {number|Long} versionNumber
             * @memberof proto.gradido.ManageNodeBody
             * @instance
             */
            ManageNodeBody.prototype.versionNumber = $util.Long ? $util.Long.fromBits(0,0,true) : 0;

            /**
             * ManageNodeBody groupAdd.
             * @member {proto.gradido.IManageNodeGroupAdd|null|undefined} groupAdd
             * @memberof proto.gradido.ManageNodeBody
             * @instance
             */
            ManageNodeBody.prototype.groupAdd = null;

            // OneOf field names bound to virtual getters and setters
            var $oneOfFields;

            /**
             * ManageNodeBody data.
             * @member {"groupAdd"|undefined} data
             * @memberof proto.gradido.ManageNodeBody
             * @instance
             */
            Object.defineProperty(ManageNodeBody.prototype, "data", {
                get: $util.oneOfGetter($oneOfFields = ["groupAdd"]),
                set: $util.oneOfSetter($oneOfFields)
            });

            /**
             * Creates a new ManageNodeBody instance using the specified properties.
             * @function create
             * @memberof proto.gradido.ManageNodeBody
             * @static
             * @param {proto.gradido.IManageNodeBody=} [properties] Properties to set
             * @returns {proto.gradido.ManageNodeBody} ManageNodeBody instance
             */
            ManageNodeBody.create = function create(properties) {
                return new ManageNodeBody(properties);
            };

            /**
             * Encodes the specified ManageNodeBody message. Does not implicitly {@link proto.gradido.ManageNodeBody.verify|verify} messages.
             * @function encode
             * @memberof proto.gradido.ManageNodeBody
             * @static
             * @param {proto.gradido.IManageNodeBody} message ManageNodeBody message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            ManageNodeBody.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.versionNumber != null && Object.hasOwnProperty.call(message, "versionNumber"))
                    writer.uint32(/* id 1, wireType 0 =*/8).uint64(message.versionNumber);
                if (message.groupAdd != null && Object.hasOwnProperty.call(message, "groupAdd"))
                    $root.proto.gradido.ManageNodeGroupAdd.encode(message.groupAdd, writer.uint32(/* id 3, wireType 2 =*/26).fork()).ldelim();
                return writer;
            };

            /**
             * Encodes the specified ManageNodeBody message, length delimited. Does not implicitly {@link proto.gradido.ManageNodeBody.verify|verify} messages.
             * @function encodeDelimited
             * @memberof proto.gradido.ManageNodeBody
             * @static
             * @param {proto.gradido.IManageNodeBody} message ManageNodeBody message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            ManageNodeBody.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes a ManageNodeBody message from the specified reader or buffer.
             * @function decode
             * @memberof proto.gradido.ManageNodeBody
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {proto.gradido.ManageNodeBody} ManageNodeBody
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            ManageNodeBody.decode = function decode(reader, length) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                var end = length === undefined ? reader.len : reader.pos + length, message = new $root.proto.gradido.ManageNodeBody();
                while (reader.pos < end) {
                    var tag = reader.uint32();
                    switch (tag >>> 3) {
                    case 1:
                        message.versionNumber = reader.uint64();
                        break;
                    case 3:
                        message.groupAdd = $root.proto.gradido.ManageNodeGroupAdd.decode(reader, reader.uint32());
                        break;
                    default:
                        reader.skipType(tag & 7);
                        break;
                    }
                }
                return message;
            };

            /**
             * Decodes a ManageNodeBody message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof proto.gradido.ManageNodeBody
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {proto.gradido.ManageNodeBody} ManageNodeBody
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            ManageNodeBody.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a ManageNodeBody message.
             * @function verify
             * @memberof proto.gradido.ManageNodeBody
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            ManageNodeBody.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                var properties = {};
                if (message.versionNumber != null && message.hasOwnProperty("versionNumber"))
                    if (!$util.isInteger(message.versionNumber) && !(message.versionNumber && $util.isInteger(message.versionNumber.low) && $util.isInteger(message.versionNumber.high)))
                        return "versionNumber: integer|Long expected";
                if (message.groupAdd != null && message.hasOwnProperty("groupAdd")) {
                    properties.data = 1;
                    {
                        var error = $root.proto.gradido.ManageNodeGroupAdd.verify(message.groupAdd);
                        if (error)
                            return "groupAdd." + error;
                    }
                }
                return null;
            };

            /**
             * Creates a ManageNodeBody message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof proto.gradido.ManageNodeBody
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {proto.gradido.ManageNodeBody} ManageNodeBody
             */
            ManageNodeBody.fromObject = function fromObject(object) {
                if (object instanceof $root.proto.gradido.ManageNodeBody)
                    return object;
                var message = new $root.proto.gradido.ManageNodeBody();
                if (object.versionNumber != null)
                    if ($util.Long)
                        (message.versionNumber = $util.Long.fromValue(object.versionNumber)).unsigned = true;
                    else if (typeof object.versionNumber === "string")
                        message.versionNumber = parseInt(object.versionNumber, 10);
                    else if (typeof object.versionNumber === "number")
                        message.versionNumber = object.versionNumber;
                    else if (typeof object.versionNumber === "object")
                        message.versionNumber = new $util.LongBits(object.versionNumber.low >>> 0, object.versionNumber.high >>> 0).toNumber(true);
                if (object.groupAdd != null) {
                    if (typeof object.groupAdd !== "object")
                        throw TypeError(".proto.gradido.ManageNodeBody.groupAdd: object expected");
                    message.groupAdd = $root.proto.gradido.ManageNodeGroupAdd.fromObject(object.groupAdd);
                }
                return message;
            };

            /**
             * Creates a plain object from a ManageNodeBody message. Also converts values to other types if specified.
             * @function toObject
             * @memberof proto.gradido.ManageNodeBody
             * @static
             * @param {proto.gradido.ManageNodeBody} message ManageNodeBody
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            ManageNodeBody.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                var object = {};
                if (options.defaults)
                    if ($util.Long) {
                        var long = new $util.Long(0, 0, true);
                        object.versionNumber = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
                    } else
                        object.versionNumber = options.longs === String ? "0" : 0;
                if (message.versionNumber != null && message.hasOwnProperty("versionNumber"))
                    if (typeof message.versionNumber === "number")
                        object.versionNumber = options.longs === String ? String(message.versionNumber) : message.versionNumber;
                    else
                        object.versionNumber = options.longs === String ? $util.Long.prototype.toString.call(message.versionNumber) : options.longs === Number ? new $util.LongBits(message.versionNumber.low >>> 0, message.versionNumber.high >>> 0).toNumber(true) : message.versionNumber;
                if (message.groupAdd != null && message.hasOwnProperty("groupAdd")) {
                    object.groupAdd = $root.proto.gradido.ManageNodeGroupAdd.toObject(message.groupAdd, options);
                    if (options.oneofs)
                        object.data = "groupAdd";
                }
                return object;
            };

            /**
             * Converts this ManageNodeBody to JSON.
             * @function toJSON
             * @memberof proto.gradido.ManageNodeBody
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            ManageNodeBody.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            return ManageNodeBody;
        })();

        gradido.ManageNodeGroupAdd = (function() {

            /**
             * Properties of a ManageNodeGroupAdd.
             * @memberof proto.gradido
             * @interface IManageNodeGroupAdd
             * @property {string|null} [groupName] ManageNodeGroupAdd groupName
             * @property {string|null} [groupAlias] ManageNodeGroupAdd groupAlias
             * @property {proto.gradido.IHederaID|null} [hederaTopicId] ManageNodeGroupAdd hederaTopicId
             */

            /**
             * Constructs a new ManageNodeGroupAdd.
             * @memberof proto.gradido
             * @classdesc Represents a ManageNodeGroupAdd.
             * @implements IManageNodeGroupAdd
             * @constructor
             * @param {proto.gradido.IManageNodeGroupAdd=} [properties] Properties to set
             */
            function ManageNodeGroupAdd(properties) {
                if (properties)
                    for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * ManageNodeGroupAdd groupName.
             * @member {string} groupName
             * @memberof proto.gradido.ManageNodeGroupAdd
             * @instance
             */
            ManageNodeGroupAdd.prototype.groupName = "";

            /**
             * ManageNodeGroupAdd groupAlias.
             * @member {string} groupAlias
             * @memberof proto.gradido.ManageNodeGroupAdd
             * @instance
             */
            ManageNodeGroupAdd.prototype.groupAlias = "";

            /**
             * ManageNodeGroupAdd hederaTopicId.
             * @member {proto.gradido.IHederaID|null|undefined} hederaTopicId
             * @memberof proto.gradido.ManageNodeGroupAdd
             * @instance
             */
            ManageNodeGroupAdd.prototype.hederaTopicId = null;

            /**
             * Creates a new ManageNodeGroupAdd instance using the specified properties.
             * @function create
             * @memberof proto.gradido.ManageNodeGroupAdd
             * @static
             * @param {proto.gradido.IManageNodeGroupAdd=} [properties] Properties to set
             * @returns {proto.gradido.ManageNodeGroupAdd} ManageNodeGroupAdd instance
             */
            ManageNodeGroupAdd.create = function create(properties) {
                return new ManageNodeGroupAdd(properties);
            };

            /**
             * Encodes the specified ManageNodeGroupAdd message. Does not implicitly {@link proto.gradido.ManageNodeGroupAdd.verify|verify} messages.
             * @function encode
             * @memberof proto.gradido.ManageNodeGroupAdd
             * @static
             * @param {proto.gradido.IManageNodeGroupAdd} message ManageNodeGroupAdd message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            ManageNodeGroupAdd.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.groupName != null && Object.hasOwnProperty.call(message, "groupName"))
                    writer.uint32(/* id 1, wireType 2 =*/10).string(message.groupName);
                if (message.groupAlias != null && Object.hasOwnProperty.call(message, "groupAlias"))
                    writer.uint32(/* id 2, wireType 2 =*/18).string(message.groupAlias);
                if (message.hederaTopicId != null && Object.hasOwnProperty.call(message, "hederaTopicId"))
                    $root.proto.gradido.HederaID.encode(message.hederaTopicId, writer.uint32(/* id 3, wireType 2 =*/26).fork()).ldelim();
                return writer;
            };

            /**
             * Encodes the specified ManageNodeGroupAdd message, length delimited. Does not implicitly {@link proto.gradido.ManageNodeGroupAdd.verify|verify} messages.
             * @function encodeDelimited
             * @memberof proto.gradido.ManageNodeGroupAdd
             * @static
             * @param {proto.gradido.IManageNodeGroupAdd} message ManageNodeGroupAdd message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            ManageNodeGroupAdd.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes a ManageNodeGroupAdd message from the specified reader or buffer.
             * @function decode
             * @memberof proto.gradido.ManageNodeGroupAdd
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {proto.gradido.ManageNodeGroupAdd} ManageNodeGroupAdd
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            ManageNodeGroupAdd.decode = function decode(reader, length) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                var end = length === undefined ? reader.len : reader.pos + length, message = new $root.proto.gradido.ManageNodeGroupAdd();
                while (reader.pos < end) {
                    var tag = reader.uint32();
                    switch (tag >>> 3) {
                    case 1:
                        message.groupName = reader.string();
                        break;
                    case 2:
                        message.groupAlias = reader.string();
                        break;
                    case 3:
                        message.hederaTopicId = $root.proto.gradido.HederaID.decode(reader, reader.uint32());
                        break;
                    default:
                        reader.skipType(tag & 7);
                        break;
                    }
                }
                return message;
            };

            /**
             * Decodes a ManageNodeGroupAdd message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof proto.gradido.ManageNodeGroupAdd
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {proto.gradido.ManageNodeGroupAdd} ManageNodeGroupAdd
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            ManageNodeGroupAdd.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a ManageNodeGroupAdd message.
             * @function verify
             * @memberof proto.gradido.ManageNodeGroupAdd
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            ManageNodeGroupAdd.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (message.groupName != null && message.hasOwnProperty("groupName"))
                    if (!$util.isString(message.groupName))
                        return "groupName: string expected";
                if (message.groupAlias != null && message.hasOwnProperty("groupAlias"))
                    if (!$util.isString(message.groupAlias))
                        return "groupAlias: string expected";
                if (message.hederaTopicId != null && message.hasOwnProperty("hederaTopicId")) {
                    var error = $root.proto.gradido.HederaID.verify(message.hederaTopicId);
                    if (error)
                        return "hederaTopicId." + error;
                }
                return null;
            };

            /**
             * Creates a ManageNodeGroupAdd message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof proto.gradido.ManageNodeGroupAdd
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {proto.gradido.ManageNodeGroupAdd} ManageNodeGroupAdd
             */
            ManageNodeGroupAdd.fromObject = function fromObject(object) {
                if (object instanceof $root.proto.gradido.ManageNodeGroupAdd)
                    return object;
                var message = new $root.proto.gradido.ManageNodeGroupAdd();
                if (object.groupName != null)
                    message.groupName = String(object.groupName);
                if (object.groupAlias != null)
                    message.groupAlias = String(object.groupAlias);
                if (object.hederaTopicId != null) {
                    if (typeof object.hederaTopicId !== "object")
                        throw TypeError(".proto.gradido.ManageNodeGroupAdd.hederaTopicId: object expected");
                    message.hederaTopicId = $root.proto.gradido.HederaID.fromObject(object.hederaTopicId);
                }
                return message;
            };

            /**
             * Creates a plain object from a ManageNodeGroupAdd message. Also converts values to other types if specified.
             * @function toObject
             * @memberof proto.gradido.ManageNodeGroupAdd
             * @static
             * @param {proto.gradido.ManageNodeGroupAdd} message ManageNodeGroupAdd
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            ManageNodeGroupAdd.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                var object = {};
                if (options.defaults) {
                    object.groupName = "";
                    object.groupAlias = "";
                    object.hederaTopicId = null;
                }
                if (message.groupName != null && message.hasOwnProperty("groupName"))
                    object.groupName = message.groupName;
                if (message.groupAlias != null && message.hasOwnProperty("groupAlias"))
                    object.groupAlias = message.groupAlias;
                if (message.hederaTopicId != null && message.hasOwnProperty("hederaTopicId"))
                    object.hederaTopicId = $root.proto.gradido.HederaID.toObject(message.hederaTopicId, options);
                return object;
            };

            /**
             * Converts this ManageNodeGroupAdd to JSON.
             * @function toJSON
             * @memberof proto.gradido.ManageNodeGroupAdd
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            ManageNodeGroupAdd.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            return ManageNodeGroupAdd;
        })();

        gradido.ManageNodeRequest = (function() {

            /**
             * Properties of a ManageNodeRequest.
             * @memberof proto.gradido
             * @interface IManageNodeRequest
             * @property {proto.gradido.ISignatureMap|null} [sigMap] ManageNodeRequest sigMap
             * @property {Uint8Array|null} [bodyBytes] ManageNodeRequest bodyBytes
             */

            /**
             * Constructs a new ManageNodeRequest.
             * @memberof proto.gradido
             * @classdesc Represents a ManageNodeRequest.
             * @implements IManageNodeRequest
             * @constructor
             * @param {proto.gradido.IManageNodeRequest=} [properties] Properties to set
             */
            function ManageNodeRequest(properties) {
                if (properties)
                    for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * ManageNodeRequest sigMap.
             * @member {proto.gradido.ISignatureMap|null|undefined} sigMap
             * @memberof proto.gradido.ManageNodeRequest
             * @instance
             */
            ManageNodeRequest.prototype.sigMap = null;

            /**
             * ManageNodeRequest bodyBytes.
             * @member {Uint8Array} bodyBytes
             * @memberof proto.gradido.ManageNodeRequest
             * @instance
             */
            ManageNodeRequest.prototype.bodyBytes = $util.newBuffer([]);

            /**
             * Creates a new ManageNodeRequest instance using the specified properties.
             * @function create
             * @memberof proto.gradido.ManageNodeRequest
             * @static
             * @param {proto.gradido.IManageNodeRequest=} [properties] Properties to set
             * @returns {proto.gradido.ManageNodeRequest} ManageNodeRequest instance
             */
            ManageNodeRequest.create = function create(properties) {
                return new ManageNodeRequest(properties);
            };

            /**
             * Encodes the specified ManageNodeRequest message. Does not implicitly {@link proto.gradido.ManageNodeRequest.verify|verify} messages.
             * @function encode
             * @memberof proto.gradido.ManageNodeRequest
             * @static
             * @param {proto.gradido.IManageNodeRequest} message ManageNodeRequest message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            ManageNodeRequest.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.sigMap != null && Object.hasOwnProperty.call(message, "sigMap"))
                    $root.proto.gradido.SignatureMap.encode(message.sigMap, writer.uint32(/* id 1, wireType 2 =*/10).fork()).ldelim();
                if (message.bodyBytes != null && Object.hasOwnProperty.call(message, "bodyBytes"))
                    writer.uint32(/* id 2, wireType 2 =*/18).bytes(message.bodyBytes);
                return writer;
            };

            /**
             * Encodes the specified ManageNodeRequest message, length delimited. Does not implicitly {@link proto.gradido.ManageNodeRequest.verify|verify} messages.
             * @function encodeDelimited
             * @memberof proto.gradido.ManageNodeRequest
             * @static
             * @param {proto.gradido.IManageNodeRequest} message ManageNodeRequest message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            ManageNodeRequest.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes a ManageNodeRequest message from the specified reader or buffer.
             * @function decode
             * @memberof proto.gradido.ManageNodeRequest
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {proto.gradido.ManageNodeRequest} ManageNodeRequest
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            ManageNodeRequest.decode = function decode(reader, length) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                var end = length === undefined ? reader.len : reader.pos + length, message = new $root.proto.gradido.ManageNodeRequest();
                while (reader.pos < end) {
                    var tag = reader.uint32();
                    switch (tag >>> 3) {
                    case 1:
                        message.sigMap = $root.proto.gradido.SignatureMap.decode(reader, reader.uint32());
                        break;
                    case 2:
                        message.bodyBytes = reader.bytes();
                        break;
                    default:
                        reader.skipType(tag & 7);
                        break;
                    }
                }
                return message;
            };

            /**
             * Decodes a ManageNodeRequest message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof proto.gradido.ManageNodeRequest
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {proto.gradido.ManageNodeRequest} ManageNodeRequest
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            ManageNodeRequest.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a ManageNodeRequest message.
             * @function verify
             * @memberof proto.gradido.ManageNodeRequest
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            ManageNodeRequest.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (message.sigMap != null && message.hasOwnProperty("sigMap")) {
                    var error = $root.proto.gradido.SignatureMap.verify(message.sigMap);
                    if (error)
                        return "sigMap." + error;
                }
                if (message.bodyBytes != null && message.hasOwnProperty("bodyBytes"))
                    if (!(message.bodyBytes && typeof message.bodyBytes.length === "number" || $util.isString(message.bodyBytes)))
                        return "bodyBytes: buffer expected";
                return null;
            };

            /**
             * Creates a ManageNodeRequest message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof proto.gradido.ManageNodeRequest
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {proto.gradido.ManageNodeRequest} ManageNodeRequest
             */
            ManageNodeRequest.fromObject = function fromObject(object) {
                if (object instanceof $root.proto.gradido.ManageNodeRequest)
                    return object;
                var message = new $root.proto.gradido.ManageNodeRequest();
                if (object.sigMap != null) {
                    if (typeof object.sigMap !== "object")
                        throw TypeError(".proto.gradido.ManageNodeRequest.sigMap: object expected");
                    message.sigMap = $root.proto.gradido.SignatureMap.fromObject(object.sigMap);
                }
                if (object.bodyBytes != null)
                    if (typeof object.bodyBytes === "string")
                        $util.base64.decode(object.bodyBytes, message.bodyBytes = $util.newBuffer($util.base64.length(object.bodyBytes)), 0);
                    else if (object.bodyBytes.length)
                        message.bodyBytes = object.bodyBytes;
                return message;
            };

            /**
             * Creates a plain object from a ManageNodeRequest message. Also converts values to other types if specified.
             * @function toObject
             * @memberof proto.gradido.ManageNodeRequest
             * @static
             * @param {proto.gradido.ManageNodeRequest} message ManageNodeRequest
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            ManageNodeRequest.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                var object = {};
                if (options.defaults) {
                    object.sigMap = null;
                    if (options.bytes === String)
                        object.bodyBytes = "";
                    else {
                        object.bodyBytes = [];
                        if (options.bytes !== Array)
                            object.bodyBytes = $util.newBuffer(object.bodyBytes);
                    }
                }
                if (message.sigMap != null && message.hasOwnProperty("sigMap"))
                    object.sigMap = $root.proto.gradido.SignatureMap.toObject(message.sigMap, options);
                if (message.bodyBytes != null && message.hasOwnProperty("bodyBytes"))
                    object.bodyBytes = options.bytes === String ? $util.base64.encode(message.bodyBytes, 0, message.bodyBytes.length) : options.bytes === Array ? Array.prototype.slice.call(message.bodyBytes) : message.bodyBytes;
                return object;
            };

            /**
             * Converts this ManageNodeRequest to JSON.
             * @function toJSON
             * @memberof proto.gradido.ManageNodeRequest
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            ManageNodeRequest.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            return ManageNodeRequest;
        })();

        gradido.ManageNodeResponse = (function() {

            /**
             * Properties of a ManageNodeResponse.
             * @memberof proto.gradido
             * @interface IManageNodeResponse
             * @property {boolean|null} [success] ManageNodeResponse success
             * @property {proto.gradido.ManageNodeResponse.ErrorCode|null} [error] ManageNodeResponse error
             */

            /**
             * Constructs a new ManageNodeResponse.
             * @memberof proto.gradido
             * @classdesc Represents a ManageNodeResponse.
             * @implements IManageNodeResponse
             * @constructor
             * @param {proto.gradido.IManageNodeResponse=} [properties] Properties to set
             */
            function ManageNodeResponse(properties) {
                if (properties)
                    for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * ManageNodeResponse success.
             * @member {boolean} success
             * @memberof proto.gradido.ManageNodeResponse
             * @instance
             */
            ManageNodeResponse.prototype.success = false;

            /**
             * ManageNodeResponse error.
             * @member {proto.gradido.ManageNodeResponse.ErrorCode} error
             * @memberof proto.gradido.ManageNodeResponse
             * @instance
             */
            ManageNodeResponse.prototype.error = 0;

            /**
             * Creates a new ManageNodeResponse instance using the specified properties.
             * @function create
             * @memberof proto.gradido.ManageNodeResponse
             * @static
             * @param {proto.gradido.IManageNodeResponse=} [properties] Properties to set
             * @returns {proto.gradido.ManageNodeResponse} ManageNodeResponse instance
             */
            ManageNodeResponse.create = function create(properties) {
                return new ManageNodeResponse(properties);
            };

            /**
             * Encodes the specified ManageNodeResponse message. Does not implicitly {@link proto.gradido.ManageNodeResponse.verify|verify} messages.
             * @function encode
             * @memberof proto.gradido.ManageNodeResponse
             * @static
             * @param {proto.gradido.IManageNodeResponse} message ManageNodeResponse message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            ManageNodeResponse.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.success != null && Object.hasOwnProperty.call(message, "success"))
                    writer.uint32(/* id 1, wireType 0 =*/8).bool(message.success);
                if (message.error != null && Object.hasOwnProperty.call(message, "error"))
                    writer.uint32(/* id 2, wireType 0 =*/16).int32(message.error);
                return writer;
            };

            /**
             * Encodes the specified ManageNodeResponse message, length delimited. Does not implicitly {@link proto.gradido.ManageNodeResponse.verify|verify} messages.
             * @function encodeDelimited
             * @memberof proto.gradido.ManageNodeResponse
             * @static
             * @param {proto.gradido.IManageNodeResponse} message ManageNodeResponse message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            ManageNodeResponse.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes a ManageNodeResponse message from the specified reader or buffer.
             * @function decode
             * @memberof proto.gradido.ManageNodeResponse
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {proto.gradido.ManageNodeResponse} ManageNodeResponse
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            ManageNodeResponse.decode = function decode(reader, length) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                var end = length === undefined ? reader.len : reader.pos + length, message = new $root.proto.gradido.ManageNodeResponse();
                while (reader.pos < end) {
                    var tag = reader.uint32();
                    switch (tag >>> 3) {
                    case 1:
                        message.success = reader.bool();
                        break;
                    case 2:
                        message.error = reader.int32();
                        break;
                    default:
                        reader.skipType(tag & 7);
                        break;
                    }
                }
                return message;
            };

            /**
             * Decodes a ManageNodeResponse message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof proto.gradido.ManageNodeResponse
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {proto.gradido.ManageNodeResponse} ManageNodeResponse
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            ManageNodeResponse.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a ManageNodeResponse message.
             * @function verify
             * @memberof proto.gradido.ManageNodeResponse
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            ManageNodeResponse.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (message.success != null && message.hasOwnProperty("success"))
                    if (typeof message.success !== "boolean")
                        return "success: boolean expected";
                if (message.error != null && message.hasOwnProperty("error"))
                    switch (message.error) {
                    default:
                        return "error: enum value expected";
                    case 0:
                    case 1:
                    case 2:
                    case 3:
                        break;
                    }
                return null;
            };

            /**
             * Creates a ManageNodeResponse message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof proto.gradido.ManageNodeResponse
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {proto.gradido.ManageNodeResponse} ManageNodeResponse
             */
            ManageNodeResponse.fromObject = function fromObject(object) {
                if (object instanceof $root.proto.gradido.ManageNodeResponse)
                    return object;
                var message = new $root.proto.gradido.ManageNodeResponse();
                if (object.success != null)
                    message.success = Boolean(object.success);
                switch (object.error) {
                case "INVALID_BODY":
                case 0:
                    message.error = 0;
                    break;
                case "INVALID_SIGNATURE":
                case 1:
                    message.error = 1;
                    break;
                case "SIGNER_NOT_KNOWN":
                case 2:
                    message.error = 2;
                    break;
                case "GROUP_ALIAS_ALREADY_EXIST":
                case 3:
                    message.error = 3;
                    break;
                }
                return message;
            };

            /**
             * Creates a plain object from a ManageNodeResponse message. Also converts values to other types if specified.
             * @function toObject
             * @memberof proto.gradido.ManageNodeResponse
             * @static
             * @param {proto.gradido.ManageNodeResponse} message ManageNodeResponse
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            ManageNodeResponse.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                var object = {};
                if (options.defaults) {
                    object.success = false;
                    object.error = options.enums === String ? "INVALID_BODY" : 0;
                }
                if (message.success != null && message.hasOwnProperty("success"))
                    object.success = message.success;
                if (message.error != null && message.hasOwnProperty("error"))
                    object.error = options.enums === String ? $root.proto.gradido.ManageNodeResponse.ErrorCode[message.error] : message.error;
                return object;
            };

            /**
             * Converts this ManageNodeResponse to JSON.
             * @function toJSON
             * @memberof proto.gradido.ManageNodeResponse
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            ManageNodeResponse.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * ErrorCode enum.
             * @name proto.gradido.ManageNodeResponse.ErrorCode
             * @enum {number}
             * @property {number} INVALID_BODY=0 INVALID_BODY value
             * @property {number} INVALID_SIGNATURE=1 INVALID_SIGNATURE value
             * @property {number} SIGNER_NOT_KNOWN=2 SIGNER_NOT_KNOWN value
             * @property {number} GROUP_ALIAS_ALREADY_EXIST=3 GROUP_ALIAS_ALREADY_EXIST value
             */
            ManageNodeResponse.ErrorCode = (function() {
                var valuesById = {}, values = Object.create(valuesById);
                values[valuesById[0] = "INVALID_BODY"] = 0;
                values[valuesById[1] = "INVALID_SIGNATURE"] = 1;
                values[valuesById[2] = "SIGNER_NOT_KNOWN"] = 2;
                values[valuesById[3] = "GROUP_ALIAS_ALREADY_EXIST"] = 3;
                return values;
            })();

            return ManageNodeResponse;
        })();

        gradido.TransactionBody = (function() {

            /**
             * Properties of a TransactionBody.
             * @memberof proto.gradido
             * @interface ITransactionBody
             * @property {string|null} [memo] TransactionBody memo
             * @property {proto.gradido.ITimestampSeconds|null} [created] TransactionBody created
             * @property {number|Long|null} [versionNumber] TransactionBody versionNumber
             * @property {proto.gradido.IGradidoTransfer|null} [transfer] TransactionBody transfer
             * @property {proto.gradido.IGradidoCreation|null} [creation] TransactionBody creation
             * @property {proto.gradido.IGroupFriendsUpdate|null} [groupFriendsUpdate] TransactionBody groupFriendsUpdate
             * @property {proto.gradido.IGroupMemberUpdate|null} [groupMemberUpdate] TransactionBody groupMemberUpdate
             */

            /**
             * Constructs a new TransactionBody.
             * @memberof proto.gradido
             * @classdesc Represents a TransactionBody.
             * @implements ITransactionBody
             * @constructor
             * @param {proto.gradido.ITransactionBody=} [properties] Properties to set
             */
            function TransactionBody(properties) {
                if (properties)
                    for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * TransactionBody memo.
             * @member {string} memo
             * @memberof proto.gradido.TransactionBody
             * @instance
             */
            TransactionBody.prototype.memo = "";

            /**
             * TransactionBody created.
             * @member {proto.gradido.ITimestampSeconds|null|undefined} created
             * @memberof proto.gradido.TransactionBody
             * @instance
             */
            TransactionBody.prototype.created = null;

            /**
             * TransactionBody versionNumber.
             * @member {number|Long} versionNumber
             * @memberof proto.gradido.TransactionBody
             * @instance
             */
            TransactionBody.prototype.versionNumber = $util.Long ? $util.Long.fromBits(0,0,true) : 0;

            /**
             * TransactionBody transfer.
             * @member {proto.gradido.IGradidoTransfer|null|undefined} transfer
             * @memberof proto.gradido.TransactionBody
             * @instance
             */
            TransactionBody.prototype.transfer = null;

            /**
             * TransactionBody creation.
             * @member {proto.gradido.IGradidoCreation|null|undefined} creation
             * @memberof proto.gradido.TransactionBody
             * @instance
             */
            TransactionBody.prototype.creation = null;

            /**
             * TransactionBody groupFriendsUpdate.
             * @member {proto.gradido.IGroupFriendsUpdate|null|undefined} groupFriendsUpdate
             * @memberof proto.gradido.TransactionBody
             * @instance
             */
            TransactionBody.prototype.groupFriendsUpdate = null;

            /**
             * TransactionBody groupMemberUpdate.
             * @member {proto.gradido.IGroupMemberUpdate|null|undefined} groupMemberUpdate
             * @memberof proto.gradido.TransactionBody
             * @instance
             */
            TransactionBody.prototype.groupMemberUpdate = null;

            // OneOf field names bound to virtual getters and setters
            var $oneOfFields;

            /**
             * TransactionBody data.
             * @member {"transfer"|"creation"|"groupFriendsUpdate"|"groupMemberUpdate"|undefined} data
             * @memberof proto.gradido.TransactionBody
             * @instance
             */
            Object.defineProperty(TransactionBody.prototype, "data", {
                get: $util.oneOfGetter($oneOfFields = ["transfer", "creation", "groupFriendsUpdate", "groupMemberUpdate"]),
                set: $util.oneOfSetter($oneOfFields)
            });

            /**
             * Creates a new TransactionBody instance using the specified properties.
             * @function create
             * @memberof proto.gradido.TransactionBody
             * @static
             * @param {proto.gradido.ITransactionBody=} [properties] Properties to set
             * @returns {proto.gradido.TransactionBody} TransactionBody instance
             */
            TransactionBody.create = function create(properties) {
                return new TransactionBody(properties);
            };

            /**
             * Encodes the specified TransactionBody message. Does not implicitly {@link proto.gradido.TransactionBody.verify|verify} messages.
             * @function encode
             * @memberof proto.gradido.TransactionBody
             * @static
             * @param {proto.gradido.ITransactionBody} message TransactionBody message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            TransactionBody.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.memo != null && Object.hasOwnProperty.call(message, "memo"))
                    writer.uint32(/* id 1, wireType 2 =*/10).string(message.memo);
                if (message.created != null && Object.hasOwnProperty.call(message, "created"))
                    $root.proto.gradido.TimestampSeconds.encode(message.created, writer.uint32(/* id 2, wireType 2 =*/18).fork()).ldelim();
                if (message.versionNumber != null && Object.hasOwnProperty.call(message, "versionNumber"))
                    writer.uint32(/* id 3, wireType 0 =*/24).uint64(message.versionNumber);
                if (message.transfer != null && Object.hasOwnProperty.call(message, "transfer"))
                    $root.proto.gradido.GradidoTransfer.encode(message.transfer, writer.uint32(/* id 6, wireType 2 =*/50).fork()).ldelim();
                if (message.creation != null && Object.hasOwnProperty.call(message, "creation"))
                    $root.proto.gradido.GradidoCreation.encode(message.creation, writer.uint32(/* id 7, wireType 2 =*/58).fork()).ldelim();
                if (message.groupFriendsUpdate != null && Object.hasOwnProperty.call(message, "groupFriendsUpdate"))
                    $root.proto.gradido.GroupFriendsUpdate.encode(message.groupFriendsUpdate, writer.uint32(/* id 8, wireType 2 =*/66).fork()).ldelim();
                if (message.groupMemberUpdate != null && Object.hasOwnProperty.call(message, "groupMemberUpdate"))
                    $root.proto.gradido.GroupMemberUpdate.encode(message.groupMemberUpdate, writer.uint32(/* id 9, wireType 2 =*/74).fork()).ldelim();
                return writer;
            };

            /**
             * Encodes the specified TransactionBody message, length delimited. Does not implicitly {@link proto.gradido.TransactionBody.verify|verify} messages.
             * @function encodeDelimited
             * @memberof proto.gradido.TransactionBody
             * @static
             * @param {proto.gradido.ITransactionBody} message TransactionBody message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            TransactionBody.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes a TransactionBody message from the specified reader or buffer.
             * @function decode
             * @memberof proto.gradido.TransactionBody
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {proto.gradido.TransactionBody} TransactionBody
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            TransactionBody.decode = function decode(reader, length) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                var end = length === undefined ? reader.len : reader.pos + length, message = new $root.proto.gradido.TransactionBody();
                while (reader.pos < end) {
                    var tag = reader.uint32();
                    switch (tag >>> 3) {
                    case 1:
                        message.memo = reader.string();
                        break;
                    case 2:
                        message.created = $root.proto.gradido.TimestampSeconds.decode(reader, reader.uint32());
                        break;
                    case 3:
                        message.versionNumber = reader.uint64();
                        break;
                    case 6:
                        message.transfer = $root.proto.gradido.GradidoTransfer.decode(reader, reader.uint32());
                        break;
                    case 7:
                        message.creation = $root.proto.gradido.GradidoCreation.decode(reader, reader.uint32());
                        break;
                    case 8:
                        message.groupFriendsUpdate = $root.proto.gradido.GroupFriendsUpdate.decode(reader, reader.uint32());
                        break;
                    case 9:
                        message.groupMemberUpdate = $root.proto.gradido.GroupMemberUpdate.decode(reader, reader.uint32());
                        break;
                    default:
                        reader.skipType(tag & 7);
                        break;
                    }
                }
                return message;
            };

            /**
             * Decodes a TransactionBody message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof proto.gradido.TransactionBody
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {proto.gradido.TransactionBody} TransactionBody
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            TransactionBody.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a TransactionBody message.
             * @function verify
             * @memberof proto.gradido.TransactionBody
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            TransactionBody.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                var properties = {};
                if (message.memo != null && message.hasOwnProperty("memo"))
                    if (!$util.isString(message.memo))
                        return "memo: string expected";
                if (message.created != null && message.hasOwnProperty("created")) {
                    var error = $root.proto.gradido.TimestampSeconds.verify(message.created);
                    if (error)
                        return "created." + error;
                }
                if (message.versionNumber != null && message.hasOwnProperty("versionNumber"))
                    if (!$util.isInteger(message.versionNumber) && !(message.versionNumber && $util.isInteger(message.versionNumber.low) && $util.isInteger(message.versionNumber.high)))
                        return "versionNumber: integer|Long expected";
                if (message.transfer != null && message.hasOwnProperty("transfer")) {
                    properties.data = 1;
                    {
                        var error = $root.proto.gradido.GradidoTransfer.verify(message.transfer);
                        if (error)
                            return "transfer." + error;
                    }
                }
                if (message.creation != null && message.hasOwnProperty("creation")) {
                    if (properties.data === 1)
                        return "data: multiple values";
                    properties.data = 1;
                    {
                        var error = $root.proto.gradido.GradidoCreation.verify(message.creation);
                        if (error)
                            return "creation." + error;
                    }
                }
                if (message.groupFriendsUpdate != null && message.hasOwnProperty("groupFriendsUpdate")) {
                    if (properties.data === 1)
                        return "data: multiple values";
                    properties.data = 1;
                    {
                        var error = $root.proto.gradido.GroupFriendsUpdate.verify(message.groupFriendsUpdate);
                        if (error)
                            return "groupFriendsUpdate." + error;
                    }
                }
                if (message.groupMemberUpdate != null && message.hasOwnProperty("groupMemberUpdate")) {
                    if (properties.data === 1)
                        return "data: multiple values";
                    properties.data = 1;
                    {
                        var error = $root.proto.gradido.GroupMemberUpdate.verify(message.groupMemberUpdate);
                        if (error)
                            return "groupMemberUpdate." + error;
                    }
                }
                return null;
            };

            /**
             * Creates a TransactionBody message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof proto.gradido.TransactionBody
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {proto.gradido.TransactionBody} TransactionBody
             */
            TransactionBody.fromObject = function fromObject(object) {
                if (object instanceof $root.proto.gradido.TransactionBody)
                    return object;
                var message = new $root.proto.gradido.TransactionBody();
                if (object.memo != null)
                    message.memo = String(object.memo);
                if (object.created != null) {
                    if (typeof object.created !== "object")
                        throw TypeError(".proto.gradido.TransactionBody.created: object expected");
                    message.created = $root.proto.gradido.TimestampSeconds.fromObject(object.created);
                }
                if (object.versionNumber != null)
                    if ($util.Long)
                        (message.versionNumber = $util.Long.fromValue(object.versionNumber)).unsigned = true;
                    else if (typeof object.versionNumber === "string")
                        message.versionNumber = parseInt(object.versionNumber, 10);
                    else if (typeof object.versionNumber === "number")
                        message.versionNumber = object.versionNumber;
                    else if (typeof object.versionNumber === "object")
                        message.versionNumber = new $util.LongBits(object.versionNumber.low >>> 0, object.versionNumber.high >>> 0).toNumber(true);
                if (object.transfer != null) {
                    if (typeof object.transfer !== "object")
                        throw TypeError(".proto.gradido.TransactionBody.transfer: object expected");
                    message.transfer = $root.proto.gradido.GradidoTransfer.fromObject(object.transfer);
                }
                if (object.creation != null) {
                    if (typeof object.creation !== "object")
                        throw TypeError(".proto.gradido.TransactionBody.creation: object expected");
                    message.creation = $root.proto.gradido.GradidoCreation.fromObject(object.creation);
                }
                if (object.groupFriendsUpdate != null) {
                    if (typeof object.groupFriendsUpdate !== "object")
                        throw TypeError(".proto.gradido.TransactionBody.groupFriendsUpdate: object expected");
                    message.groupFriendsUpdate = $root.proto.gradido.GroupFriendsUpdate.fromObject(object.groupFriendsUpdate);
                }
                if (object.groupMemberUpdate != null) {
                    if (typeof object.groupMemberUpdate !== "object")
                        throw TypeError(".proto.gradido.TransactionBody.groupMemberUpdate: object expected");
                    message.groupMemberUpdate = $root.proto.gradido.GroupMemberUpdate.fromObject(object.groupMemberUpdate);
                }
                return message;
            };

            /**
             * Creates a plain object from a TransactionBody message. Also converts values to other types if specified.
             * @function toObject
             * @memberof proto.gradido.TransactionBody
             * @static
             * @param {proto.gradido.TransactionBody} message TransactionBody
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            TransactionBody.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                var object = {};
                if (options.defaults) {
                    object.memo = "";
                    object.created = null;
                    if ($util.Long) {
                        var long = new $util.Long(0, 0, true);
                        object.versionNumber = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
                    } else
                        object.versionNumber = options.longs === String ? "0" : 0;
                }
                if (message.memo != null && message.hasOwnProperty("memo"))
                    object.memo = message.memo;
                if (message.created != null && message.hasOwnProperty("created"))
                    object.created = $root.proto.gradido.TimestampSeconds.toObject(message.created, options);
                if (message.versionNumber != null && message.hasOwnProperty("versionNumber"))
                    if (typeof message.versionNumber === "number")
                        object.versionNumber = options.longs === String ? String(message.versionNumber) : message.versionNumber;
                    else
                        object.versionNumber = options.longs === String ? $util.Long.prototype.toString.call(message.versionNumber) : options.longs === Number ? new $util.LongBits(message.versionNumber.low >>> 0, message.versionNumber.high >>> 0).toNumber(true) : message.versionNumber;
                if (message.transfer != null && message.hasOwnProperty("transfer")) {
                    object.transfer = $root.proto.gradido.GradidoTransfer.toObject(message.transfer, options);
                    if (options.oneofs)
                        object.data = "transfer";
                }
                if (message.creation != null && message.hasOwnProperty("creation")) {
                    object.creation = $root.proto.gradido.GradidoCreation.toObject(message.creation, options);
                    if (options.oneofs)
                        object.data = "creation";
                }
                if (message.groupFriendsUpdate != null && message.hasOwnProperty("groupFriendsUpdate")) {
                    object.groupFriendsUpdate = $root.proto.gradido.GroupFriendsUpdate.toObject(message.groupFriendsUpdate, options);
                    if (options.oneofs)
                        object.data = "groupFriendsUpdate";
                }
                if (message.groupMemberUpdate != null && message.hasOwnProperty("groupMemberUpdate")) {
                    object.groupMemberUpdate = $root.proto.gradido.GroupMemberUpdate.toObject(message.groupMemberUpdate, options);
                    if (options.oneofs)
                        object.data = "groupMemberUpdate";
                }
                return object;
            };

            /**
             * Converts this TransactionBody to JSON.
             * @function toJSON
             * @memberof proto.gradido.TransactionBody
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            TransactionBody.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            return TransactionBody;
        })();

        return gradido;
    })();

    return proto;
})();

module.exports = $root;
