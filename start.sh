#! /bin/bash

# this is shortcut for docker
redis-server --daemonize yes
python3 /webapp/main.py server
