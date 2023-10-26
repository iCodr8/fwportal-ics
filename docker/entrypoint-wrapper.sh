#!/bin/bash

printenv > /fwportal-ics/.env && cron && /docker-entrypoint.sh "$@"
