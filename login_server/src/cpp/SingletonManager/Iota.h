#ifndef GRADIDO_LOGIN_SERVER_CRYPTO_IOTA_H
#define GRADIDO_LOGIN_SERVER_CRYPTO_IOTA_H

#include <string>

/*!
 * @author Dario Rekowski
 *
 * @date  12.07.2021
 *
 * @brief Load Iota Wrapper dynamicly to prevent error: [json_get_string:11] invalid parameters
 *
 * The function json_get_string is used from Poco Json Lib and from Iota Json Lib but with different parameter
 * so to prevent that they collider, we load iota dynamicly
 */

class Iota
{
public:
    ~Iota();

    bool init(const std::string filename);
    void exit();
    static Iota* getInstance();

    int sendMessage(const char* message, const char* indexName, unsigned char* messageId);
    void setConfig(const char* host, int port);

protected:
    Iota();

    void* mHandle;
    // void Iota_setConfig(const char* host, int port)
    typedef void (*set_config)(const char*, int);
    set_config mSetConfig;

    // int Iota_sendMessage(const char* message, const char* indexName, unsigned char* messageId);
    typedef int (*send_message)(const char*, const char*, unsigned char*);
    send_message mSendMessage;

    bool mInitalized;
};

#endif // GRADIDO_LOGIN_SERVER_CRYPTO_IOTA_H
