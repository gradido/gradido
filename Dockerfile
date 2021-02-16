FROM nginx

# install php fpm 
RUN apt-get update \
    && apt-get -y --no-install-recommends install curl unzip php7.3-curl php7.3-fpm php7.3-mbstring php7.3-intl php7.3-xml php7.3-pdo php7.3-mysql \
    && apt-get clean; rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/* /usr/share/doc/*
	
# install composer
COPY --from=composer:latest /usr/bin/composer /usr/local/bin/composer

WORKDIR /usr/share/nginx/html

COPY . .
COPY ./config/nginx/nginx.conf /etc/nginx/sites-enabled/nginx.conf
RUN composer update --no-scripts --no-autoloader