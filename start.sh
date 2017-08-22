#! /bin/bash

# this is shortcut for docker

# need to compile JavaScript
webpack
# start redis server
redis-server --daemonize yes
# start flask
# python3 /webapp/main.py server-debug
# start flask in debug mode
python3 /webapp/main.py server-debug

