From phpdockerio/php74-fpm as php-fpm

# Install selected extensions and other stuff
RUN apt-get update \
    && apt-get -y --no-install-recommends install curl php7.4-curl php7.4-fpm php7.4-mbstring php7.4-intl php7.4-xml php7.4-pdo php7.4-mysql\
    && apt-get clean; rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/* /usr/share/doc/*


WORKDIR "/var/www/cakephp"