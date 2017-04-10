from flask import request, session
from flask_socketio import SocketIO, emit
from .Memcached import redisReady, RedisableManagers
import json, os
import JmeterAwsConf as JAC

UPLOAD_PATH = 'uploads/'

#socket io

# Set this variable to "threading", "eventlet" or "gevent" to test the
# different async modes, or leave it set to None for the application to choose
# the best option based on installed packages.
_async_mode = None

socketio = SocketIO(async_mode=_async_mode, ping_timeout=6000)
thread = None

# redis memcacached
taskMngrs = dict() if not redisReady() else RedisableManagers()

# these global variables could be problem in the future
jredirectors = {}
processes = {} # task level
customConfigs = {} # client level


def flushPasuse():
    socketio.sleep(1e-3)


def background_thread():
    while True:
        socketio.sleep(1e-3)
        for sid in jredirectors:
            r = jredirectors[sid]
            if len(r.buff.getvalue()):
                socketio.emit('redirect',
                              {'msg': r.flush()},
                              namespace='/redirect',
                              room=sid)


@socketio.on('connect', namespace='/redirect')
def connected():
    global thread, jredirectors, taskMngrs
    taskMngr = JAC.TaskManager(pauseFunc=flushPasuse,sid=request.sid)
    jredirectors[request.sid] = JAC.Redirector(pauseFunc=flushPasuse)
    if thread is None:
        thread = socketio.start_background_task(target=background_thread)
    taskMngrs[session["sid"]]=taskMngr


@socketio.on("disconnect",namespace='/redirect')
def disconnected():
    global jredirectors, taskMngrs
    if session['sid'] in taskMngrs:
        del taskMngrs[session["sid"]]
    if request.sid in jredirectors:
        del jredirectors[request.sid]


@socketio.on("get_default_config", namespace="/redirect")
def refreshConfig():
    global customConfigs
    username = session["username"]
    if not username in customConfigs:
        customConfigs[username] = {}
        customConfigs[username].update(JAC.CONFIG)
    emit('config_changed', {'config': json.dumps(customConfigs[username], indent="\t")},room=request.sid)


@socketio.on("update_config", namespace="/redirect")
def updateConfig(data):
    global customConfigs
    config = data["config"]
    username = session["username"]
    customConfigs[username].update(json.loads(config))
    socketio.emit('config_updated', {'success':1}, namespace='/redirect', room=request.sid)


@socketio.on("get_task_IDs", namespace="/redirect")
def getTaskIDs():
    li = JAC.InstanceManager(JAC.AWSConfig(**JAC.CONFIG)).getDupTaskIds()
    emit("task_IDs",json.dumps(li),room=request.sid)


@socketio.on("start_task", namespace="/redirect")
def startTask(data):
    username = session["username"]
    taskName = data["taskName"]
    taskID = data["taskID"]
    slaveNum = int(data["slaveNum"] if data["slaveNum"] else 0)
    files = []
    jmxList = []
    createOrNot = int(data["create"])
    description = data["description"]
    successOrNot = False
    taskMngr=taskMngrs[session["sid"]]
    with jredirectors[request.sid]:
        if createOrNot:
            try:
                taskMngr.setConfig(customConfigs[username])
                taskMngr.create(taskName,user=username)
                taskID = taskMngr.instMngr.taskID
                taskMngr.setTaskDesc(description)
                taskMngr.setSlaveNumber(slaveNum)
                taskMngr.setupInstances()
                taskDir = "%s%s" % (UPLOAD_PATH, taskID)
                if not os.path.exists(taskDir): os.mkdir(taskDir)
                with open(os.path.join(UPLOAD_PATH,taskID,".JAC_config.json"),"w") as f:
                    f.write(json.dumps(taskMngr.config))
                successOrNot = True
            except Exception as exception:
                print(exception)
                taskMngr.cleanup()
        else:
            try:
                config = json.loads(open(UPLOAD_PATH+taskID+"/.JAC_config.json").read())
            except Exception as e:
                print(e)
                config = JAC.CONFIG
                taskDir = "%s%s" % (UPLOAD_PATH, taskID)
                if not os.path.exists(taskDir): os.mkdir(taskDir)
                with open(os.path.join(UPLOAD_PATH,taskID,".JAC_config.json"),"w") as f:
                    f.write(json.dumps(config))
            taskMngr.setConfig(config)
            taskMngr.resume(taskName, taskID)
            successOrNot = True

        if successOrNot:
            #taskMngr.instMngr.addMaster()#need this if resuming from no master
            slaveNum = len(taskMngr.instMngr.slaves)
            try:
                path_to_upload = os.path.join(os.getcwd(), UPLOAD_PATH, taskID)
                files = os.listdir(path_to_upload)
                taskMngr.setUploadDir(path_to_upload)
            except:
                files = []
            description = taskMngr.instMngr.getTaskDesc()
            files = [ff for ff in files if not ff.startswith(".")]
            jmxList = [f for f in files if f.endswith(".jmx")]
            emit('config_changed', {'config': json.dumps(taskMngr.config, indent="\t")},room=request.sid)
        print("")
    taskMngrs[session["sid"]] = taskMngr
    emit('task_started',
         json.dumps({"taskID": taskID, "slaveNum": slaveNum, "jmxList": jmxList, "files": files, "description":description}),
         room=taskMngr.sid)


@socketio.on("delete_task", namespace="/redirect")
def delete():
    taskMngr = taskMngrs[session["sid"]]
    with jredirectors[request.sid]:
        taskMngr.cleanup()
        os.system("cd %s && rm -rf %s &"%(UPLOAD_PATH,taskMngr.instMngr.taskID))
    emit("task_deleted",room=request.sid)


@socketio.on("startRunning", namespace='/redirect')
def runTest(data):
    from multiprocessing import Process as P
    taskID = data["taskID"]
    jmxName = data["jmx_name"]
    taskMngr = taskMngrs[session["sid"]]
    def wrapper():
        if taskMngr.checkStatus(socketio.sleep):
            taskMngr.refreshConnections()
            taskMngr.updateRemotehost()
            taskMngr.startSlavesServer()
            #taskMngr.esCheck()############
            taskMngr.runTest(jmxName)
            taskMngr.stopSlavesServer()
            emit('task_finished', {'msg': "finished"}, namespace='/redirect', room=taskMngr.sid)
            print("Finished")
        else: print("Time out, please check instances status on AWS web console or try again")
    p = P(target=wrapper)
    with jredirectors[taskMngr.sid]:
        p.start()
    # wrapper()
    processes[taskID] = p


@socketio.on("stop_task", namespace="/redirect")
def stopRunning(data):
    taskMngr = taskMngrs[session["sid"]]
    with jredirectors[request.sid]:
        taskID = data["taskID"]
        if taskID in processes:
            processes[taskID].terminate()
            del processes[taskID]
        taskMngr.refreshConnections(verbose=False)
        taskMngr.stopMasterJmeter()
        taskMngr.stopSlavesServer()
        socketio.sleep(.5)
        print("Stopped\n")
    emit("task_stopped",room=request.sid)
