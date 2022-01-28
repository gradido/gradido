###############################################################################
# Dockerfile to create an image based on a (debian-based) build already
# containing the necessary tools
# (https://hub.docker.com/r/marketsquare/robotframework-browser):
# - Node.js (for Playwright-based browser library)
# - Python
#   - robotframework module
#   - Robotframework-browser module
###############################################################################

FROM marketsquare/robotframework-browser:v11.2.0

LABEL maintainer="support@ogradido.net"

RUN pip3 install -U pip && pip3 install --no-cache-dir robotframework==4.1.3
