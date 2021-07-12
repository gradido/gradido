#ifndef IOTAC_WRAPPER_MAIN

#ifdef __cplusplus
extern "C" {
#endif

    extern int Iota_sendMessage(const char* message, const char* indexName, unsigned char* messageId);

    extern void Iota_setConfig(const char* host, int port);

#ifdef __cplusplus
}
#endif


#endif //IOTAC_WRAPPER_MAIN