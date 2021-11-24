import * as $protobuf from "protobufjs";
/** Namespace proto. */
export namespace proto {

    /** Namespace gradido. */
    namespace gradido {

        /** Properties of a Key. */
        interface IKey {

            /** Key ed25519 */
            ed25519?: (Uint8Array|null);

            /** Key ed25519Ref10 */
            ed25519Ref10?: (Uint8Array|null);
        }

        /** Represents a Key. */
        class Key implements IKey {

            /**
             * Constructs a new Key.
             * @param [properties] Properties to set
             */
            constructor(properties?: proto.gradido.IKey);

            /** Key ed25519. */
            public ed25519?: (Uint8Array|null);

            /** Key ed25519Ref10. */
            public ed25519Ref10?: (Uint8Array|null);

            /** Key key. */
            public key?: ("ed25519"|"ed25519Ref10");

            /**
             * Creates a new Key instance using the specified properties.
             * @param [properties] Properties to set
             * @returns Key instance
             */
            public static create(properties?: proto.gradido.IKey): proto.gradido.Key;

            /**
             * Encodes the specified Key message. Does not implicitly {@link proto.gradido.Key.verify|verify} messages.
             * @param message Key message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: proto.gradido.IKey, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified Key message, length delimited. Does not implicitly {@link proto.gradido.Key.verify|verify} messages.
             * @param message Key message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: proto.gradido.IKey, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a Key message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns Key
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): proto.gradido.Key;

            /**
             * Decodes a Key message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns Key
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): proto.gradido.Key;

            /**
             * Verifies a Key message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a Key message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns Key
             */
            public static fromObject(object: { [k: string]: any }): proto.gradido.Key;

            /**
             * Creates a plain object from a Key message. Also converts values to other types if specified.
             * @param message Key
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: proto.gradido.Key, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this Key to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of a SignaturePair. */
        interface ISignaturePair {

            /** SignaturePair pubKey */
            pubKey?: (Uint8Array|null);

            /** SignaturePair ed25519 */
            ed25519?: (Uint8Array|null);

            /** SignaturePair ed25519Ref10 */
            ed25519Ref10?: (Uint8Array|null);
        }

        /** Represents a SignaturePair. */
        class SignaturePair implements ISignaturePair {

            /**
             * Constructs a new SignaturePair.
             * @param [properties] Properties to set
             */
            constructor(properties?: proto.gradido.ISignaturePair);

            /** SignaturePair pubKey. */
            public pubKey: Uint8Array;

            /** SignaturePair ed25519. */
            public ed25519?: (Uint8Array|null);

            /** SignaturePair ed25519Ref10. */
            public ed25519Ref10?: (Uint8Array|null);

            /** SignaturePair signature. */
            public signature?: ("ed25519"|"ed25519Ref10");

            /**
             * Creates a new SignaturePair instance using the specified properties.
             * @param [properties] Properties to set
             * @returns SignaturePair instance
             */
            public static create(properties?: proto.gradido.ISignaturePair): proto.gradido.SignaturePair;

            /**
             * Encodes the specified SignaturePair message. Does not implicitly {@link proto.gradido.SignaturePair.verify|verify} messages.
             * @param message SignaturePair message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: proto.gradido.ISignaturePair, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified SignaturePair message, length delimited. Does not implicitly {@link proto.gradido.SignaturePair.verify|verify} messages.
             * @param message SignaturePair message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: proto.gradido.ISignaturePair, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a SignaturePair message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns SignaturePair
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): proto.gradido.SignaturePair;

            /**
             * Decodes a SignaturePair message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns SignaturePair
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): proto.gradido.SignaturePair;

            /**
             * Verifies a SignaturePair message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a SignaturePair message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns SignaturePair
             */
            public static fromObject(object: { [k: string]: any }): proto.gradido.SignaturePair;

            /**
             * Creates a plain object from a SignaturePair message. Also converts values to other types if specified.
             * @param message SignaturePair
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: proto.gradido.SignaturePair, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this SignaturePair to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of a SignatureMap. */
        interface ISignatureMap {

            /** SignatureMap sigPair */
            sigPair?: (proto.gradido.ISignaturePair[]|null);
        }

        /** Represents a SignatureMap. */
        class SignatureMap implements ISignatureMap {

            /**
             * Constructs a new SignatureMap.
             * @param [properties] Properties to set
             */
            constructor(properties?: proto.gradido.ISignatureMap);

            /** SignatureMap sigPair. */
            public sigPair: proto.gradido.ISignaturePair[];

            /**
             * Creates a new SignatureMap instance using the specified properties.
             * @param [properties] Properties to set
             * @returns SignatureMap instance
             */
            public static create(properties?: proto.gradido.ISignatureMap): proto.gradido.SignatureMap;

            /**
             * Encodes the specified SignatureMap message. Does not implicitly {@link proto.gradido.SignatureMap.verify|verify} messages.
             * @param message SignatureMap message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: proto.gradido.ISignatureMap, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified SignatureMap message, length delimited. Does not implicitly {@link proto.gradido.SignatureMap.verify|verify} messages.
             * @param message SignatureMap message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: proto.gradido.ISignatureMap, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a SignatureMap message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns SignatureMap
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): proto.gradido.SignatureMap;

            /**
             * Decodes a SignatureMap message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns SignatureMap
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): proto.gradido.SignatureMap;

            /**
             * Verifies a SignatureMap message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a SignatureMap message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns SignatureMap
             */
            public static fromObject(object: { [k: string]: any }): proto.gradido.SignatureMap;

            /**
             * Creates a plain object from a SignatureMap message. Also converts values to other types if specified.
             * @param message SignatureMap
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: proto.gradido.SignatureMap, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this SignatureMap to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of a Timestamp. */
        interface ITimestamp {

            /** Timestamp seconds */
            seconds?: (number|Long|null);

            /** Timestamp nanos */
            nanos?: (number|null);
        }

        /** Represents a Timestamp. */
        class Timestamp implements ITimestamp {

            /**
             * Constructs a new Timestamp.
             * @param [properties] Properties to set
             */
            constructor(properties?: proto.gradido.ITimestamp);

            /** Timestamp seconds. */
            public seconds: (number|Long);

            /** Timestamp nanos. */
            public nanos: number;

            /**
             * Creates a new Timestamp instance using the specified properties.
             * @param [properties] Properties to set
             * @returns Timestamp instance
             */
            public static create(properties?: proto.gradido.ITimestamp): proto.gradido.Timestamp;

            /**
             * Encodes the specified Timestamp message. Does not implicitly {@link proto.gradido.Timestamp.verify|verify} messages.
             * @param message Timestamp message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: proto.gradido.ITimestamp, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified Timestamp message, length delimited. Does not implicitly {@link proto.gradido.Timestamp.verify|verify} messages.
             * @param message Timestamp message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: proto.gradido.ITimestamp, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a Timestamp message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns Timestamp
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): proto.gradido.Timestamp;

            /**
             * Decodes a Timestamp message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns Timestamp
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): proto.gradido.Timestamp;

            /**
             * Verifies a Timestamp message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a Timestamp message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns Timestamp
             */
            public static fromObject(object: { [k: string]: any }): proto.gradido.Timestamp;

            /**
             * Creates a plain object from a Timestamp message. Also converts values to other types if specified.
             * @param message Timestamp
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: proto.gradido.Timestamp, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this Timestamp to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of a TimestampSeconds. */
        interface ITimestampSeconds {

            /** TimestampSeconds seconds */
            seconds?: (number|Long|null);
        }

        /** Represents a TimestampSeconds. */
        class TimestampSeconds implements ITimestampSeconds {

            /**
             * Constructs a new TimestampSeconds.
             * @param [properties] Properties to set
             */
            constructor(properties?: proto.gradido.ITimestampSeconds);

            /** TimestampSeconds seconds. */
            public seconds: (number|Long);

            /**
             * Creates a new TimestampSeconds instance using the specified properties.
             * @param [properties] Properties to set
             * @returns TimestampSeconds instance
             */
            public static create(properties?: proto.gradido.ITimestampSeconds): proto.gradido.TimestampSeconds;

            /**
             * Encodes the specified TimestampSeconds message. Does not implicitly {@link proto.gradido.TimestampSeconds.verify|verify} messages.
             * @param message TimestampSeconds message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: proto.gradido.ITimestampSeconds, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified TimestampSeconds message, length delimited. Does not implicitly {@link proto.gradido.TimestampSeconds.verify|verify} messages.
             * @param message TimestampSeconds message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: proto.gradido.ITimestampSeconds, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a TimestampSeconds message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns TimestampSeconds
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): proto.gradido.TimestampSeconds;

            /**
             * Decodes a TimestampSeconds message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns TimestampSeconds
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): proto.gradido.TimestampSeconds;

            /**
             * Verifies a TimestampSeconds message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a TimestampSeconds message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns TimestampSeconds
             */
            public static fromObject(object: { [k: string]: any }): proto.gradido.TimestampSeconds;

            /**
             * Creates a plain object from a TimestampSeconds message. Also converts values to other types if specified.
             * @param message TimestampSeconds
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: proto.gradido.TimestampSeconds, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this TimestampSeconds to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of a TransferAmount. */
        interface ITransferAmount {

            /** TransferAmount pubkey */
            pubkey?: (Uint8Array|null);

            /** TransferAmount amount */
            amount?: (number|Long|null);
        }

        /** Represents a TransferAmount. */
        class TransferAmount implements ITransferAmount {

            /**
             * Constructs a new TransferAmount.
             * @param [properties] Properties to set
             */
            constructor(properties?: proto.gradido.ITransferAmount);

            /** TransferAmount pubkey. */
            public pubkey: Uint8Array;

            /** TransferAmount amount. */
            public amount: (number|Long);

            /**
             * Creates a new TransferAmount instance using the specified properties.
             * @param [properties] Properties to set
             * @returns TransferAmount instance
             */
            public static create(properties?: proto.gradido.ITransferAmount): proto.gradido.TransferAmount;

            /**
             * Encodes the specified TransferAmount message. Does not implicitly {@link proto.gradido.TransferAmount.verify|verify} messages.
             * @param message TransferAmount message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: proto.gradido.ITransferAmount, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified TransferAmount message, length delimited. Does not implicitly {@link proto.gradido.TransferAmount.verify|verify} messages.
             * @param message TransferAmount message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: proto.gradido.ITransferAmount, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a TransferAmount message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns TransferAmount
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): proto.gradido.TransferAmount;

            /**
             * Decodes a TransferAmount message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns TransferAmount
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): proto.gradido.TransferAmount;

            /**
             * Verifies a TransferAmount message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a TransferAmount message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns TransferAmount
             */
            public static fromObject(object: { [k: string]: any }): proto.gradido.TransferAmount;

            /**
             * Creates a plain object from a TransferAmount message. Also converts values to other types if specified.
             * @param message TransferAmount
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: proto.gradido.TransferAmount, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this TransferAmount to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of a HederaID. */
        interface IHederaID {

            /** HederaID shardNum */
            shardNum?: (number|Long|null);

            /** HederaID realmNum */
            realmNum?: (number|Long|null);

            /** HederaID topicNum */
            topicNum?: (number|Long|null);
        }

        /** Represents a HederaID. */
        class HederaID implements IHederaID {

            /**
             * Constructs a new HederaID.
             * @param [properties] Properties to set
             */
            constructor(properties?: proto.gradido.IHederaID);

            /** HederaID shardNum. */
            public shardNum: (number|Long);

            /** HederaID realmNum. */
            public realmNum: (number|Long);

            /** HederaID topicNum. */
            public topicNum: (number|Long);

            /**
             * Creates a new HederaID instance using the specified properties.
             * @param [properties] Properties to set
             * @returns HederaID instance
             */
            public static create(properties?: proto.gradido.IHederaID): proto.gradido.HederaID;

            /**
             * Encodes the specified HederaID message. Does not implicitly {@link proto.gradido.HederaID.verify|verify} messages.
             * @param message HederaID message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: proto.gradido.IHederaID, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified HederaID message, length delimited. Does not implicitly {@link proto.gradido.HederaID.verify|verify} messages.
             * @param message HederaID message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: proto.gradido.IHederaID, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a HederaID message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns HederaID
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): proto.gradido.HederaID;

            /**
             * Decodes a HederaID message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns HederaID
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): proto.gradido.HederaID;

            /**
             * Verifies a HederaID message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a HederaID message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns HederaID
             */
            public static fromObject(object: { [k: string]: any }): proto.gradido.HederaID;

            /**
             * Creates a plain object from a HederaID message. Also converts values to other types if specified.
             * @param message HederaID
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: proto.gradido.HederaID, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this HederaID to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of a GradidoCreation. */
        interface IGradidoCreation {

            /** GradidoCreation receiver */
            receiver?: (proto.gradido.ITransferAmount|null);

            /** GradidoCreation targetDate */
            targetDate?: (proto.gradido.ITimestampSeconds|null);
        }

        /** Represents a GradidoCreation. */
        class GradidoCreation implements IGradidoCreation {

            /**
             * Constructs a new GradidoCreation.
             * @param [properties] Properties to set
             */
            constructor(properties?: proto.gradido.IGradidoCreation);

            /** GradidoCreation receiver. */
            public receiver?: (proto.gradido.ITransferAmount|null);

            /** GradidoCreation targetDate. */
            public targetDate?: (proto.gradido.ITimestampSeconds|null);

            /**
             * Creates a new GradidoCreation instance using the specified properties.
             * @param [properties] Properties to set
             * @returns GradidoCreation instance
             */
            public static create(properties?: proto.gradido.IGradidoCreation): proto.gradido.GradidoCreation;

            /**
             * Encodes the specified GradidoCreation message. Does not implicitly {@link proto.gradido.GradidoCreation.verify|verify} messages.
             * @param message GradidoCreation message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: proto.gradido.IGradidoCreation, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified GradidoCreation message, length delimited. Does not implicitly {@link proto.gradido.GradidoCreation.verify|verify} messages.
             * @param message GradidoCreation message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: proto.gradido.IGradidoCreation, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a GradidoCreation message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns GradidoCreation
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): proto.gradido.GradidoCreation;

            /**
             * Decodes a GradidoCreation message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns GradidoCreation
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): proto.gradido.GradidoCreation;

            /**
             * Verifies a GradidoCreation message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a GradidoCreation message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns GradidoCreation
             */
            public static fromObject(object: { [k: string]: any }): proto.gradido.GradidoCreation;

            /**
             * Creates a plain object from a GradidoCreation message. Also converts values to other types if specified.
             * @param message GradidoCreation
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: proto.gradido.GradidoCreation, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this GradidoCreation to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of a GradidoTransaction. */
        interface IGradidoTransaction {

            /** GradidoTransaction sigMap */
            sigMap?: (proto.gradido.ISignatureMap|null);

            /** GradidoTransaction bodyBytes */
            bodyBytes?: (Uint8Array|null);
        }

        /** Represents a GradidoTransaction. */
        class GradidoTransaction implements IGradidoTransaction {

            /**
             * Constructs a new GradidoTransaction.
             * @param [properties] Properties to set
             */
            constructor(properties?: proto.gradido.IGradidoTransaction);

            /** GradidoTransaction sigMap. */
            public sigMap?: (proto.gradido.ISignatureMap|null);

            /** GradidoTransaction bodyBytes. */
            public bodyBytes: Uint8Array;

            /**
             * Creates a new GradidoTransaction instance using the specified properties.
             * @param [properties] Properties to set
             * @returns GradidoTransaction instance
             */
            public static create(properties?: proto.gradido.IGradidoTransaction): proto.gradido.GradidoTransaction;

            /**
             * Encodes the specified GradidoTransaction message. Does not implicitly {@link proto.gradido.GradidoTransaction.verify|verify} messages.
             * @param message GradidoTransaction message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: proto.gradido.IGradidoTransaction, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified GradidoTransaction message, length delimited. Does not implicitly {@link proto.gradido.GradidoTransaction.verify|verify} messages.
             * @param message GradidoTransaction message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: proto.gradido.IGradidoTransaction, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a GradidoTransaction message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns GradidoTransaction
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): proto.gradido.GradidoTransaction;

            /**
             * Decodes a GradidoTransaction message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns GradidoTransaction
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): proto.gradido.GradidoTransaction;

            /**
             * Verifies a GradidoTransaction message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a GradidoTransaction message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns GradidoTransaction
             */
            public static fromObject(object: { [k: string]: any }): proto.gradido.GradidoTransaction;

            /**
             * Creates a plain object from a GradidoTransaction message. Also converts values to other types if specified.
             * @param message GradidoTransaction
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: proto.gradido.GradidoTransaction, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this GradidoTransaction to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of a LocalTransfer. */
        interface ILocalTransfer {

            /** LocalTransfer sender */
            sender?: (proto.gradido.ITransferAmount|null);

            /** LocalTransfer receiver */
            receiver?: (Uint8Array|null);
        }

        /** Represents a LocalTransfer. */
        class LocalTransfer implements ILocalTransfer {

            /**
             * Constructs a new LocalTransfer.
             * @param [properties] Properties to set
             */
            constructor(properties?: proto.gradido.ILocalTransfer);

            /** LocalTransfer sender. */
            public sender?: (proto.gradido.ITransferAmount|null);

            /** LocalTransfer receiver. */
            public receiver: Uint8Array;

            /**
             * Creates a new LocalTransfer instance using the specified properties.
             * @param [properties] Properties to set
             * @returns LocalTransfer instance
             */
            public static create(properties?: proto.gradido.ILocalTransfer): proto.gradido.LocalTransfer;

            /**
             * Encodes the specified LocalTransfer message. Does not implicitly {@link proto.gradido.LocalTransfer.verify|verify} messages.
             * @param message LocalTransfer message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: proto.gradido.ILocalTransfer, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified LocalTransfer message, length delimited. Does not implicitly {@link proto.gradido.LocalTransfer.verify|verify} messages.
             * @param message LocalTransfer message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: proto.gradido.ILocalTransfer, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a LocalTransfer message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns LocalTransfer
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): proto.gradido.LocalTransfer;

            /**
             * Decodes a LocalTransfer message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns LocalTransfer
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): proto.gradido.LocalTransfer;

            /**
             * Verifies a LocalTransfer message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a LocalTransfer message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns LocalTransfer
             */
            public static fromObject(object: { [k: string]: any }): proto.gradido.LocalTransfer;

            /**
             * Creates a plain object from a LocalTransfer message. Also converts values to other types if specified.
             * @param message LocalTransfer
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: proto.gradido.LocalTransfer, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this LocalTransfer to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of a CrossGroupTransfer. */
        interface ICrossGroupTransfer {

            /** CrossGroupTransfer sender */
            sender?: (proto.gradido.ITransferAmount|null);

            /** CrossGroupTransfer receiver */
            receiver?: (Uint8Array|null);

            /** CrossGroupTransfer otherGroup */
            otherGroup?: (string|null);

            /** CrossGroupTransfer pairedTransactionId */
            pairedTransactionId?: (proto.gradido.ITimestamp|null);
        }

        /** Represents a CrossGroupTransfer. */
        class CrossGroupTransfer implements ICrossGroupTransfer {

            /**
             * Constructs a new CrossGroupTransfer.
             * @param [properties] Properties to set
             */
            constructor(properties?: proto.gradido.ICrossGroupTransfer);

            /** CrossGroupTransfer sender. */
            public sender?: (proto.gradido.ITransferAmount|null);

            /** CrossGroupTransfer receiver. */
            public receiver: Uint8Array;

            /** CrossGroupTransfer otherGroup. */
            public otherGroup: string;

            /** CrossGroupTransfer pairedTransactionId. */
            public pairedTransactionId?: (proto.gradido.ITimestamp|null);

            /**
             * Creates a new CrossGroupTransfer instance using the specified properties.
             * @param [properties] Properties to set
             * @returns CrossGroupTransfer instance
             */
            public static create(properties?: proto.gradido.ICrossGroupTransfer): proto.gradido.CrossGroupTransfer;

            /**
             * Encodes the specified CrossGroupTransfer message. Does not implicitly {@link proto.gradido.CrossGroupTransfer.verify|verify} messages.
             * @param message CrossGroupTransfer message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: proto.gradido.ICrossGroupTransfer, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified CrossGroupTransfer message, length delimited. Does not implicitly {@link proto.gradido.CrossGroupTransfer.verify|verify} messages.
             * @param message CrossGroupTransfer message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: proto.gradido.ICrossGroupTransfer, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a CrossGroupTransfer message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns CrossGroupTransfer
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): proto.gradido.CrossGroupTransfer;

            /**
             * Decodes a CrossGroupTransfer message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns CrossGroupTransfer
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): proto.gradido.CrossGroupTransfer;

            /**
             * Verifies a CrossGroupTransfer message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a CrossGroupTransfer message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns CrossGroupTransfer
             */
            public static fromObject(object: { [k: string]: any }): proto.gradido.CrossGroupTransfer;

            /**
             * Creates a plain object from a CrossGroupTransfer message. Also converts values to other types if specified.
             * @param message CrossGroupTransfer
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: proto.gradido.CrossGroupTransfer, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this CrossGroupTransfer to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of a GradidoTransfer. */
        interface IGradidoTransfer {

            /** GradidoTransfer local */
            local?: (proto.gradido.ILocalTransfer|null);

            /** GradidoTransfer inbound */
            inbound?: (proto.gradido.ICrossGroupTransfer|null);

            /** GradidoTransfer outbound */
            outbound?: (proto.gradido.ICrossGroupTransfer|null);
        }

        /** Represents a GradidoTransfer. */
        class GradidoTransfer implements IGradidoTransfer {

            /**
             * Constructs a new GradidoTransfer.
             * @param [properties] Properties to set
             */
            constructor(properties?: proto.gradido.IGradidoTransfer);

            /** GradidoTransfer local. */
            public local?: (proto.gradido.ILocalTransfer|null);

            /** GradidoTransfer inbound. */
            public inbound?: (proto.gradido.ICrossGroupTransfer|null);

            /** GradidoTransfer outbound. */
            public outbound?: (proto.gradido.ICrossGroupTransfer|null);

            /** GradidoTransfer data. */
            public data?: ("local"|"inbound"|"outbound");

            /**
             * Creates a new GradidoTransfer instance using the specified properties.
             * @param [properties] Properties to set
             * @returns GradidoTransfer instance
             */
            public static create(properties?: proto.gradido.IGradidoTransfer): proto.gradido.GradidoTransfer;

            /**
             * Encodes the specified GradidoTransfer message. Does not implicitly {@link proto.gradido.GradidoTransfer.verify|verify} messages.
             * @param message GradidoTransfer message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: proto.gradido.IGradidoTransfer, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified GradidoTransfer message, length delimited. Does not implicitly {@link proto.gradido.GradidoTransfer.verify|verify} messages.
             * @param message GradidoTransfer message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: proto.gradido.IGradidoTransfer, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a GradidoTransfer message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns GradidoTransfer
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): proto.gradido.GradidoTransfer;

            /**
             * Decodes a GradidoTransfer message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns GradidoTransfer
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): proto.gradido.GradidoTransfer;

            /**
             * Verifies a GradidoTransfer message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a GradidoTransfer message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns GradidoTransfer
             */
            public static fromObject(object: { [k: string]: any }): proto.gradido.GradidoTransfer;

            /**
             * Creates a plain object from a GradidoTransfer message. Also converts values to other types if specified.
             * @param message GradidoTransfer
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: proto.gradido.GradidoTransfer, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this GradidoTransfer to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of a GroupFriendsUpdate. */
        interface IGroupFriendsUpdate {

            /** GroupFriendsUpdate group */
            group?: (string|null);

            /** GroupFriendsUpdate action */
            action?: (proto.gradido.GroupFriendsUpdate.Action|null);
        }

        /** Represents a GroupFriendsUpdate. */
        class GroupFriendsUpdate implements IGroupFriendsUpdate {

            /**
             * Constructs a new GroupFriendsUpdate.
             * @param [properties] Properties to set
             */
            constructor(properties?: proto.gradido.IGroupFriendsUpdate);

            /** GroupFriendsUpdate group. */
            public group: string;

            /** GroupFriendsUpdate action. */
            public action: proto.gradido.GroupFriendsUpdate.Action;

            /**
             * Creates a new GroupFriendsUpdate instance using the specified properties.
             * @param [properties] Properties to set
             * @returns GroupFriendsUpdate instance
             */
            public static create(properties?: proto.gradido.IGroupFriendsUpdate): proto.gradido.GroupFriendsUpdate;

            /**
             * Encodes the specified GroupFriendsUpdate message. Does not implicitly {@link proto.gradido.GroupFriendsUpdate.verify|verify} messages.
             * @param message GroupFriendsUpdate message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: proto.gradido.IGroupFriendsUpdate, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified GroupFriendsUpdate message, length delimited. Does not implicitly {@link proto.gradido.GroupFriendsUpdate.verify|verify} messages.
             * @param message GroupFriendsUpdate message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: proto.gradido.IGroupFriendsUpdate, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a GroupFriendsUpdate message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns GroupFriendsUpdate
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): proto.gradido.GroupFriendsUpdate;

            /**
             * Decodes a GroupFriendsUpdate message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns GroupFriendsUpdate
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): proto.gradido.GroupFriendsUpdate;

            /**
             * Verifies a GroupFriendsUpdate message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a GroupFriendsUpdate message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns GroupFriendsUpdate
             */
            public static fromObject(object: { [k: string]: any }): proto.gradido.GroupFriendsUpdate;

            /**
             * Creates a plain object from a GroupFriendsUpdate message. Also converts values to other types if specified.
             * @param message GroupFriendsUpdate
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: proto.gradido.GroupFriendsUpdate, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this GroupFriendsUpdate to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        namespace GroupFriendsUpdate {

            /** Action enum. */
            enum Action {
                ADD_FRIEND = 0,
                REMOVE_FRIEND = 1
            }
        }

        /** Properties of a GroupMemberUpdate. */
        interface IGroupMemberUpdate {

            /** GroupMemberUpdate userPubkey */
            userPubkey?: (Uint8Array|null);

            /** GroupMemberUpdate memberUpdateType */
            memberUpdateType?: (proto.gradido.GroupMemberUpdate.MemberUpdateType|null);

            /** GroupMemberUpdate pairedTransactionId */
            pairedTransactionId?: (proto.gradido.ITimestamp|null);

            /** GroupMemberUpdate targetGroup */
            targetGroup?: (string|null);
        }

        /** Represents a GroupMemberUpdate. */
        class GroupMemberUpdate implements IGroupMemberUpdate {

            /**
             * Constructs a new GroupMemberUpdate.
             * @param [properties] Properties to set
             */
            constructor(properties?: proto.gradido.IGroupMemberUpdate);

            /** GroupMemberUpdate userPubkey. */
            public userPubkey: Uint8Array;

            /** GroupMemberUpdate memberUpdateType. */
            public memberUpdateType: proto.gradido.GroupMemberUpdate.MemberUpdateType;

            /** GroupMemberUpdate pairedTransactionId. */
            public pairedTransactionId?: (proto.gradido.ITimestamp|null);

            /** GroupMemberUpdate targetGroup. */
            public targetGroup: string;

            /**
             * Creates a new GroupMemberUpdate instance using the specified properties.
             * @param [properties] Properties to set
             * @returns GroupMemberUpdate instance
             */
            public static create(properties?: proto.gradido.IGroupMemberUpdate): proto.gradido.GroupMemberUpdate;

            /**
             * Encodes the specified GroupMemberUpdate message. Does not implicitly {@link proto.gradido.GroupMemberUpdate.verify|verify} messages.
             * @param message GroupMemberUpdate message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: proto.gradido.IGroupMemberUpdate, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified GroupMemberUpdate message, length delimited. Does not implicitly {@link proto.gradido.GroupMemberUpdate.verify|verify} messages.
             * @param message GroupMemberUpdate message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: proto.gradido.IGroupMemberUpdate, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a GroupMemberUpdate message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns GroupMemberUpdate
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): proto.gradido.GroupMemberUpdate;

            /**
             * Decodes a GroupMemberUpdate message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns GroupMemberUpdate
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): proto.gradido.GroupMemberUpdate;

            /**
             * Verifies a GroupMemberUpdate message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a GroupMemberUpdate message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns GroupMemberUpdate
             */
            public static fromObject(object: { [k: string]: any }): proto.gradido.GroupMemberUpdate;

            /**
             * Creates a plain object from a GroupMemberUpdate message. Also converts values to other types if specified.
             * @param message GroupMemberUpdate
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: proto.gradido.GroupMemberUpdate, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this GroupMemberUpdate to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        namespace GroupMemberUpdate {

            /** MemberUpdateType enum. */
            enum MemberUpdateType {
                ADD_USER = 0,
                MOVE_USER_INBOUND = 1,
                MOVE_USER_OUTBOUND = 2
            }
        }

        /** Properties of a ManageNodeBody. */
        interface IManageNodeBody {

            /** ManageNodeBody versionNumber */
            versionNumber?: (number|Long|null);

            /** ManageNodeBody groupAdd */
            groupAdd?: (proto.gradido.IManageNodeGroupAdd|null);
        }

        /** Represents a ManageNodeBody. */
        class ManageNodeBody implements IManageNodeBody {

            /**
             * Constructs a new ManageNodeBody.
             * @param [properties] Properties to set
             */
            constructor(properties?: proto.gradido.IManageNodeBody);

            /** ManageNodeBody versionNumber. */
            public versionNumber: (number|Long);

            /** ManageNodeBody groupAdd. */
            public groupAdd?: (proto.gradido.IManageNodeGroupAdd|null);

            /** ManageNodeBody data. */
            public data?: "groupAdd";

            /**
             * Creates a new ManageNodeBody instance using the specified properties.
             * @param [properties] Properties to set
             * @returns ManageNodeBody instance
             */
            public static create(properties?: proto.gradido.IManageNodeBody): proto.gradido.ManageNodeBody;

            /**
             * Encodes the specified ManageNodeBody message. Does not implicitly {@link proto.gradido.ManageNodeBody.verify|verify} messages.
             * @param message ManageNodeBody message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: proto.gradido.IManageNodeBody, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified ManageNodeBody message, length delimited. Does not implicitly {@link proto.gradido.ManageNodeBody.verify|verify} messages.
             * @param message ManageNodeBody message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: proto.gradido.IManageNodeBody, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a ManageNodeBody message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns ManageNodeBody
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): proto.gradido.ManageNodeBody;

            /**
             * Decodes a ManageNodeBody message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns ManageNodeBody
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): proto.gradido.ManageNodeBody;

            /**
             * Verifies a ManageNodeBody message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a ManageNodeBody message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns ManageNodeBody
             */
            public static fromObject(object: { [k: string]: any }): proto.gradido.ManageNodeBody;

            /**
             * Creates a plain object from a ManageNodeBody message. Also converts values to other types if specified.
             * @param message ManageNodeBody
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: proto.gradido.ManageNodeBody, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this ManageNodeBody to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of a ManageNodeGroupAdd. */
        interface IManageNodeGroupAdd {

            /** ManageNodeGroupAdd groupName */
            groupName?: (string|null);

            /** ManageNodeGroupAdd groupAlias */
            groupAlias?: (string|null);

            /** ManageNodeGroupAdd hederaTopicId */
            hederaTopicId?: (proto.gradido.IHederaID|null);
        }

        /** Represents a ManageNodeGroupAdd. */
        class ManageNodeGroupAdd implements IManageNodeGroupAdd {

            /**
             * Constructs a new ManageNodeGroupAdd.
             * @param [properties] Properties to set
             */
            constructor(properties?: proto.gradido.IManageNodeGroupAdd);

            /** ManageNodeGroupAdd groupName. */
            public groupName: string;

            /** ManageNodeGroupAdd groupAlias. */
            public groupAlias: string;

            /** ManageNodeGroupAdd hederaTopicId. */
            public hederaTopicId?: (proto.gradido.IHederaID|null);

            /**
             * Creates a new ManageNodeGroupAdd instance using the specified properties.
             * @param [properties] Properties to set
             * @returns ManageNodeGroupAdd instance
             */
            public static create(properties?: proto.gradido.IManageNodeGroupAdd): proto.gradido.ManageNodeGroupAdd;

            /**
             * Encodes the specified ManageNodeGroupAdd message. Does not implicitly {@link proto.gradido.ManageNodeGroupAdd.verify|verify} messages.
             * @param message ManageNodeGroupAdd message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: proto.gradido.IManageNodeGroupAdd, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified ManageNodeGroupAdd message, length delimited. Does not implicitly {@link proto.gradido.ManageNodeGroupAdd.verify|verify} messages.
             * @param message ManageNodeGroupAdd message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: proto.gradido.IManageNodeGroupAdd, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a ManageNodeGroupAdd message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns ManageNodeGroupAdd
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): proto.gradido.ManageNodeGroupAdd;

            /**
             * Decodes a ManageNodeGroupAdd message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns ManageNodeGroupAdd
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): proto.gradido.ManageNodeGroupAdd;

            /**
             * Verifies a ManageNodeGroupAdd message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a ManageNodeGroupAdd message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns ManageNodeGroupAdd
             */
            public static fromObject(object: { [k: string]: any }): proto.gradido.ManageNodeGroupAdd;

            /**
             * Creates a plain object from a ManageNodeGroupAdd message. Also converts values to other types if specified.
             * @param message ManageNodeGroupAdd
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: proto.gradido.ManageNodeGroupAdd, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this ManageNodeGroupAdd to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of a ManageNodeRequest. */
        interface IManageNodeRequest {

            /** ManageNodeRequest sigMap */
            sigMap?: (proto.gradido.ISignatureMap|null);

            /** ManageNodeRequest bodyBytes */
            bodyBytes?: (Uint8Array|null);
        }

        /** Represents a ManageNodeRequest. */
        class ManageNodeRequest implements IManageNodeRequest {

            /**
             * Constructs a new ManageNodeRequest.
             * @param [properties] Properties to set
             */
            constructor(properties?: proto.gradido.IManageNodeRequest);

            /** ManageNodeRequest sigMap. */
            public sigMap?: (proto.gradido.ISignatureMap|null);

            /** ManageNodeRequest bodyBytes. */
            public bodyBytes: Uint8Array;

            /**
             * Creates a new ManageNodeRequest instance using the specified properties.
             * @param [properties] Properties to set
             * @returns ManageNodeRequest instance
             */
            public static create(properties?: proto.gradido.IManageNodeRequest): proto.gradido.ManageNodeRequest;

            /**
             * Encodes the specified ManageNodeRequest message. Does not implicitly {@link proto.gradido.ManageNodeRequest.verify|verify} messages.
             * @param message ManageNodeRequest message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: proto.gradido.IManageNodeRequest, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified ManageNodeRequest message, length delimited. Does not implicitly {@link proto.gradido.ManageNodeRequest.verify|verify} messages.
             * @param message ManageNodeRequest message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: proto.gradido.IManageNodeRequest, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a ManageNodeRequest message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns ManageNodeRequest
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): proto.gradido.ManageNodeRequest;

            /**
             * Decodes a ManageNodeRequest message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns ManageNodeRequest
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): proto.gradido.ManageNodeRequest;

            /**
             * Verifies a ManageNodeRequest message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a ManageNodeRequest message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns ManageNodeRequest
             */
            public static fromObject(object: { [k: string]: any }): proto.gradido.ManageNodeRequest;

            /**
             * Creates a plain object from a ManageNodeRequest message. Also converts values to other types if specified.
             * @param message ManageNodeRequest
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: proto.gradido.ManageNodeRequest, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this ManageNodeRequest to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of a ManageNodeResponse. */
        interface IManageNodeResponse {

            /** ManageNodeResponse success */
            success?: (boolean|null);

            /** ManageNodeResponse error */
            error?: (proto.gradido.ManageNodeResponse.ErrorCode|null);
        }

        /** Represents a ManageNodeResponse. */
        class ManageNodeResponse implements IManageNodeResponse {

            /**
             * Constructs a new ManageNodeResponse.
             * @param [properties] Properties to set
             */
            constructor(properties?: proto.gradido.IManageNodeResponse);

            /** ManageNodeResponse success. */
            public success: boolean;

            /** ManageNodeResponse error. */
            public error: proto.gradido.ManageNodeResponse.ErrorCode;

            /**
             * Creates a new ManageNodeResponse instance using the specified properties.
             * @param [properties] Properties to set
             * @returns ManageNodeResponse instance
             */
            public static create(properties?: proto.gradido.IManageNodeResponse): proto.gradido.ManageNodeResponse;

            /**
             * Encodes the specified ManageNodeResponse message. Does not implicitly {@link proto.gradido.ManageNodeResponse.verify|verify} messages.
             * @param message ManageNodeResponse message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: proto.gradido.IManageNodeResponse, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified ManageNodeResponse message, length delimited. Does not implicitly {@link proto.gradido.ManageNodeResponse.verify|verify} messages.
             * @param message ManageNodeResponse message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: proto.gradido.IManageNodeResponse, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a ManageNodeResponse message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns ManageNodeResponse
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): proto.gradido.ManageNodeResponse;

            /**
             * Decodes a ManageNodeResponse message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns ManageNodeResponse
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): proto.gradido.ManageNodeResponse;

            /**
             * Verifies a ManageNodeResponse message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a ManageNodeResponse message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns ManageNodeResponse
             */
            public static fromObject(object: { [k: string]: any }): proto.gradido.ManageNodeResponse;

            /**
             * Creates a plain object from a ManageNodeResponse message. Also converts values to other types if specified.
             * @param message ManageNodeResponse
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: proto.gradido.ManageNodeResponse, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this ManageNodeResponse to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        namespace ManageNodeResponse {

            /** ErrorCode enum. */
            enum ErrorCode {
                INVALID_BODY = 0,
                INVALID_SIGNATURE = 1,
                SIGNER_NOT_KNOWN = 2,
                GROUP_ALIAS_ALREADY_EXIST = 3
            }
        }

        /** Properties of a TransactionBody. */
        interface ITransactionBody {

            /** TransactionBody memo */
            memo?: (string|null);

            /** TransactionBody created */
            created?: (proto.gradido.ITimestampSeconds|null);

            /** TransactionBody versionNumber */
            versionNumber?: (number|Long|null);

            /** TransactionBody transfer */
            transfer?: (proto.gradido.IGradidoTransfer|null);

            /** TransactionBody creation */
            creation?: (proto.gradido.IGradidoCreation|null);

            /** TransactionBody groupFriendsUpdate */
            groupFriendsUpdate?: (proto.gradido.IGroupFriendsUpdate|null);

            /** TransactionBody groupMemberUpdate */
            groupMemberUpdate?: (proto.gradido.IGroupMemberUpdate|null);
        }

        /** Represents a TransactionBody. */
        class TransactionBody implements ITransactionBody {

            /**
             * Constructs a new TransactionBody.
             * @param [properties] Properties to set
             */
            constructor(properties?: proto.gradido.ITransactionBody);

            /** TransactionBody memo. */
            public memo: string;

            /** TransactionBody created. */
            public created?: (proto.gradido.ITimestampSeconds|null);

            /** TransactionBody versionNumber. */
            public versionNumber: (number|Long);

            /** TransactionBody transfer. */
            public transfer?: (proto.gradido.IGradidoTransfer|null);

            /** TransactionBody creation. */
            public creation?: (proto.gradido.IGradidoCreation|null);

            /** TransactionBody groupFriendsUpdate. */
            public groupFriendsUpdate?: (proto.gradido.IGroupFriendsUpdate|null);

            /** TransactionBody groupMemberUpdate. */
            public groupMemberUpdate?: (proto.gradido.IGroupMemberUpdate|null);

            /** TransactionBody data. */
            public data?: ("transfer"|"creation"|"groupFriendsUpdate"|"groupMemberUpdate");

            /**
             * Creates a new TransactionBody instance using the specified properties.
             * @param [properties] Properties to set
             * @returns TransactionBody instance
             */
            public static create(properties?: proto.gradido.ITransactionBody): proto.gradido.TransactionBody;

            /**
             * Encodes the specified TransactionBody message. Does not implicitly {@link proto.gradido.TransactionBody.verify|verify} messages.
             * @param message TransactionBody message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: proto.gradido.ITransactionBody, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified TransactionBody message, length delimited. Does not implicitly {@link proto.gradido.TransactionBody.verify|verify} messages.
             * @param message TransactionBody message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: proto.gradido.ITransactionBody, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a TransactionBody message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns TransactionBody
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): proto.gradido.TransactionBody;

            /**
             * Decodes a TransactionBody message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns TransactionBody
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): proto.gradido.TransactionBody;

            /**
             * Verifies a TransactionBody message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a TransactionBody message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns TransactionBody
             */
            public static fromObject(object: { [k: string]: any }): proto.gradido.TransactionBody;

            /**
             * Creates a plain object from a TransactionBody message. Also converts values to other types if specified.
             * @param message TransactionBody
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: proto.gradido.TransactionBody, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this TransactionBody to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }
    }
}
