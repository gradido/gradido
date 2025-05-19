#!/bin/sh

mkdir -p src/assets/css

SRC="src/assets/scss/gradido.scss"
DEST="src/assets/css/gradido.css"
NODE_PATH="../node_modules"
SCSS_PATH="src/assets/scss"

MODE="compile"
if [ "$1" = "watch" ]; then
    MODE="watch"
fi

COMPILER="sass"
if [ "$2" != "sass" ] && command -v grass >/dev/null 2>&1; then
  COMPILER="grass"
fi

if [ "$COMPILER" = "grass" ]; then
    echo "Use Grass for $MODE SCSS"
    if [ "$MODE" = "watch" ]; then
        grass --watch $SCSS_PATH --load-path $NODE_PATH --load-path $SCSS_PATH $SRC $DEST
    else
        grass -s compressed --load-path $NODE_PATH --load-path $SCSS_PATH $SRC $DEST
    fi
else
    echo "Use Sass for $MODE SCSS"
    if [ "$MODE" = "watch" ]; then
        sass -w --load-path=$NODE_PATH --load-path=$SCSS_PATH $SRC $DEST
    else
        sass --style=compressed \
             --silence-deprecation=import \
             --silence-deprecation=global-builtin \
             --silence-deprecation=color-functions \
             --load-path="$NODE_PATH" --load-path="$SCSS_PATH" "$SRC":"$DEST"
    fi
fi
