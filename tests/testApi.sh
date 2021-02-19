#!/bin/bash
cd ..
sudo -u www-data ./vendor/bin/phpunit --testdox tests/TestCase/Controller/StateBalancesControllerTest
cd tests
