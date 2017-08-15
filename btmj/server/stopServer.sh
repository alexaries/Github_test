#!/usr/bin/env bash
DIR="$(cd $(dirname $0); pwd)"
echo $DIR
cd "$DIR"
forever stop ./account_server/app.js
forever stop ./hall_server/app.js
forever stop ./majiang_server/app.js