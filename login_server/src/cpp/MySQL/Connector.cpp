//
// MySQLException.cpp
//
// Library: Data/MySQL
// Package: MySQL
// Module:  Connector
//
// Copyright (c) 2008, Applied Informatics Software Engineering GmbH.
// and Contributors.
//
// SPDX-License-Identifier:	BSL-1.0
//


#include "Poco/Connector.h"
#include "Poco/SessionImpl.h"
#include "Poco/Data/SessionFactory.h"
#include "Poco/Exception.h"
#include <mysql.h>

#include "../ServerConfig.h"
#include "../Crypto/DRRandom.h"

namespace Poco {
namespace Data {
namespace MySQL {


std::string Connector::KEY("mysql");


Connector::Connector()
{
}


Connector::~Connector()
{
}


const std::string& Connector::name() const
{
	return KEY;
}


Poco::AutoPtr<Poco::Data::SessionImpl> Connector::createSession(const std::string& connectionString,
	std::size_t timeout)
{
	return Poco::AutoPtr<Poco::Data::SessionImpl>(new SessionImpl(connectionString, timeout));
}


void Connector::registerConnector()
{
    try {

        if (mysql_library_init(0, nullptr, nullptr) != 0)
        {
            throw Exception("mysql_library_init error");
        }
    } catch(std::exception &ex) {
        printf("mysql exception: \n");
    }
	ServerConfig::g_ServerKeySeed->put(4, DRRandom::r64());
	Poco::Data::SessionFactory::instance().add(new Connector());
}


void Connector::unregisterConnector()
{
	Poco::Data::SessionFactory::instance().remove(KEY);
	mysql_library_end();
}


} } } // namespace Poco::Data::MySQL

