#ifndef __GRADIDO_NODE_LIB_BIN_TEXT_CONVERTER_
#define __GRADIDO_NODE_LIB_BIN_TEXT_CONVERTER_

#include <string>
#include "../SingletonManager/MemoryManager.h"

MemoryBin* convertHexToBin(const std::string& hexString);
MemoryBin* convertBase64ToBin(const std::string& base64String);

std::string convertBinToBase64(const MemoryBin* data);
std::string convertBinToHex(const MemoryBin* data);



#endif //__GRADIDO_NODE_LIB_BIN_TEXT_CONVERTER_