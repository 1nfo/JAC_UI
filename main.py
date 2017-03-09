from flask import Flask,render_template,request,jsonify,session,redirect
from flask_socketio import SocketIO, emit, disconnect
from werkzeug.utils import secure_filename
import json,os,io,sys
import JmeterAwsConf as JAC


# old part before add socketio
app  = Flask(__name__)
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
socketio = SocketIO(app, async_mode=async_mode)
thread = None

taskMngrs = {}
processes = {}


def flushPasuse():
	socketio.sleep(1e-1)


jredirector = JAC.Redirector(pauseFunc=flushPasuse)


def background_thread():
	while True:
		socketio.sleep(1e-1)
		socketio.emit('redirect',
					{'msg': jredirector.flush().replace("\n","<br/>")},
					namespace='/redirect')


@app.route("/")
def index():
	return redirect("/admin")


@app.route("/<user>")
def user(user):
	title = "Jmeter Cloud Testing"
	paragraph = ['']
	return render_template("index.html",title=title,paragraph=paragraph,async_mode=socketio.async_mode)


@app.route("/post/config",methods = ['POST'])
def refreshConfig():
	config = request.form["config"]
	JAC.CONFIG.update(json.loads(config))
	print(JAC.CONFIG)
	return ""


@app.route("/post/taskName",methods = ['POST'])
def createTask():
	taskName = request.form["taskName"]
	taskID = request.form["taskID"]
	slaveNum = 0
	jmxList = []
	createOrNot = int(request.form["create"])
	taskMngr = JAC.TaskManager(config=JAC.CONFIG)
	successOrNot = False;
	with jredirector:
		try:
			taskMngr.startTask(taskName)
			successOrNot = True
		except Exception as exception:
			if createOrNot:
				print(exception.args[0])
				print(exception.args[1])
				print("Try another name or click resume\n")
			else:
				print("Resuming "+taskID)
				taskMngr.startTask(taskName,taskID)
				successOrNot = True
		if successOrNot:
			taskID = taskMngr.instMngr.taskID
			taskMngrs[taskID] = taskMngr
			taskMngr.instMngr.mute()
			taskMngr.connMngr.mute()
			taskMngr.instMngr.addMaster()
			if createOrNot: print("Master added.")
			slaveNum = len(taskMngr.instMngr.slaves)
			try:
				path_to_upload = os.path.join(os.getcwd(),app.config['UPLOAD_FOLDER'],taskID)
				tmp = os.listdir(path_to_upload)
				taskMngr.setUploadDir(path_to_upload)
			except:
				tmp = []
			jmxList = [f for f in tmp if f.endswith(".jmx")]
		print('')
	return json.dumps({"taskID":taskID,"slaveNum":slaveNum,"jmxList":jmxList}),200 if successOrNot else 400


@app.route("/post/slaveNum",methods = ['POST'])
def setSlaveNum():
	num = int(request.form["slaveNum"])
	taskID = request.form["taskID"]
	with jredirector:
		taskMngrs[taskID].setSlaveNumber(num)
		taskMngrs[taskID].setupInstances()
	return "from server: "+str(num)


@app.route("/uploadFiles",methods = ['POST'])
def uploadFiles():
	taskID = request.form["taskID"]
	files = request.files.getlist("file")
	os.system("cd %s && mkdir %s"%(app.config['UPLOAD_FOLDER'],taskID))
	for file in files:
		filename = secure_filename(file.filename)
		file.save(os.path.join(app.config['UPLOAD_FOLDER']+taskID+"/", filename))
	with jredirector:
		taskMngrs[taskID].setUploadDir(os.getcwd()+"/"+app.config['UPLOAD_FOLDER']+taskID)
	return json.dumps({"success":True}), 200


@app.route("/post/run",methods = ["POST"])
def runTest():
	from multiprocessing import Process as P
	taskID = request.form["taskID"]
	jmxName = request.form["jmx_name"]
	taskMngr = taskMngrs[taskID]
	def wrapper():
		with jredirector:
			if taskMngr.checkStatus(): 
				if taskMngr.instMngr.master is None: print("No Master running!")
				else:
					taskMngr.refreshConnections()
					taskMngr.uploadFiles()
					taskMngr.updateRemotehost()
					taskMngr.startSlavesServer()
					taskMngr.runTest(jmxName,"output.csv")
					taskMngr.stopSlavesServer()	
			else: print("Time out, please check instances status on AWS web console or try again")
	p = P(target=wrapper)
	p.start()
	processes[taskID]=p
	socketio.sleep(5)
	return json.dumps({"success":True}), 200


@app.route("/post/cleanup",methods = ["POST"])
def cleanup():
	taskID = request.form["taskID"]
	with jredirector:
		taskMngrs[taskID].cleanup()
	del taskMngrs[taskID]
	return json.dumps({"success":True}), 200


@socketio.on('connect', namespace='/redirect')
def test_connect():
    global thread
    if thread is None:
        thread = socketio.start_background_task(target=background_thread)
    emit('redirect', {'msg': '<br/>Connected<br/><br/>'})
    emit('initial_config',{'config':json.dumps(JAC.CONFIG,indent="\t")})


@app.route("/post/getTaskIDs",methods=["POST"])
def getTaskIDs():
	li = JAC.TaskManager(config=JAC.CONFIG).instMngr.getDupTaskIds()
	return json.dumps(li)


@socketio.on("stopRunning",namespace='/redirect')
def stopRunning(msg):
	with jredirector:
		taskID = msg["taskID"]
		taskMngr = taskMngrs[taskID]
		if taskID in processes:processes[taskID].terminate()
		taskMngr.stopSlavesServer(verbose=False)
		socketio.sleep(.5)
		print("\nStopped")
		emit('taskFinished', {'msg': "finished"}, namespace='/redirect')

if __name__ == "__main__":
    socketio.run(app, debug=True)
