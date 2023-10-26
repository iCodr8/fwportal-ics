#!/bin/bash

printenv | sed 's/^\(.*\)$/export \1/g' > /root/env.sh && cron && /docker-entrypoint.sh "$@"
