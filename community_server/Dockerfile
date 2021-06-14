FROM phpdockerio/php74-fpm as community_server

# install php fpm 
RUN apt-get update \
    && apt-get -y --no-install-recommends install curl unzip php7.4-curl php7.4-fpm php7.4-mbstring php7.4-intl php7.4-xml php7.4-pdo php7.4-mysql php7.4-xdebug \
    && apt-get clean; rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/* /usr/share/doc/*

WORKDIR /var/www/cakephp
RUN mkdir logs && mkdir tmp && chmod 777 logs && chmod 777 tmp 
COPY ./community_server/ .
COPY ./configs/community_server/app.php ./config/

RUN composer update
RUN composer dump-autoload

#########  special for code coverage and testing
FROM community_server as test


RUN apt-get update \
    && apt-get -y --no-install-recommends install php7.4-xdebug  \
    && apt-get clean; rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/* /usr/share/doc/*


ENV XDEBUG_MODE=coverage
#RUN composer require --dev rregeer/phpunit-coverage-check

#CMD ./vendor/bin/phpunit  --coverage-clover=./webroot/coverage/clover.xml
CMD ./vendor/bin/phpunit  --coverage-text=./webroot/coverage/coverage.info

