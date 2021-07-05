
#ifndef GRADIDO_IOTA_CLIENT_RUST_H
#define GRADIDO_IOTA_CLIENT_RUST_H


extern "C" {
   extern void sendIotaMessage(
       const uint8_t* message, 
       size_t messageSize, 
       const uint8_t* indexName, 
       size_t indexSize,
       uint8_t* messageId
    );

}

#endif //GRADIDO_IOTA_CLIENT_RUST_H