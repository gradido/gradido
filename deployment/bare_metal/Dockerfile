##### Base Image ##########################################################################
## This image is used to test start.sh  ###################################################
###########################################################################################
FROM debian:12 as base

ARG BRANCH_NAME=master


#RUN apt update && apt install -y \
 # python3-systemd \
  #git \
  #mariadb-server \
  #nginx \
  #curl \
  #build-essential \
  #gnupg \
  #logrotate \
  #automysqlbackup \
  #expect

RUN apt update && apt install -y \
  bash \
  git \
  mariadb-server \
  nginx \
  gettext \
  curl \ 
  gcc

##### Install Image #######################################################################
## Simulate parts from install script to get a minimal configuration to test start script #
###########################################################################################
FROM base as install

WORKDIR /app

ARG BRANCH_NAME=master
ENV BRANCH_NAME=$BRANCH_NAME
# COPY . .
RUN git clone https://github.com/gradido/gradido.git --branch $BRANCH_NAME 
RUN cp /app/gradido/deployment/bare_metal/.env.dist /app/gradido/deployment/bare_metal/.env
RUN sed -i 's/^URL_PROTOCOL=https$/URL_PROTOCOL=http/' /app/gradido/deployment/bare_metal/.env
RUN sed -i 's/^COMMUNITY_HOST=gddhost.tld$/COMMUNITY_HOST=localhost/' /app/gradido/deployment/bare_metal/.env


# setup nginx
WORKDIR /app/gradido/deployment/bare_metal/nginx
RUN rm /etc/nginx/sites-enabled/default
RUN mkdir log
ENV NGINX_UPDATE_PAGE_ROOT=/app/gradido/deployment/bare_metal/nginx/update-page
ENV GRADIDO_LOG_PATH=/app/gradido/deployment/bare_metal/nginx/log
ENV COMMUNITY_HOST=_
RUN envsubst "$(env | sed -e 's/=.*//' -e 's/^/\$/g')" < ./sites-available/gradido.conf.template > ./sites-available/gradido.conf
RUN envsubst "$(env | sed -e 's/=.*//' -e 's/^/\$/g')" < ./sites-available/update-page.conf.template > ./sites-available/update-page.conf
RUN mkdir ./sites-enabled
RUN ln -s /app/gradido/deployment/bare_metal/nginx/sites-available/update-page.conf /app/gradido/deployment/bare_metal/nginx/sites-enabled/default
RUN ln -s /app/gradido/deployment/bare_metal/nginx/sites-enabled/default /etc/nginx/sites-enabled
RUN ln -s /app/gradido/deployment/bare_metal/nginx/common /etc/nginx/
RUN rmdir /etc/nginx/conf.d
RUN ln -s /app/gradido/deployment/bare_metal/nginx/conf.d /etc/nginx/

SHELL ["/bin/bash", "--login", "-c"]
RUN curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
RUN nvm install 16 && nvm use 16 && nvm alias default 16

# Add nvm to PATH for future RUN instructions
ENV NODE_VERSION=16 \
    PATH=$NVM_DIR/versions/node/v16/bin:$PATH

# Install yarn
RUN npm i -g yarn

# Install pm2
RUN npm i -g pm2 && pm2 startup

WORKDIR /app/gradido
# Configure database
ENV DB_USER=root
ENV DB_PASSWORD=
RUN envsubst "$(env | sed -e 's/=.*//' -e 's/^/\$/g')" < database/.env.template > database/.env

# Configure backend
RUN JWT_SECRET=$(< /dev/urandom tr -dc _A-Z-a-z-0-9 | head -c 32; echo);
RUN envsubst "$(env | sed -e 's/=.*//' -e 's/^/\$/g')" < backend/.env.template > backend/.env

# Configure frontend
RUN envsubst "$(env | sed -e 's/=.*//' -e 's/^/\$/g')" < frontend/.env.template > frontend/.env

# Configure admin
RUN envsubst "$(env | sed -e 's/=.*//' -e 's/^/\$/g')" < admin/.env.template > admin/.env

# Configure dht-node
RUN FEDERATION_DHT_SEED=$(< /dev/urandom tr -dc a-f0-9 | head -c 32; echo);
RUN envsubst "$(env | sed -e 's/=.*//' -e 's/^/\$/g')" < dht-node/.env.template > dht-node/.env

# Configure federation
RUN envsubst "$(env | sed -e 's/=.*//' -e 's/^/\$/g')" < federation/.env.template > federation/.env

##### Start Image #########################################################################
## This image is used to test start.sh  ###################################################
###########################################################################################
FROM install as start

WORKDIR /app/gradido/deployment/bare_metal

# mock sudo
RUN echo -e '#!/bin/bash\nshift 0\nexec "$@"' > /usr/local/bin/sudo && \
    chmod +x /usr/local/bin/sudo
SHELL ["/bin/bash", "--login", "-c"]
RUN ./start.sh $BRANCH_NAME


