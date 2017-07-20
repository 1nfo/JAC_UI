from flask import request, session
from flask_socketio import SocketIO, emit
from .Redisable import redisReady, RedisableManagers
from botocore.exceptions import ClientError, ParamValidationError
import json, os
from . import JmeterAwsConf as JAC

UPLOAD_PATH = 'uploads/'

#socket io

# Set this variable to "threading", "eventlet" or "gevent" to test the
# different async modes, or leave it set to None for the application to choose
# the best option based on installed packages.
_async_mode = None

socketio = SocketIO(async_mode=_async_mode, ping_timeout=6000)
thread = None

# redis memcacached
clusterMngrs = dict() if not redisReady() else RedisableManagers()

# these global variables could be problem in the future
jredirectors = {}
processes = {} # cluster level
customConfigs = {} # user level

# need pause to flush out redirect message
def flushPasuse():
    socketio.sleep(1e-3)

# redirect the messages from all clusterMngrs in bg thread
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
    filter_list = set(["aws_access_key_id", "aws_secret_access_key","role" # these are credentials
                       # , "propertiesPath", "username", "instance_home", "logstash_conf_dir", "pemFilePath" # there is no changes unless AWS side settings changed
                       # , "region","zone"# won't change under current assumption
                       ])
    res = {k:config[k] for k in config if k not in filter_list}
    return res

# parse to json before return response
def configJson(config):
    return {'config': json.dumps(configFilter(config), indent="\t")}

# update date customConfigs right after login (i.e. right before redirect to endpoint /command or /credential),
# so that cluster manager can be initialized.
def init_costom_config():
    global customConfigs
    username = session["username"]
    if not username in customConfigs:
        customConfigs[username] = {}
        customConfigs[username].update(JAC.CONFIG)
    # always use the updated credentials
    customConfigs[username].update(session["credentials"])

# using user's config to validate aws access
def validateCredentials():
    try:
        JAC.InstanceManager(JAC.AWSConfig(**customConfigs[session["username"]])).client
    except (ClientError,ParamValidationError):
        return False
    return True

# init a new cluster manager,redirector when socket connected
@socketio.on('connect', namespace='/redirect')
def connected():
    global thread, jredirectors, clusterMngrs
    username = session["username"]
    clusterMngr= JAC.ClusterManager(sid=request.sid)
    jredirectors[request.sid] = JAC.Redirector(pauseFunc=flushPasuse)
    if thread is None:
        thread = socketio.start_background_task(target=background_thread)
    refreshConfig()
    clusterMngr.setConfig(customConfigs[username])
    clusterMngr.resMngr.setUser(username)
    clusterMngrs[session["_id"]]=clusterMngr
    if not validateCredentials():
        emit("redirect",{"msg":"WARNING: Invalid credentials"},room=request.sid)
        # emit("redirect_page",{"url":"/credential"},room=request.sid)

# release manager and redirector when socket disconnected
@socketio.on("disconnect",namespace='/redirect')
def disconnected():
    global jredirectors, clusterMngrs
    if session['_id'] in clusterMngrs:
        del clusterMngrs[session["_id"]]
    if request.sid in jredirectors:
        del jredirectors[request.sid]

# send user's config while click create
@socketio.on("get_default_config", namespace="/redirect")
def refreshConfig():
    init_costom_config()
    emit('config_changed', configJson(customConfigs[session["username"]]),room=request.sid)

# user changes configs
@socketio.on("update_config", namespace="/redirect")
def updateConfig(data):
    global customConfigs
    config = data["config"]
    assert True ## limit instance types here
    username = session["username"]
    updatedConfig = json.loads(config)
    updatedConfig = {k:updatedConfig[k] for k in updatedConfig if k in customConfigs[username]}
    customConfigs[username].update(updatedConfig)
    socketio.emit('config_updated', {'success':1}, namespace='/redirect', room=request.sid)

# while click resume
@socketio.on("get_cluster_ids", namespace="/redirect")
def getClusterIDs():
    li = JAC.InstanceManager(JAC.AWSConfig(**customConfigs[session["username"]])).getDupClusterIds()
    # divide cluster list based on username
    res = [[i for i in li if i[2]==session["username"]],[i for i in li if i[2]!=session["username"]]]
    emit("cluster_ids",json.dumps(res),room=request.sid)

# start a created cluster or resume from previous one.
@socketio.on("start_cluster", namespace="/redirect")
def startCluster(data):
    username = session["username"]
    clusterName = data["clusName"]
    clusterID = data["clusID"]
    slaveNum = int(data["slaveNum"] if data["slaveNum"] else 0)
    files = []
    jmxList = []
    createOrNot = int(data["create"])
    description = data["description"]
    successOrNot = False
    clusterMngr=clusterMngrs[session["_id"]]
    assert slaveNum<=5
    if not createOrNot and not username==data["user"]:
        if session["superAccess"]:emit("redirect",{"msg":"Admin access.\n"},room=request.sid)
        else:emit("redirect",{"msg":"You are not the owner of this cluster.\nRead-only access.\n\n"},room=request.sid)
    with jredirectors[request.sid]:
        if createOrNot:
            # try:
                clusterMngr.setConfig(customConfigs[username])
                clusterMngr.resMngr.setUser(username)
                clusterMngr.create(clusterName,user=username)
                clusterID = clusterMngr.instMngr.clusterID
                clusterMngr.setClusterDesc(description)
                clusterMngr.setSlaveNumber(slaveNum)
                clusterMngr.setupInstances()
                clusterDir = "%s%s" % (UPLOAD_PATH, clusterID)
                if not os.path.exists(clusterDir): os.mkdir(clusterDir)
                with open(os.path.join(UPLOAD_PATH,clusterID,".JAC_config.json"),"w") as f:
                    f.write(json.dumps(clusterMngr.config))
                successOrNot = True
            # except Exception as exception:
            #     print(exception)
            #     clusterMngr.cleanup()
        else:
            try:
                config = json.loads(open(UPLOAD_PATH+clusterID+"/.JAC_config.json").read())
            except Exception as e:
                print(e)
                config = {}
                config.update(JAC.CONFIG)
                config.update(session["credentials"])
                clusterDir = "%s%s" % (UPLOAD_PATH, clusterID)
                if not os.path.exists(clusterDir): os.mkdir(clusterDir)
                with open(os.path.join(UPLOAD_PATH,clusterID,".JAC_config.json"),"w") as f:
                    f.write(json.dumps(config))
            clusterMngr.setConfig(config)
            clusterMngr.resMngr.setUser(username)
            clusterMngr.resume(clusterName, clusterID, user=username)
            successOrNot = True

        if successOrNot:
            #clusterMngr.instMngr.addMaster()#need this if resuming from no master
            slaveNum = len(clusterMngr.instMngr.slaves)
            try:
                path_to_upload = os.path.join(os.getcwd(), UPLOAD_PATH, clusterID)
                files = os.listdir(path_to_upload)
                clusterMngr.setUploadDir(path_to_upload)
            except:
                files = []
            description = clusterMngr.instMngr.getClusterDesc()
            files = [ff for ff in files if not ff.startswith(".")]
            jmxList = [f for f in files if f.endswith(".jmx")]
            emit('config_changed', configJson(clusterMngr.config),room=request.sid)
        print("")
    clusterMngrs[session["_id"]] = clusterMngr
    emit('cluster_started',
         json.dumps({"clusID": clusterID, "slaveNum": slaveNum, "jmxList": jmxList, "files": files, "superAccess": session["superAccess"],
                     "description":description, "user":username, "executable":createOrNot or username==data["user"] or session["superAccess"]}),
         room=clusterMngr.sid)

# respective dir should be removed as well
@socketio.on("terminate_cluster", namespace="/redirect")
def delete():
    clusterMngr = clusterMngrs[session["_id"]]
    with jredirectors[request.sid]:
        clusterMngr.cleanup()
        os.system("cd %s && rm -rf %s &"%(UPLOAD_PATH,clusterMngr.instMngr.clusterID))
    emit("cluster_deleted",room=request.sid)

# run a test, used multiprocessing so it can be stopped
@socketio.on("startRunning", namespace='/redirect')
def runTest(data):
    from multiprocessing import Process as P
    clusterID = data["clusID"]
    jmxName = data["jmx_name"]
    output = data["output"]
    clusterMngr = clusterMngrs[session["_id"]]
    def wrapper():
        if clusterMngr.checkStatus(socketio.sleep):
            clusterMngr.refreshConnections()
            clusterMngr.updateRemotehost()
            clusterMngr.startSlavesServer()
            socketio.sleep(3)
            #clusterMngr.esCheck()############
            clusterMngr.runTest(jmxName,output)
            clusterMngr.stopSlavesServer()
            emit('cluster_finished', {'msg': "finished"}, namespace='/redirect', room=clusterMngr.sid)
            print("Finished\n")
        else:socketio.emit('time_out', namespace='/redirect', room=clusterMngr.sid)
    p = P(target=wrapper)
    with jredirectors[clusterMngr.sid]:
        p.start()
    processes[clusterID] = p

# terminate running process
@socketio.on("stop_running", namespace="/redirect")
def stopRunning(data):
    clusterMngr = clusterMngrs[session["_id"]]
    with jredirectors[request.sid]:
        clusterID = data["clusID"]
        if clusterID in processes:
            processes[clusterID].terminate()
            del processes[clusterID]
        clusterMngr.refreshConnections(verbose=False)
        clusterMngr.stopMasterJmeter()
        clusterMngr.stopSlavesServer()
        socketio.sleep(.5)
        print("Stopped\n")
    emit("cluster_stopped",room=request.sid)

# list summary results
@socketio.on("list_sum_results", namespace="/redirect")
def list_sum_results():
    clusterMngr = clusterMngrs[session["_id"]]
    res = clusterMngr.resMngr.list()
    emit("return_sum_results",json.dumps({"res":res}))

# get summary result
@socketio.on("get_sum_result", namespace="/redirect")
def get_sum_result(data):
    clusterMngr = clusterMngrs[session["_id"]]
    res = clusterMngr.resMngr.get(data["path"])
    emit("return_sum_result",json.dumps({"res":res}))

# download log
@socketio.on("get_log_result", namespace="/redirect")
def get_log_result(data):
    clusterMngr = clusterMngrs[session["_id"]]

    arr = data["path"].split("/")
    log_path = "/".join(arr[:-2]+arr[-1:])

    res = clusterMngr.resMngr.get(log_path)
    emit("return_log_result",json.dumps({"res":res}))

# delete summary result
@socketio.on("del_sum_result", namespace="/redirect")
def del_sum_result(data):
    clusterMngr = clusterMngrs[session["_id"]]
    res = clusterMngr.resMngr.delete(data["path"])
    # print(res)
    emit("return_del_ack",json.dumps({"ack":True}))
