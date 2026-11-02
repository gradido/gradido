import {
  ComponentDescriptor,
  component,
  createSignature,
  FieldOccurrence,
  isSignatureError,
  MessageDescriptor,
  SignatureErrorCode,
  SignatureFields,
  Signer,
  verifySignature,
} from 'http-message-sig'
import { signatureVerify } from 'shared-native'
import { AppContext } from '../AppContext'
import { FEDERATION_REQUEST_TIMEOUT_S } from '../const'
import { HTTP_MESSAGE_SIGNATURE_ALGORITHMUS } from './const'
import { InvalidResponseSignatureError } from './errorTypes'

function decideComponents(message: MessageDescriptor): (string | ComponentDescriptor)[] {
  const components =
    message.kind === 'request'
      ? ['@method', '@path']
      : ['@status', component('@method', { req: true }), component('@path', { req: true })]
  if (message.fields.find((field: FieldOccurrence) => field.name === 'content-digest')) {
    components.push('content-digest')
    components.push('content-type')
  }
  return components
}

export function signHttpMessage(
  message: MessageDescriptor,
  nonce?: string,
): Promise<SignatureFields> {
  const homeCom = AppContext.getInstance().getHomeCommunity()
  const signer: Signer = {
    algorithm: HTTP_MESSAGE_SIGNATURE_ALGORITHMUS,
    sign: (data) => homeCom.sign(data),
  }

  return createSignature(message, {
    components: decideComponents(message),
    parameters: {
      keyid: homeCom.publicKey.toString('hex'),
      alg: signer.algorithm,
      created: Math.floor(Date.now() / 1000),
      nonce,
    },
    signer,
  })
}

// Returns keyid (as hex) and nonce of the signature. The keyid only says that this key signed: it is
// what the sender claims, the caller has to check that it is a key it trusts.
// If expected nonce is known before call to verifyHttpMessage, it can be checked directly, but it will also be returned if exist
// and can be used in a later step
export async function verifyHttpMessage(
  message: MessageDescriptor,
  nonce?: string,
): Promise<{ keyId: string; nonce?: string }> {
  try {
    const requiredParameters = ['keyid', 'alg']
    if (nonce) {
      requiredParameters.push('nonce')
    }
    // No label is named: the library verifies the one signature a response carries, and refuses
    // one with more, so a signature by another key beside a valid one refuses the whole response.
    const verifiedSignature = await verifySignature(message, {
      policy: {
        algorithms: [HTTP_MESSAGE_SIGNATURE_ALGORITHMUS],
        requiredComponents: decideComponents(message),
        requiredParameters,
        maxAge: FEDERATION_REQUEST_TIMEOUT_S,
        clockSkew: 1,
        // runs only on a signature that verified
        validate: ({ parameters }) => {
          if (nonce && parameters.nonce !== nonce) {
            throw new InvalidResponseSignatureError('nonce is not the one of the request')
          }
        },
      },
      // verifies against the key the message itself names, see above
      resolveVerifier: ({ parameters }) => {
        const keyid = parameters.keyid
        if (!keyid) {
          throw new InvalidResponseSignatureError(`missing key id`)
        }
        return {
          algorithm: HTTP_MESSAGE_SIGNATURE_ALGORITHMUS,
          // signature and keyid are what the other community sent; signatureVerify throws for one of
          // another size, here it is simply not valid
          verify: (data, signature) => {
            const keyBinary = Buffer.from(keyid, 'hex')
            return (
              keyBinary.length === 32 &&
              signature.length === 64 &&
              signatureVerify(data, signature, keyBinary)
            )
          },
        }
      },
    })
    return { keyId: verifiedSignature.parameters.keyid!, nonce: verifiedSignature.parameters.nonce }
  } catch (error) {
    // the library wraps what resolveVerifier throws, the error of ours is handed on as it was
    throw isSignatureError(error) && error.code === SignatureErrorCode.ResolverFailed
      ? error.cause
      : error
  }
}
