from flask import request, session
from flask_socketio import SocketIO, emit
from .Redisable import redisReady, RedisableManagers
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

# need pause to flush out redirect message
def flushPasuse():
    socketio.sleep(1e-3)

# redirect the messages from all taskMngrs in bg thread
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

# remove some configs that should be invisible to user
def configFilter(config):
    filter_list = set(["aws_access_key_id", "aws_secret_access_key","role", # these are credentials
                       "propertiesPath", "username", "instance_home", "logstash_conf_dir", "pemFilePath", # there aren't change unless AWS side settings are changed
                       "region","zone"]) #
    res = {k:config[k] for k in config if k not in filter_list}
    return res

# parse to json before response
def configJson(config):
    return {'config': json.dumps(configFilter(config), indent="\t")}

# init a new taskmanager,redirector when socket connected
@socketio.on('connect', namespace='/redirect')
def connected():
    global thread, jredirectors, taskMngrs
    taskMngr = JAC.TaskManager(sid=request.sid)
    jredirectors[request.sid] = JAC.Redirector(pauseFunc=flushPasuse)
    if thread is None:
        thread = socketio.start_background_task(target=background_thread)
    taskMngrs[session["tid"]]=taskMngr

# release manager and redirector when socket disconnected
@socketio.on("disconnect",namespace='/redirect')
def disconnected():
    global jredirectors, taskMngrs
    if session['tid'] in taskMngrs:
        del taskMngrs[session["tid"]]
    if request.sid in jredirectors:
        del jredirectors[request.sid]

# send user's config while click create
@socketio.on("get_default_config", namespace="/redirect")
def refreshConfig():
    global customConfigs
    username = session["username"]
    if not username in customConfigs:
        customConfigs[username] = {}
        customConfigs[username].update(JAC.CONFIG)
    # always use the updated credentials
    customConfigs[username].update(session["credentials"])
    emit('config_changed', configJson(customConfigs[username]),room=request.sid)

# user changes configs
@socketio.on("update_config", namespace="/redirect")
def updateConfig(data):
    global customConfigs
    config = data["config"]
    username = session["username"]
    updatedConfig = json.loads(config)
    updatedConfig = {k:updatedConfig[k] for k in updatedConfig if k in customConfigs[username]}
    customConfigs[username].update(updatedConfig)
    socketio.emit('config_updated', {'success':1}, namespace='/redirect', room=request.sid)

# while click resume
@socketio.on("get_task_IDs", namespace="/redirect")
def getTaskIDs():
    refreshConfig()
    li = JAC.InstanceManager(JAC.AWSConfig(**JAC.CONFIG,**session["credentials"])).getDupTaskIds()
    emit("task_IDs",json.dumps(li),room=request.sid)

# start a created task or resume from previous one.
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
    taskMngr=taskMngrs[session["tid"]]
    if not createOrNot and not username==data["user"]:
        if username=="admin":emit("redirect",{"msg":"Admin access.\n"},room=request.sid)
        else:emit("redirect",{"msg":"You are not the owner of this task.\nRead-only access.\n\n"},room=request.sid)
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
            emit('config_changed', configJson(taskMngr.config),room=request.sid)
        print("")
    taskMngrs[session["tid"]] = taskMngr
    emit('task_started',
         json.dumps({"taskID": taskID, "slaveNum": slaveNum, "jmxList": jmxList, "files": files,
                     "description":description, "user":username, "executable":createOrNot or username==data["user"] or username=="admin"}),
         room=taskMngr.sid)

# respective dir should be removed as well
@socketio.on("delete_task", namespace="/redirect")
def delete():
    taskMngr = taskMngrs[session["tid"]]
    with jredirectors[request.sid]:
        taskMngr.cleanup()
        os.system("cd %s && rm -rf %s &"%(UPLOAD_PATH,taskMngr.instMngr.taskID))
    emit("task_deleted",room=request.sid)

# run task, used multiprocessing so it can be stopped
@socketio.on("startRunning", namespace='/redirect')
def runTest(data):
    from multiprocessing import Process as P
    taskID = data["taskID"]
    jmxName = data["jmx_name"]
    taskMngr = taskMngrs[session["tid"]]
    def fakeRun():
        import time
        c=0
        while c<30:
            c+=1
            print(c)
            time.sleep(1)
        emit('task_finished', {'msg': "finished"}, namespace='/redirect', room=taskMngr.sid)
        print("Finished\n")
    def wrapper():
        if taskMngr.checkStatus(socketio.sleep):
            taskMngr.refreshConnections()
            taskMngr.updateRemotehost()
            taskMngr.startSlavesServer()
            socketio.sleep(3)
            #taskMngr.esCheck()############
            taskMngr.runTest(jmxName)
            taskMngr.stopSlavesServer()
            emit('task_finished', {'msg': "finished"}, namespace='/redirect', room=taskMngr.sid)
            print("Finished\n")
        # else: print("Time out, please check instances status on AWS web console or try again")
    p = P(target=fakeRun)
    with jredirectors[taskMngr.sid]:
        p.start()
    processes[taskID] = p

# terminate running process
@socketio.on("stop_task", namespace="/redirect")
def stopRunning(data):
    taskMngr = taskMngrs[session["tid"]]
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
