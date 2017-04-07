from flask import Flask, render_template, request, redirect, session
from werkzeug.utils import secure_filename
from server import *
import json, os, sys


app = Flask(__name__)


app.config.update(
    DEBUG=True,
    TEMPLATES_AUTO_RELOAD=True,
    UPLOAD_FOLDER=UPLOAD_PATH,
    SECRET_KEY='secret!'
)


@app.route("/")
def index():
    return redirect("/command")


@app.route("/command")
def index_react():
    import uuid
    title = "Jmeter Cloud Testing"
    session['sid'] = str(uuid.uuid4())
    session["addr"] = request.remote_addr
    return render_template("index_react.html", async_mode=socketio.async_mode, title=title, sessionID = session["sid"])


@app.route("/uploadFiles", methods=['POST'])
def uploadFiles():
    from multiprocessing import Process as P
    taskID = request.form["taskID"]
    files = request.files.getlist("file")
    taskMngr = taskMngrs[session["sid"]]
    for file in files:
        filename = secure_filename(file.filename)
        file.save(os.path.join(app.config['UPLOAD_FOLDER'] + taskID + "/", filename))
    def wrapper():
        path_to_upload = os.path.join(os.getcwd(), app.config['UPLOAD_FOLDER'], taskID)
        if taskMngr.checkStatus(socketio.sleep):
            taskMngr.refreshConnections()
            taskMngr.uploadFiles()
            try:
                taskMngr.setUploadDir(path_to_upload)
                tmp = os.listdir(path_to_upload)
            except:
                tmp = []
            tmp = [ff for ff in tmp if not ff.startswith(".")]
            jmxList = [f for f in tmp if f.endswith(".jmx")]
            socketio.emit('upload_done',json.dumps({"jmxList": jmxList, "files": tmp}), namespace='/redirect', room=taskMngr.sid)
            print("")
        else:
            print("Time out, please check instances status on AWS web console or try again")
    p = P(target=wrapper)
    with jredirectors[taskMngr.sid]:
        p.start()
    return ""


socketio.init_app(app)

if __name__ == "__main__":
    if len(sys.argv)>1 and sys.argv[1]=="server":
        socketio.run(app, host="0.0.0.0", port=80, debug=True)
    else:
        socketio.run(app, debug=True)
