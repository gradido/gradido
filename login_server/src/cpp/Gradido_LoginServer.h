#ifndef Gradido_LoginServer_INCLUDED
#define Gradido_LoginServer_INCLUDED

#include "Poco/Util/ServerApplication.h"

class Gradido_LoginServer : public Poco::Util::ServerApplication
{

	/// The main application class.
	///
	/// This class handles command-line arguments and
	/// configuration files.
	/// Start the Gradido_LoginServer executable with the help
	/// option (/help on Windows, --help on Unix) for
	/// the available command line options.
	///
	

public:
	Gradido_LoginServer();
	~Gradido_LoginServer();

protected:
	void initialize(Application& self);

	void uninitialize();

	void defineOptions(Poco::Util::OptionSet& options);

	void handleOption(const std::string& name, const std::string& value);
	void displayHelp();

	int main(const std::vector<std::string>& args);

	void createConsoleFileAsyncLogger(std::string name, std::string filePath);

private:
	bool _helpRequested;
};

#endif //Gradido_LoginServer_INCLUDED
