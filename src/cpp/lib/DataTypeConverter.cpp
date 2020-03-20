#include "DataTypeConverter.h"

namespace DataTypeConverter
{
	int strToInt(const std::string& input)
	{
		try {
			return stoi(input);
		}
		catch (const std::invalid_argument& ia) {
			result->set("state", "error");
			result->set("msg", "error parsing query params, invalid argument: ");
			result->set("details", ia.what());
			return result;
		}
		catch (const std::out_of_range& oor) {
			result->set("state", "error");
			result->set("msg", "error parsing query params, Out of Range error: ");
			result->set("details", oor.what());
			return result;
		}
		catch (const std::logic_error & ler) {
			result->set("state", "error");
			result->set("msg", "error parsing query params, Logical error: ");
			result->set("details", ler.what());
			return result;
		}
		catch (Poco::Exception& ex) {
			//printf("[JsonGetLogin::handle] exception: %s\n", ex.displayText().data());
			result->set("state", "error");
			result->set("msg", "error parsing query params, Poco Error");
			result->set("details", ex.displayText());
			return result;
		}
	}
}