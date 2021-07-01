
#ifndef GRADIDO_ED25519_BIP32_RUST_H
#define GRADIDO_ED25519_BIP32_RUST_H


extern "C" {
    extern void getPublicFromPrivateKey(const uint8_t* privateKey, const uint8_t* chainCode, uint8_t* publicKey);
    extern void getPrivateExtended(
        const uint8_t* privateKey, 
        const uint8_t* chainCode, 
        uint8_t* privKeyExtended,
        uint8_t* publicKey
    );
    extern bool is_3rd_highest_bit_clear(const uint8_t* privateKey, const uint8_t* chainCode);

    extern bool derivePublicKey(
        const uint8_t* publicKey,
        const uint8_t* chainCode,
        uint32_t index,
        uint8_t* derivedPublicKey,
        uint8_t* derivedChainCode
    );

    extern void 
    derivePrivateKey(
        const uint8_t* privateKey,
        const uint8_t* chainCode,
        uint32_t index,
        uint8_t* derivedPrivateKey,
        uint8_t* derivedChainCode
    );

    extern void sign_extended(
        const uint8_t* message,
        size_t messageSize,
        const uint8_t* secretKeyExtended,
        uint8_t* sign
    );

}

#endif //GRADIDO_ED25519_BIP32_RUST_H