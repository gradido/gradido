
/*extern const char* derivePublicKey(const char* public_key, const char* chain_index, int32_t index);

extern const char* derivePrivateKey(const char* public_key, const char* chain_index, int32_t index);

extern const char* getPublicFromPrivateKey(const char* private_key);
*/
extern "C" {
    extern bool getPublicFromPrivateKey(const uint8_t* private_key, uint8_t* public_key);
}

