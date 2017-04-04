from flask import Flask, render_template, request, redirect, session
from flask_socketio import SocketIO, emit
from werkzeug.utils import secure_filename
import json, os
import JmeterAwsConf as JAC

# old part before add socketio
app = Flask(__name__)
app.config.update(
    DEBUG=True,
    TEMPLATES_AUTO_RELOAD=True,
    UPLOAD_FOLDER='uploads/'
)

# new part
# Set this variable to "threading", "eventlet" or "gevent" to test the
# different async modes, or leave it set to None for the application to choose
# the best option based on installed packages.
async_mode = None

app.config['SECRET_KEY'] = 'secret!'
socketio = SocketIO(app, async_mode=async_mode, ping_timeout=6000)
thread = None

taskMngrs = {} # session level
processes = {} # task level
customConfigs = {} # client level


def flushPasuse():
    socketio.sleep(1e-3)


def background_thread():
    while True:
        socketio.sleep(1e-3)
        for sessionID in taskMngrs:
            taskMngr = taskMngrs[sessionID]
            if len(taskMngr.redirector.buff.getvalue()):
                socketio.emit('redirect',
                              {'msg': taskMngr.redirector.flush()},
                              namespace='/redirect',
                              room=taskMngr.sid)


@app.route("/")
def index():
    return redirect("/command")


@app.route("/command")
def index_react():
    import uuid
    title = "Jmeter Cloud Testing"
    #if not "sid" in session:# future work -- refresh but stay previous session
    session['sid'] = str(uuid.uuid4())
    return render_template("index_react.html", async_mode=socketio.async_mode, title=title, sessionID = session["sid"])


@app.route("/post/config", methods=['POST'])
def updateConfig():
    global customConfigs
    config = request.form["config"]
    addr = request.remote_addr
    customConfigs[addr].update(json.loads(config))
    socketio.emit('initial_config',
                  {'config': json.dumps(customConfigs[addr], indent="\t")},
                  namespace='/redirect',
                  room=taskMngrs[session["sid"]].sid)
    return ""


@app.route("/post/taskName", methods=['POST'])
def startTask():
    addr = request.remote_addr
    taskName = request.form["taskName"]
    taskID = request.form["taskID"]
    slaveNum = int(request.form["slaveNum"] if request.form["slaveNum"] else 0)
    files = []
    jmxList = []
    createOrNot = int(request.form["create"])
    description = request.form["description"]
    successOrNot = False
    taskMngr=taskMngrs[session["sid"]]
    with taskMngr.redirector:
        if createOrNot:
            try:
                taskMngr.setConfig(customConfigs[addr])
                taskMngr.startTask(taskName)
                taskID = taskMngr.instMngr.taskID
                taskMngr.setTaskDesc(description)
                taskMngr.setSlaveNumber(slaveNum)
                taskMngr.setupInstances()
                taskDir = "%s%s" % (app.config['UPLOAD_FOLDER'], taskID)
                if not os.path.exists(taskDir): os.mkdir(taskDir)
                with open(os.path.join(app.config['UPLOAD_FOLDER'],taskID,".JAC_config.json"),"w") as f:
                    f.write(json.dumps(taskMngr.config))
                successOrNot = True
            except Exception as exception:
                print(exception)
                taskMngr.cleanup()
        else:
            try:
                config = json.loads(open(app.config['UPLOAD_FOLDER']+taskID+"/.JAC_config.json").read())
            except Exception as e:
                print(e)
                config = JAC.CONFIG
                taskDir = "%s%s" % (app.config['UPLOAD_FOLDER'], taskID)
                print(os.getcwd() )
                if not os.path.exists(taskDir): os.mkdir(taskDir)
                with open(os.path.join(app.config['UPLOAD_FOLDER'],taskID,".JAC_config.json"),"w") as f:
                    f.write(json.dumps(config))
            taskMngr.setConfig(config)
            taskMngr.startTask(taskName, taskID)
            successOrNot = True

        if successOrNot:
            #taskMngr.instMngr.addMaster()#need this if resuming from no master
            slaveNum = len(taskMngr.instMngr.slaves)
            try:
                path_to_upload = os.path.join(os.getcwd(), app.config['UPLOAD_FOLDER'], taskID)
                files = os.listdir(path_to_upload)
                taskMngr.setUploadDir(path_to_upload)
            except:
                files = []
            description = taskMngr.instMngr.getTaskDesc()
            files = [ff for ff in files if not ff.startswith(".")]
            jmxList = [f for f in files if f.endswith(".jmx")]
            socketio.emit('initial_config', {'config': json.dumps(taskMngr.config, indent="\t")},namespace='/redirect',room=taskMngr.sid)
        print("")
    return json.dumps({"taskID": taskID, "slaveNum": slaveNum, "jmxList": jmxList, "files": files, "description":description}), 200 if successOrNot else 400


@app.route("/uploadFiles", methods=['POST'])
def uploadFiles():
    taskID = request.form["taskID"]
    files = request.files.getlist("file")
    taskMngr = taskMngrs[session["sid"]]
    for file in files:
        filename = secure_filename(file.filename)
        file.save(os.path.join(app.config['UPLOAD_FOLDER'] + taskID + "/", filename))
    with taskMngr.redirector:
        path_to_upload = os.path.join(os.getcwd(), app.config['UPLOAD_FOLDER'], taskID)
        if taskMngr.checkStatus(socketio.sleep):
            taskMngr.refreshConnections()
            taskMngr.uploadFiles()
            try:
                taskMngr.setUploadDir(path_to_upload)
                tmp = os.listdir(path_to_upload)
                # taskMngr.setUploadDir(path_to_upload)
            except:
                tmp = []
            tmp = [ff for ff in tmp if not ff.startswith(".")]
            jmxList = [f for f in tmp if f.endswith(".jmx")]
            return json.dumps({"success": True, "jmxList": jmxList, "files": tmp}), 200
        else:
            print("Time out, please check instances status on AWS web console or try again")
    return json.dumps({"success": False}), 400


@app.route("/post/cleanup", methods=["POST"])
def cleanup():
    taskMngr = taskMngrs[session["sid"]]
    with taskMngr.redirector:
        taskMngr.cleanup()
        os.system("cd %s && rm -rf %s &"%(app.config['UPLOAD_FOLDER'],taskMngr.instMngr.taskID))
    return json.dumps({"success": True}), 200


@app.route("/post/defaultconfig", methods=["POST"])
def refreshConfig():
    global customConfigs
    addr = request.remote_addr
    if not addr in customConfigs:
        customConfigs[addr] = {}
        customConfigs[addr].update(JAC.CONFIG)
    socketio.emit('initial_config', {'config': json.dumps(customConfigs[addr], indent="\t")},namespace='/redirect',room=taskMngrs[session["sid"]].sid)
    return ""


@app.route("/post/getTaskIDs", methods=["POST"])
def getTaskIDs():
    li = JAC.InstanceManager(JAC.AWSConfig(**JAC.CONFIG)).getDupTaskIds()
    return json.dumps(li)


@app.route("/post/stop", methods=["POST"])
def stopRunning():
    taskMngr = taskMngrs[session["sid"]]
    with taskMngr.redirector:
        taskID = request.form["taskID"]
        if taskID in processes:
            processes[taskID].terminate()
            del processes[taskID]
        taskMngr.refreshConnections(verbose=False)
        taskMngr.stopMasterJmeter()
        taskMngr.stopSlavesServer()
        socketio.sleep(.5)
        print("Stopped\n")
    return json.dumps({"success": True}), 200


@socketio.on("startRunning", namespace='/redirect')
def runTest(data):
    from multiprocessing import Process as P
    taskID = data["taskID"]
    jmxName = data["jmx_name"]
    taskMngr = taskMngrs[session["sid"]]

    def wrapper():
        if taskMngr.checkStatus(socketio.sleep):
            taskMngr.refreshConnections(verbose=False)
            taskMngr.updateRemotehost()
            taskMngr.startSlavesServer()
            taskMngr.esCheck()
            taskMngr.runTest(jmxName)
            taskMngr.stopSlavesServer()
            emit('taskFinished', {'msg': "finished"}, namespace='/redirect', room=taskMngr.sid)
            print("Finished")
        else: print("Time out, please check instances status on AWS web console or try again")
    p = P(target=wrapper)
    with taskMngr.redirector:
        p.start()
    # wrapper()
    processes[taskID] = p


@socketio.on('connect', namespace='/redirect')
def connected():
    global thread
    if thread is None:
        thread = socketio.start_background_task(target=background_thread)
    # task manager session level
    taskMngrs[session['sid']] = JAC.TaskManager(pauseFunc=flushPasuse,sid=request.sid)

@socketio.on("disconnect",namespace='/redirect')
def disconnected():
    if session['sid'] in taskMngrs: del taskMngrs[session['sid']]


if __name__ == "__main__":
    socketio.run(app, debug=True)
