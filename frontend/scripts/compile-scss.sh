#!/bin/bash

# check if grass as rust based scss compiler is installed
if command -v grass &> /dev/null
then
    echo "Use Grass for compiling SCSS"
    grass --load-path=node_modules --load-path=src/assets/scss src/assets/scss/gradido.scss src/assets/css/gradido.css
else
    echo "Use Sass for compiling SCSS"
    sass --load-path=node_modules --load-path=src/assets/scss src/assets/scss/gradido.scss src/assets/css/gradido.css
fi
