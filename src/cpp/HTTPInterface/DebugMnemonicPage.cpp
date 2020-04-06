#include "DebugMnemonicPage.h"
#include "Poco/Net/HTTPServerRequest.h"
#include "Poco/Net/HTTPServerResponse.h"
#include "Poco/Net/HTMLForm.h"
#include "Poco/DeflatingStream.h"


#line 7 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\debugMnemonic.cpsp"

#include "../ServerConfig.h"
#include "../Crypto/KeyPair.h"

	struct WordChecked {
		WordChecked() : index(0), bSet(false) {};
		
		int index;
		std::string word;
		std::string language;
		bool bSet;
		
		std::string print()
		{
			std::string str;
			str = std::to_string(index);
			str += ": ";
			str += word;
			str += " (";
			str += language; 
			str += ")";
			return str;
		}
	};
	
	const char* getLanguageByMnemonicListIndex(ServerConfig::Mnemonic_Types type) 
	{
			switch(type) {
			case ServerConfig::MNEMONIC_GRADIDO_BOOK_GERMAN_RANDOM_ORDER: return "de";
			case ServerConfig::MNEMONIC_BIP0039_SORTED_ORDER: return "en";
			}
		return "unknown";
	}
#line 1 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\header_old.cpsp"
 
#include "../ServerConfig.h"	


DebugMnemonicPage::DebugMnemonicPage(Session* arg):
	SessionHTTPRequestHandler(arg)
{
}


void DebugMnemonicPage::handleRequest(Poco::Net::HTTPServerRequest& request, Poco::Net::HTTPServerResponse& response)
{
	response.setChunkedTransferEncoding(true);
	response.setContentType("text/html");
	bool _compressResponse(request.hasToken("Accept-Encoding", "gzip"));
	if (_compressResponse) response.set("Content-Encoding", "gzip");

	Poco::Net::HTMLForm form(request, request.stream());
#line 41 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\debugMnemonic.cpsp"

	const char* pageName = "Debug Mnemonic";
	WordChecked checkedWord;
	WordChecked checkedIndex[ServerConfig::Mnemonic_Types::MNEMONIC_MAX];
	
	if(!form.empty()) 
	{
		if("" != form.get("check_word", "")) 
		{
			auto word = KeyPair::filterPassphrase(form.get("word", ""));
			if("" != word) {
				checkedWord.bSet = true;
				checkedWord.word = word;
				
				for (int i = ServerConfig::MNEMONIC_GRADIDO_BOOK_GERMAN_RANDOM_ORDER; i < ServerConfig::Mnemonic_Types::MNEMONIC_MAX; i++) 
				{
					Mnemonic& m = ServerConfig::g_Mnemonic_WordLists[i];
		
					if (word != "\0" && word != "" && word.size() > 3) {
						if(m.isWordExist(word)) {
							checkedWord.index = m.getWordIndex(word.data());
							checkedWord.language = getLanguageByMnemonicListIndex((ServerConfig::Mnemonic_Types)i);
							break;
						}
					}
					else {
						addError(new Error("Word", "Ungültiges Wort, es sollte länger als 3 Zeichen sein"));
						checkedWord.bSet = false;
						break;
					}
				}
			}
		}
		if("" != form.get("check_index", "")) 
		{
			try {
				auto index = stoi(form.get("index", ""));
				if(index < 0 || index >= 2048) {
					addError(new Error("Index", "Ung&uuml;ltiger Index, muss sich im Bereich [0:2047] bewegen"));
				} else {
					for (int i = ServerConfig::MNEMONIC_GRADIDO_BOOK_GERMAN_RANDOM_ORDER; i < ServerConfig::Mnemonic_Types::MNEMONIC_MAX; i++) 
					{
						Mnemonic& m = ServerConfig::g_Mnemonic_WordLists[i];
						checkedIndex[i].bSet = true;
						checkedIndex[i].index = index;
						checkedIndex[i].word = m.getWord(index);
						checkedIndex[i].language = getLanguageByMnemonicListIndex((ServerConfig::Mnemonic_Types)i);
					}
				}
				 
			} catch(...) {
				addError(new Error("Index", "Ung&uuml;ltiger Index, keine Nummer"));
			}
			
			
		}
	}
		
	
	std::ostream& _responseStream = response.send();
	Poco::DeflatingOutputStream _gzipStream(_responseStream, Poco::DeflatingStreamBuf::STREAM_GZIP, 1);
	std::ostream& responseStream = _compressResponse ? _gzipStream : _responseStream;
	responseStream << "\n";
	// begin include header_old.cpsp
	responseStream << "\n";
	responseStream << "<!DOCTYPE html>\n";
	responseStream << "<html>\n";
	responseStream << "<head>\n";
	responseStream << "<meta charset=\"UTF-8\">\n";
	responseStream << "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n";
	responseStream << "<title>Gradido Login Server: ";
#line 9 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\header_old.cpsp"
	responseStream << ( pageName );
	responseStream << "</title>\n";
	responseStream << "<!--<link rel=\"stylesheet\" type=\"text/css\" href=\"css/styles.min.css\">-->\n";
	responseStream << "<link rel=\"stylesheet\" type=\"text/css\" href=\"";
#line 11 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\header_old.cpsp"
	responseStream << ( ServerConfig::g_php_serverPath );
	responseStream << "/css/styles.css\">\n";
	responseStream << "<style type=\"text/css\" >\n";
	responseStream << ".grd_container\n";
	responseStream << "{\n";
	responseStream << "  max-width:820px;\n";
	responseStream << "  margin-left:auto;\n";
	responseStream << "  margin-right:auto;\n";
	responseStream << "}\n";
	responseStream << "\n";
	responseStream << "input:not([type='radio']) {\n";
	responseStream << "\twidth:200px;\n";
	responseStream << "}\n";
	responseStream << "label:not(.grd_radio_label) {\n";
	responseStream << "\twidth:80px;\n";
	responseStream << "\tdisplay:inline-block;\n";
	responseStream << "}\n";
	responseStream << ".grd_container_small\n";
	responseStream << "{\n";
	responseStream << "  max-width:500px;\n";
	responseStream << "}\n";
	responseStream << ".grd_text {\n";
	responseStream << "  max-width:550px;\n";
	responseStream << "  margin-bottom: 5px;\n";
	responseStream << "}\n";
	responseStream << ".dev-info {\n";
	responseStream << "\tposition: fixed;\n";
	responseStream << "\tcolor:grey;\n";
	responseStream << "\tfont-size: smaller;\n";
	responseStream << "\tleft:8px;\n";
	responseStream << "}\n";
	responseStream << ".grd-time-used {  \n";
	responseStream << "  bottom:0;\n";
	responseStream << "} \n";
	responseStream << "\n";
	responseStream << ".versionstring {\n";
	responseStream << "\ttop:0;\n";
	responseStream << "}\n";
	responseStream << "</style>\n";
	responseStream << "</head>\n";
	responseStream << "<body>\n";
	responseStream << "<div class=\"versionstring dev-info\">\n";
	responseStream << "\t<p class=\"grd_small\">Login Server in Entwicklung</p>\n";
	responseStream << "\t<p class=\"grd_small\">Alpha ";
#line 53 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\header_old.cpsp"
	responseStream << ( ServerConfig::g_versionString );
	responseStream << "</p>\n";
	responseStream << "</div>\n";
	// end include header_old.cpsp
	responseStream << "\n";
	responseStream << "<div class=\"grd_container\">\n";
	responseStream << "\t<h1>Debug Mnemonic</h1>\n";
	responseStream << "\t";
#line 103 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\debugMnemonic.cpsp"
	responseStream << ( getErrorsHtml() );
	responseStream << "\n";
	responseStream << "\t<form method=\"POST\">\n";
	responseStream << "\t\t<fieldset class=\"grd_container_small\">\n";
	responseStream << "\t\t\t<legend>Wort prüfen</legend>\n";
	responseStream << "\t\t\t<p class=\"grd_small\">\n";
	responseStream << "\t\t\t\t<label for=\"word\">Word</label>\n";
	responseStream << "\t\t\t\t<input id=\"word\" type=\"text\" name=\"word\" value=\"";
#line 109 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\debugMnemonic.cpsp"
	responseStream << ( form.get("word", "") );
	responseStream << "\"/>\n";
	responseStream << "\t\t\t</p>\n";
	responseStream << "\t\t\t<input type=\"submit\" name=\"check_word\" value=\"Wort &uuml;berpr&uuml;fen\"/>\n";
	responseStream << "\t\t\t";
#line 112 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\debugMnemonic.cpsp"
 if(checkedWord.bSet)  { 	responseStream << "\n";
	responseStream << "\t\t\t\t<p>";
#line 113 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\debugMnemonic.cpsp"
	responseStream << ( checkedWord.print() );
	responseStream << "</p>\n";
	responseStream << "\t\t\t";
#line 114 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\debugMnemonic.cpsp"
 } 	responseStream << "\n";
	responseStream << "\t\t</fieldset>\n";
	responseStream << "\t\t<fieldset class=\"grd_container_small\">\n";
	responseStream << "\t\t\t<legend>Index prüfen</legend>\n";
	responseStream << "\t\t\t<p class=\"grd_small\">\n";
	responseStream << "\t\t\t\t<label for=\"index\">Index</label>\n";
	responseStream << "\t\t\t\t<input id=\"index\" type=\"text\" name=\"index\" value=\"";
#line 120 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\debugMnemonic.cpsp"
	responseStream << ( form.get("index", "") );
	responseStream << "\"/>\n";
	responseStream << "\t\t\t</p>\n";
	responseStream << "\t\t\t<input type=\"submit\" name=\"check_index\" value=\"Index &uuml;berpr&uuml;fen\"/>\n";
	responseStream << "\t\t\t";
#line 123 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\debugMnemonic.cpsp"
 if(checkedIndex[0].bSet) { 	responseStream << "\n";
	responseStream << "\t\t\t\t<ul class=\"grd-no-style\">\n";
	responseStream << "\t\t\t\t";
#line 125 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\debugMnemonic.cpsp"
 for (int i = ServerConfig::MNEMONIC_GRADIDO_BOOK_GERMAN_RANDOM_ORDER; i < ServerConfig::Mnemonic_Types::MNEMONIC_MAX; i++) { 	responseStream << "\n";
	responseStream << "\t\t\t\t\t<li>\n";
	responseStream << "\t\t\t\t\t";
#line 127 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\debugMnemonic.cpsp"
	responseStream << ( checkedIndex[i].print() );
	responseStream << "\n";
	responseStream << "\t\t\t\t\t</li>\n";
	responseStream << "\t\t\t\t";
#line 129 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\debugMnemonic.cpsp"
 } 	responseStream << "\n";
	responseStream << "\t\t\t\t</ul>\n";
	responseStream << "\t\t\t";
#line 131 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\debugMnemonic.cpsp"
 } 	responseStream << "\n";
	responseStream << "\t\t</fieldset>\n";
	responseStream << "\t</form>\n";
	responseStream << "</div>\n";
	// begin include footer.cpsp
	responseStream << "\t<div class=\"grd-time-used dev-info\">\n";
	responseStream << "\t\t\t";
#line 2 "F:\\Gradido\\gradido_login_server\\src\\cpsp\\footer.cpsp"
	responseStream << ( mTimeProfiler.string() );
	responseStream << "\n";
	responseStream << "\t</div>\n";
	responseStream << "</body>\n";
	responseStream << "</html>";
	// end include footer.cpsp
	responseStream << "\n";
	if (_compressResponse) _gzipStream.close();
}
