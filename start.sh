#! /bin/bash
redis-server --daemonize yes
python3 /webapp/main.py server
