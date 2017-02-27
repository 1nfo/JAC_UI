from flask import Flask,render_template,request,jsonify
import json
import JmeterAwsConf as JAC

app  = Flask(__name__)
taskMngr = None


@app.route("/")
def hp():
	title = "Jmeter Cloud Testing"
	paragraph = ['']
	return render_template("index.html",title=title,paragraph=paragraph)


@app.route("/post/taskName",methods = ['POST'])
def createTask():
	taskName = request.form["taskName"]
	taskMngr = JAC.TaskManager(taskName,0,config=JAC.CONFIG)
	return "from server: "+taskName


@app.route("/post/slaveNum",methods = ['POST'])
def setSlaveNum():
	var = request.form["slaveNum"]
	return "from server: "+var


@app.route("/uploadFiles",methods = ['POST'])
def uploadFiles():
	print(request.files.getlist("file"))
	return json.dumps({"success":True}), 200


app.config.update(
	DEBUG=True,
	TEMPLATES_AUTO_RELOAD=True,
	UPLOAD_FOLDER='uploads/'
)



if __name__ == "__main__":
    app.run()

