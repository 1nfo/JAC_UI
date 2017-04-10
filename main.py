from server import *
import sys

if __name__ == "__main__":
    if len(sys.argv)>1 and sys.argv[1]=="server":
        socketio.run(app, host="0.0.0.0", port=80, debug=True)
    else:
        socketio.run(app, debug=True)
