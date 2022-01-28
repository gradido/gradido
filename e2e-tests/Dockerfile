###############################################################################
# Dockerfile to create an image based on a small debian-based build
# provided by the creators of the Robotframework browser library
# (https://github.com/MarketSquare/robotframework-browser)
# powered by the modern contemporary browser automation tool Playwright
# (https://playwright.dev/)
#
# The Docker image will contain the tools necessary for our Robtframework-based
# end-to-end test frame work:
# - Node.js for Playwright-based browser library
# - Python
#   - robotframework module
#   - Robotframework-browser module
###############################################################################

FROM marketsquare/robotframework-browser:v11.2.0

LABEL maintainer="support@ogradido.net"

# update Python robotframework library module to required version
RUN pip3 install -U pip && pip3 install --no-cache-dir robotframework==4.1.3
