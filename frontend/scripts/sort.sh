#!/bin/bash

ROOT_DIR=$(dirname "$0")/..

exit_code=0

for locale_file in $ROOT_DIR/src/locales/*.json
do
  jq -M 'to_entries | sort_by(.key) | from_entries' "$locale_file" > tmp.json

  if [ "$*" == "--fix" ]
  then
    mv tmp.json "$locale_file"
  else
    if ! diff -q tmp.json "$locale_file" > /dev/null ;
    then
      exit_code=1
      echo "$(basename -- "$locale_file") is not sorted by keys"
    fi
  fi
done

rm -f tmp.json
exit $exit_code
