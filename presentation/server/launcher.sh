#!/usr/bin/env bash

PROCESS_NAME=yarn

PROCESS_COMMAND='yarn start'

while true;
do
    ps auxw | grep -v grep | grep $PROCESS_NAME > /dev/null || $PROCESS_COMMAND
done
