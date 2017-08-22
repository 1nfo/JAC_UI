#! /bin/bash

# this is shortcut for docker

# need to compile JavaScript
webpack
# start redis server
redis-server --daemonize yes
# start application
python3 /webapp/main.py server
