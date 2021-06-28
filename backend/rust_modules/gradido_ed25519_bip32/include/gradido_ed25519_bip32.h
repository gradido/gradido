
extern const char* derivePublicKey(const char* public_key, const char* chain_index, int32_t index);

extern const char* derivePrivateKey(const char* public_key, const char* chain_index, int32_t index);

extern const char* getPublicFromPrivateKey(const char* private_key);

extern "C" void hello_world();

