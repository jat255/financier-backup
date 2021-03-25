#!/bin/bash

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"

cd "${DIR}"
source .env
node index.js

if [ -z ${DESTINATION+x} ]; then 
  echo "Not moving any files because DESTINATION was not set"
else 
  echo "Moving backup file to ${DESTINATION}"
  mv *backup.json "${DESTINATION}"
fi