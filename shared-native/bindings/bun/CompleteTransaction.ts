import { ptr, toArrayBuffer } from 'bun:ffi'
import { ErrorDetails, GrdtTransactionType, VoidResult } from '../../'
import { blockchain_core, SIGN_PUBLIC_KEY_SIZE, UUID_BINARY_SIZE } from './library'

const registry = new FinalizationRegistry((handle: bigint) => {
  if (handle && blockchain_core.symbols.grdr_complete_transaction_release) {
    blockchain_core.symbols.grdr_complete_transaction_free(handle)
    handle = 0n
  }
})

export class CompleteTransaction {
  private handle: bigint | null = null

  public constructor() {
    // call internally malloc so this.handle is a number, containing ptr address
    this.handle = blockchain_core.symbols.grdr_complete_transaction_create()
    if (!this.handle) {
      throw new Error('Failed to create transaction')
    }
    // auto clean up
    registry.register(this, this.handle)
  }

  public initFromProtobuf(serialized: Uint8Array, communityUuid: Uint8Array | string): VoidResult {
    if (!this.handle) {
      throw new Error('Object not initalized')
    }
    let communityUuidBuffer: Uint8Array
    if (typeof communityUuid === 'string') {
      communityUuidBuffer = new Uint8Array(Buffer.from(communityUuid.replace(/-/g, ''), 'hex'))
    } else {
      communityUuidBuffer = communityUuid
    }
    const communityUuidPtr = ptr(communityUuidBuffer)
    const serializedPtr = ptr(serialized)
    let bufferSize = 4096
    let resultString = 'GRD_SUCCESS'
    do {
      if (bufferSize >= 1024 * 1024 * 1024) {
        return { success: false, error: new Error('serialized data is to big') }
      }
      const resultBuffer = new Uint8Array(bufferSize)
      const result = blockchain_core.symbols.grdr_complete_transaction_init_from_protobuf(
        this.handle,
        serializedPtr,
        serialized.byteLength,
        communityUuidPtr,
        resultBuffer,
        bufferSize,
      )
      resultString = blockchain_core.symbols.grd_result_to_string(result).toString()
      bufferSize *= 2
    } while (
      resultString === 'GRD_ERROR_OUT_OF_MEMORY' ||
      resultString === 'GRD_ERROR_DESTINATION_BUFFER_TO_SMALL'
    )
    if (resultString !== 'GRD_SUCCESS') {
      return {
        success: false, error: new Error(
          `Couldn't parse CompleteTransaction from serialized, returned: ${resultString}`,
        )
      }
    }
    return { success: true }
  }
  public validate(verifySignatures: boolean = true): VoidResult<ErrorDetails> {
    if (!this.handle) {
      throw new Error('Object not initalized')
    }

    const errorDetailsPtr = blockchain_core.symbols.grd_error_details_create(null)
    const result = blockchain_core.symbols.grdi_validate_complete_transaction_flat_options(
      this.handle,
      verifySignatures,
      errorDetailsPtr,
    )
    const resultString = blockchain_core.symbols.grdi_validate_result_to_string(result)
    let errorDetails: ErrorDetails | undefined
    if (resultString.toString() !== 'GRDI_VALIDATE_SUCCESS') {
      const message = blockchain_core.symbols.grd_error_details_get_message(errorDetailsPtr)
      const actual = blockchain_core.symbols.grd_error_details_get_message(errorDetailsPtr)
      const expected = blockchain_core.symbols.grd_error_details_get_message(errorDetailsPtr)
      errorDetails = {
        name: resultString,
        message,
        actual,
        expected
      }
    }
    blockchain_core.symbols.grd_error_details_free(errorDetailsPtr)
    return errorDetails ? { success: false, error: errorDetails } : { success: true }
  }

  public getSenderPublicKey(): Uint8Array | null {
    if (!this.handle) {
      throw new Error('Object not initalized')
    }

    const keyPtr = blockchain_core.symbols.grdr_complete_transaction_get_sender_public_key(
      this.handle,
    )
    if (!keyPtr) {
      return null
    }
    return new Uint8Array(toArrayBuffer(keyPtr, 0, SIGN_PUBLIC_KEY_SIZE), 0, SIGN_PUBLIC_KEY_SIZE)
  }

  public getRecipientPublicKey(): Uint8Array | null {
    if (!this.handle) {
      throw new Error('Object not initalized')
    }

    const keyPtr = blockchain_core.symbols.grdr_complete_transaction_get_recipient_public_key(
      this.handle,
    )
    if (!keyPtr) {
      return null
    }
    return new Uint8Array(toArrayBuffer(keyPtr, 0, SIGN_PUBLIC_KEY_SIZE), 0, SIGN_PUBLIC_KEY_SIZE)
  }

  public getSenderCommunityUuid(): string | null {
    if (!this.handle) {
      throw new Error('Object not initalized')
    }

    const uuidPtr = blockchain_core.symbols.grdr_complete_transaction_get_sender_community_uuid(
      this.handle,
    )
    if (!uuidPtr) {
      return null
    }
    const resultBuffer = new Uint8Array(37)
    const resultBufferPtr = ptr(resultBuffer)
    blockchain_core.symbols.grdu_uuid_to_string(resultBufferPtr, uuidPtr)
    return Buffer.from(resultBuffer).toString('utf8').slice(0, 36)
  }

  public getRecipientCommunityUuid(): string | null {
    if (!this.handle) {
      throw new Error('Object not initalized')
    }

    const uuidPtr = blockchain_core.symbols.grdr_complete_transaction_get_recipient_community_uuid(
      this.handle,
    )
    if (!uuidPtr) {
      return null
    }
    const resultBuffer = new Uint8Array(37)
    const resultBufferPtr = ptr(resultBuffer)
    blockchain_core.symbols.grdu_uuid_to_string(resultBufferPtr, uuidPtr)
    return Buffer.from(resultBuffer).toString('utf8').slice(0, 36)
  }

  public getRegisteredAccount(): Uint8Array | null {
    if (!this.handle) {
      throw new Error('Object not initalized')
    }

    const accountPtr = blockchain_core.symbols.grdr_complete_transaction_get_registered_account(
      this.handle,
    )
    if (!accountPtr) {
      return null
    }
    return new Uint8Array(
      toArrayBuffer(accountPtr, 0, SIGN_PUBLIC_KEY_SIZE),
      0,
      SIGN_PUBLIC_KEY_SIZE,
    )
  }

  public getAmount(): bigint {
    if (!this.handle) {
      throw new Error('Object not initalized')
    }

    return blockchain_core.symbols.grdr_complete_transaction_get_amount(this.handle)
  }

  public getAccountBalanceForPublicKey(
    publicKey: Uint8Array | string,
  ): { balance: bigint; communityUuid: string } | null {
    if (!this.handle) {
      throw new Error('Object not initalized')
    }

    let publicKeyBuffer: Uint8Array
    if (typeof publicKey === 'string') {
      if (publicKey.length !== SIGN_PUBLIC_KEY_SIZE * 2) {
        throw new Error(`Expected first argument to be size ${SIGN_PUBLIC_KEY_SIZE * 2} as string`)
      }
      publicKeyBuffer = new Uint8Array(Buffer.from(publicKey, 'hex'))
      if (publicKeyBuffer.length !== SIGN_PUBLIC_KEY_SIZE) {
        throw new Error('Expected first argument to be valid hex string')
      }
    } else {
      if (publicKey.length !== SIGN_PUBLIC_KEY_SIZE) {
        throw new Error(`Expected first argument to be size ${SIGN_PUBLIC_KEY_SIZE} as Uint8Array`)
      }
      publicKeyBuffer = publicKey
    }

    const publicKeyPtr = ptr(publicKeyBuffer)
    const result = blockchain_core.symbols.transaction_get_account_balance_for_public_key(
      this.handle,
      publicKeyPtr,
    )

    if (result === 0) {
      return null
    }

    const communityUuidPtr = blockchain_core.symbols.grdw_account_balance_get_community_uuid(result)
    const communityUuidStringBuffer = new Uint8Array(37)
    const communityUuidStringBufferPtr = ptr(communityUuidStringBuffer)
    blockchain_core.symbols.grdu_uuid_to_string(communityUuidStringBufferPtr, communityUuidPtr)

    return {
      balance: BigInt(blockchain_core.symbols.grdw_account_balance_get_balance(result)),
      communityUuid: Buffer.from(communityUuidStringBuffer).toString('utf8').slice(0, 36),
    }
  }

  public getTransactionType(): GrdtTransactionType {
    if (!this.handle) {
      throw new Error('Object not initalized')
    }

    return blockchain_core.symbols
      .grdt_transaction_to_string(
        blockchain_core.symbols.grdr_complete_transaction_get_transaction_type(this.handle),
      )
      .toString()
  }

  public getTargetDate(): Date | null {
    if (!this.handle) {
      throw new Error('Object not initalized')
    }

    const timestampSeconds = blockchain_core.symbols.grdr_complete_transaction_get_target_date(
      this.handle,
    )
    if (!timestampSeconds) {
      return null
    }
    return new Date(Number(timestampSeconds * 1000n))
  }

  public getTimeoutDuration(): bigint {
    if (!this.handle) {
      throw new Error('Object not initalized')
    }

    return blockchain_core.symbols.grdr_complete_transaction_get_timeout_duration(this.handle)
  }
}
// */
