from flask import Flask, render_template, request, redirect
from flask_socketio import SocketIO, emit
from werkzeug.utils import secure_filename
import json
import os
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

taskMngrs = {}
processes = {}

customConfig = {}


def flushPasuse():
    socketio.sleep(1e-3)


jredirector = JAC.Redirector(pauseFunc=flushPasuse)


# msg_to_emit=""


def background_thread():
    while True:
        socketio.sleep(1e-3)
        # if msg_to_emit or len(jredirector.buff.getvalue()):
        if len(jredirector.buff.getvalue()):
            socketio.emit('redirect', {'msg': jredirector.flush()}, namespace='/redirect')


# @socketio.on("ack",namespace="/redirect")
# def ackCallBack():
# 	global msg_to_emit
# 	# sys.__stdout__.write("\n\nack last msg --> "+msg_to_emit+"\n\n")
# 	msg_to_emit = jredirector.flush()


@app.route("/")
def index():
    return redirect("/react")


@app.route("/react")
def index_react():
    title = "Jmeter Cloud Testing"
    return render_template("index_react.html", async_mode=socketio.async_mode, title=title)


@app.route("/post/config", methods=['POST'])
def updateConfig():
    global customConfig
    config = request.form["config"]
    customConfig.update(json.loads(config))
    print(customConfig)
    socketio.emit('initial_config', {'config': json.dumps(customConfig, indent="\t")},namespace='/redirect')
    return ""


@app.route("/post/taskName", methods=['POST'])
def startTask():
    taskName = request.form["taskName"]
    taskID = request.form["taskID"]
    slaveNum = int(request.form["slaveNum"] if request.form["slaveNum"] else 0)
    files = []
    jmxList = []
    createOrNot = int(request.form["create"])
    description = request.form["description"]
    successOrNot = False
    with jredirector:
        if createOrNot:
            try:
                taskMngr = JAC.TaskManager(config=customConfig)
                taskMngr.startTask(taskName)
                taskID = taskMngr.instMngr.taskID
                taskMngr.instMngr.mute()
                taskMngr.connMngr.mute()
                taskMngr.setTaskDesc(description)
                taskMngr.setSlaveNumber(slaveNum)
                taskMngr.setupInstances()
                os.system("cd %s && mkdir %s" % (app.config['UPLOAD_FOLDER'], taskID))
                with open(app.config['UPLOAD_FOLDER']+taskID+"/.JAC_config.json","w") as f:
                    f.write(json.dumps(taskMngr.config))
                successOrNot = True
            except Exception as exception:
                print(exception)
                taskMngr.instMngr.mute()
                taskMngr.mute()
                taskMngr.cleanup()
        else:
            try:
                config = json.loads(open(app.config['UPLOAD_FOLDER']+taskID+"/.JAC_config.json").read())
            except Exception as e:
                print(e)
                config = JAC.CONFIG
            taskMngr = JAC.TaskManager(config=config)
            taskMngr.startTask(taskName, taskID)
            taskMngr.instMngr.mute()
            taskMngr.connMngr.mute()
            successOrNot = True

        if successOrNot:
            taskMngrs[taskID] = taskMngr
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
            socketio.emit('initial_config', {'config': json.dumps(taskMngr.config, indent="\t")},namespace='/redirect')
        print("")
    return json.dumps({"taskID": taskID, "slaveNum": slaveNum, "jmxList": jmxList, "files": files, "description":description}), 200 if successOrNot else 400


# @app.route("/post/slaveNum",methods = ['POST'])
# def setSlaveNum():
# 	num = int(request.form["slaveNum"])
# 	taskID = request.form["taskID"]
# 	with jredirector:
# 		taskMngrs[taskID].setSlaveNumber(num)
# 		taskMngrs[taskID].setupInstances()
# 	return "from server: "+str(num)


@app.route("/uploadFiles", methods=['POST'])
def uploadFiles():
    taskID = request.form["taskID"]
    files = request.files.getlist("file")
    for file in files:
        filename = secure_filename(file.filename)
        file.save(os.path.join(app.config['UPLOAD_FOLDER'] + taskID + "/", filename))
    with jredirector:
        taskMngr = taskMngrs[taskID]
        taskMngr.setUploadDir(os.getcwd() + "/" + app.config['UPLOAD_FOLDER'] + taskID)
        if taskMngr.checkStatus():
            taskMngr.refreshConnections()
            taskMngr.uploadFiles()
            try:
                path_to_upload = os.path.join(os.getcwd(), app.config['UPLOAD_FOLDER'], taskID)
                tmp = os.listdir(path_to_upload)
                taskMngr.setUploadDir(path_to_upload)
            except:
                tmp = []
            tmp = [ff for ff in tmp if not ff.startswith(".")]
            jmxList = [f for f in tmp if f.endswith(".jmx")]
            return json.dumps({"success": True, "jmxList": jmxList, "files": tmp}), 200
        else:
            print("Time out, please check instances status on AWS web console or try again")
    return json.dumps({"success": False}), 400


@socketio.on("startRunning", namespace='/redirect')
def runTest(data):
    from multiprocessing import Process as P
    taskID = data["taskID"]
    jmxName = data["jmx_name"]
    taskMngr = taskMngrs[taskID]

    def wrapper():
        if taskMngr.checkStatus():
        # if taskMngr.instMngr.master is None: print("No Master running!")
        # else:
        # taskMngr.refreshConnections()
        # taskMngr.uploadFiles()
            taskMngr.refreshConnections(verbose=False)
            taskMngr.updateRemotehost()
            taskMngr.startSlavesServer()
            taskMngr.esCheck()
            taskMngr.runTest(jmxName)
            taskMngr.stopSlavesServer()
            emit('taskFinished', {'msg': "finished"}, namespace='/redirect')
            print("Finished")
        else: print("Time out, please check instances status on AWS web console or try again")
    p = P(target=wrapper)
    with jredirector:
        p.start()
    # wrapper()
    processes[taskID] = p


@app.route("/post/cleanup", methods=["POST"])
def cleanup():
    taskID = request.form["taskID"]
    with jredirector:
        taskMngrs[taskID].cleanup()
    del taskMngrs[taskID]
    return json.dumps({"success": True}), 200


@socketio.on('connect', namespace='/redirect')
def test_connect():
    global thread
    if thread is None:
        thread = socketio.start_background_task(target=background_thread)


@app.route("/get/defaultconfig", methods=["GET"])
def refreshConfig():
    global customConfig
    customConfig.update(JAC.CONFIG)
    socketio.emit('initial_config', {'config': json.dumps(customConfig, indent="\t")},namespace='/redirect')
    return ""


@app.route("/post/getTaskIDs", methods=["POST"])
def getTaskIDs():
    li = JAC.TaskManager(config=JAC.CONFIG).instMngr.getDupTaskIds()
    return json.dumps(li)


@app.route("/post/stop", methods=["POST"])
def stopRunning():
    with jredirector:
        taskID = request.form["taskID"]
        taskMngr = taskMngrs[taskID]
        if taskID in processes:
            processes[taskID].terminate()
        taskMngr.refreshConnections(verbose=False)
        taskMngr.stopMasterJmeter()
        taskMngr.stopSlavesServer()
        socketio.sleep(.5)
        print("Stopped\n")
    return json.dumps({"success": True}), 200


if __name__ == "__main__":
    socketio.run(app, debug=True)
