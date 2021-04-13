#!/bin/bash
#sudo -u www-data ./vendor/bin/phpunit --filter testIndex tests/TestCase/Controller/TransactionJsonRequestHandlerControllerTest

sudo -u www-data ./vendor/bin/phpunit --testdox tests/TestCase/Controller/JsonRequestHandlerControllerTest

