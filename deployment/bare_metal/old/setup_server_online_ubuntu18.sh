# nginx security
sudo cat << "EOF" > ssl.conf
##
        # SSL Settings
        ##

        # disable SSLv3(enabled by default since nginx 0.8.19) since it's less secure then TLS http://en.wikipedia.org/wiki/Secure_Sockets_Layer#SSL_3.0
        ssl_protocols TLSv1 TLSv1.1 TLSv1.2; # Dropping SSLv3, ref: POODLE

        # enables server-side protection from BEAST attacks
        # http://blog.ivanristic.com/2013/09/is-beast-still-a-threat.html
        ssl_prefer_server_ciphers on;

        # enable session resumption to improve https performance
        # http://vincent.bernat.im/en/blog/2011-ssl-session-reuse-rfc5077.html
        ssl_session_cache shared:SSL:50m;
        ssl_session_timeout 1d;
        ssl_session_tickets off;

        # ciphers chosen for forward secrecy and compatibility
        # http://blog.ivanristic.com/2013/08/configuring-apache-nginx-and-openssl-for-forward-secrecy.html
        ssl_ciphers 'ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-AES128-SHA256:ECDHE-RSA-AES128-SHA256:ECDHE-ECDSA-AES128-SHA:ECDHE-RSA-AES256-SHA384:ECDHE-RSA-AES128-SHA:ECDHE-ECDSA-AES256-SHA384:ECDHE-ECDSA-AES256-SHA:ECDHE-RSA-AES256-SHA:DHE-RSA-AES128-SHA256:DHE-RSA-AES128-SHA:DHE-RSA-AES256-SHA256:DHE-RSA-AES256-SHA:ECDHE-ECDSA-DES-CBC3-SHA:ECDHE-RSA-DES-CBC3-SHA:EDH-RSA-DES-CBC3-SHA:AES128-GCM-SHA256:AES256-GCM-SHA384:AES128-SHA256:AES256-SHA256:AES128-SHA:AES256-SHA:DES-CBC3-SHA:!DSS';

        # enable ocsp stapling (mechanism by which a site can convey certificate revocation information to visitors in a privacy-preserving, scalable manner)
        # http://blog.mozilla.org/security/2013/07/29/ocsp-stapling-in-firefox/
        resolver 8.8.8.8 8.8.4.4;
        ssl_stapling on;
        ssl_stapling_verify on;
        #  ssl_trusted_certificate /etc/nginx/ssl/star_forgott_com.crt;

        # config to enable HSTS(HTTP Strict Transport Security) https://developer.mozilla.org/en-US/docs/Security/HTTP_Strict_Transport_Security
        # to avoid ssl stripping https://en.wikipedia.org/wiki/SSL_stripping#SSL_stripping
        # also https://hstspreload.org/
        add_header Strict-Transport-Security "max-age=31536000; includeSubdomains; preload";
EOF

cd /etc/nginx/conf.d
sudo cat <<EOF > logging.conf
log_format main '$http_x_forwarded_for - $remote_user [$time_local] '
 '"$request_method $scheme://$host$request_uri $server_protocol" '
 '$status $body_bytes_sent "$http_referer" '
 '"$http_user_agent" $request_time';
EOF
 
# fail2ban enable blocking to many http request resulting in forbidden 
echo "fail2ban config"
cd /etc/fail2ban/filter.d
sudo cat <<EOF > nginx-forbidden.conf
[Definition]
failregex = ^.*\[error\] \d+#\d+: .* forbidden .*, client: <HOST>, .*$

ignoreregex =
EOF

cd /etc/fail2ban/jail.d
sudo cat <<EOF > nginx-forbidden.conf
[nginx-forbidden]
enabled = true
filter = nginx-forbidden
port = http,https
logpath = /var/log/nginx/*error*.log
findtime = 60
bantime = 6000
maxretry = 3
EOF

sudo service fail2ban restart

# phpmyadmin
echo "install and secure phpmyadmin"
sudo apt install phpmyadmin
cd /etc/phpmyadmin/conf.d
sudo cat <<EOF > pma_secure.php
<?php

# PhpMyAdmin Settings
# This should be set to a random string of at least 32 chars
$cfg['blowfish_secret'] = '3!#32@3sa(+=_4?),5XP_:U%%8\34sdfSdg43yH#{o';

$i=0;
$i++;

$cfg['Servers'][$i]['auth_type'] = 'cookie';
$cfg['Servers'][$i]['AllowNoPassword'] = false;
$cfg['Servers'][$i]['AllowRoot'] = false;

?>
EOF
phpmyadminPwd = $(openssl passwd)
echo "Please give a username for phpmyadmin, but not root"
read phpmyadmin_user
# TODO: check if phpmyadmin_user isn't really root
sudo cat <<EOF > /etc/nginx/pma_pass 
$phpmyadmin_user:$phpmyadminPwd
EOF

serverIP = $(ifconfig | grep -Eo 'inet (addr:)?([0-9]*\.){3}[0-9]*' | grep -Eo '([0-9]*\.){3}[0-9]*' | grep -v '127.0.0.1')

sudo cat <<EOF > /etc/nginx/sites-available/phpmyadmin 

server {
        listen 80 ;

        listen [::]:80;
        server_name $serverIP;


        location ~* \.(png|jpg|ico)$ {
          expires 30d;
        }

        location ~* \.(js|css) {
          expires 30d;
        }
		
		location /phpmyadmin {
			root /usr/share/phpmyadmin
			index index.php;
			
			location ~ \.php$ {
			  include snippets/fastcgi-php.conf;
			  fastcgi_pass unix:/run/php/php7.4-fpm.sock;
			}
			
			location / {
                try_files $uri $uri/ /index.php?$args;
			}
		}

        location ~ /\.ht {
          deny  all;
        }

        access_log /var/log/nginx/access.log main;
}

EOF
sudo ln -s /etc/nginx/sites-available/phpmyadmin /etc/nginx/sites-enabled 