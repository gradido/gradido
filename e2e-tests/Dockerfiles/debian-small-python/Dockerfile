###############################################################################
# Dockerfile to create an image based on a small build of a Debian 11
# The created Linux system will contain:
# - Node.js (for Playwright-based browser library)
# - Python
#   - robotframework module
#   - Robotframework-browser module
###############################################################################

FROM python:3.10.2-slim-bullseye as robotframework-e2e-tests

LABEL maintainer="support@ogradido.net"

# Install Node.js, necessary for the Playwright-based Robotframework-browser library
RUN apt-get update && apt-get install -y apt-utils curl
RUN curl -sL https://deb.nodesource.com/setup_14.x | bash -
RUN apt-get install -y nodejs

# Install Python modules
RUN pip3 install -U pip
RUN pip3 install --no-cache-dir robotframework==4.1.3 robotframework-browser==11.2.0

# initialize the (Playwright) browser library
RUN rfbrowser init
