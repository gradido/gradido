FROM nginx:latest

WORKDIR /var/www/cakephp

COPY ./nginx/nginx.conf /etc/nginx/conf.d/default.conf
COPY ./nginx/fastcgi.conf /etc/nginx/
COPY ./nginx/mime.types /etc/nginx/

COPY ./community_server/webroot webroot

