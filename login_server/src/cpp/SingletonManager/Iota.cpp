#include "Iota.h"
#include <assert.h>
#include <iostream>
#ifndef _WIN32
#include <dlfcn.h>
#endif

Iota::Iota()
: mHandle(nullptr), mSetConfig(nullptr), mSendMessage(nullptr), mInitalized(false)
{
}

Iota::~Iota()
{
    if(mInitalized) {
      exit();
    }
}

void Iota::exit()
{
#ifndef _WIN32
    dlclose(mHandle);
#endif
    mInitalized = false;
}

bool Iota::init(const std::string filename)
{
    if(mInitalized) {
      return true;
    }
#ifndef _WIN32
    mHandle = dlopen(filename.data(), RTLD_LAZY);
    char *error;
    if (!mHandle) {
        std::clog << "[Iota::init] error loading shared library: " << filename << ", " << dlerror() << std::endl;
        return false;
    }
    mSetConfig = (set_config)dlsym(mHandle, "Iota_setConfig");
    if ((error = dlerror()) != NULL)  {
        std::clog << "[Iota::init] error by loading function address for function Iota_setConfig: " << error << std::endl;
        return false;
    }

    mSendMessage = (send_message)dlsym(mHandle, "Iota_sendMessage");
    if ((error = dlerror()) != NULL)  {
        std::clog << "[Iota::init] error by loading function address for function Iota_sendMessage: " << error << std::endl;
        return false;
    }
#endif
    mInitalized = true;
    return true;
}

int Iota::sendMessage(const char* message, const char* indexName, unsigned char* messageId)
{
    if(!mInitalized) {
        return -10;
    }
    assert(mSendMessage);
    printf("before call SendMessage \n");
    return (*mSendMessage)(message, indexName, messageId);
}

void Iota::setConfig(const char* host, int port)
{
    if(!mInitalized) {
        return;
    }
    assert(mSetConfig);
    (*mSetConfig)(host, port);
}

Iota* Iota::getInstance()
{
    static Iota theOne;
    return &theOne;
}
