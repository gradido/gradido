#ifndef __GRADIDO_LOGIN_SERVER_MODEL_GRADIDO_GRADIDO_BLOCK
#define __GRADIDO_LOGIN_SERVER_MODEL_GRADIDO_GRADIDO_BLOCK

#include "proto/gradido/GradidoBlock.pb.h"

namespace model {
	namespace gradido {
		class GradidoBlock
		{
		public:
			GradidoBlock(std::string serializedGradidoBlock);
			std::string toJson();
		protected:
			proto::gradido::GradidoBlock mProtoGradidoBlock;
		};
	}
}

#endif //__GRADIDO_LOGIN_SERVER_MODEL_GRADIDO_GRADIDO_BLOCK