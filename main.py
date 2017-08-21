from server import *
import sys, os

# from eventlet import wsgi
# import eventlet

if __name__ == "__main__":
    DEBUG = True
    if "cmd" in sys.argv:
        cmd = sys.argv.index("cmd")+1
        if len(sys.argv)>cmd:
            exec(sys.argv[cmd])
    elif "server" in sys.argv:
        ## socketio.run(app) runs a production ready server if eventlet installed
        #  the two commands below should be equivalent.
        #  wsgi.server(eventlet.listen(('', 80)), app)
        #  socketio.run(app,host="0.0.0.0",port=80)
        socketio.run(app, host="0.0.0.0", port=80, debug=False)
    else:
        socketio.run(app, debug=DEBUG)
