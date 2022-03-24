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