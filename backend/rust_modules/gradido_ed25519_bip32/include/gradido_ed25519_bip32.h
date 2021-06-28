extern "C" {
    const char* derivePublicKey(const char* public_key, const char* chain_index, int32_t index);
    const char* derivePrivateKey(const char* public_key, const char* chain_index, int32_t index);
    const char* getPublicFromPrivateKey(const char* private_key);
}
