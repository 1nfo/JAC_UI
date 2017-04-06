# JAC_UI

UI for JmeterAwsConf package.

For developer, webpack needs to be install to generate bundle.js.

Front-end: Bootstrap, JQurey, React.js, and socket.io.js  
Back-end: Flask, Flask-socketio, Flask-Session, Redis and [JmeterAwsConf](https://github.pydt.lan/szhao/JmeterAwsConf)

## Deployment step

check [AWS_TEST](https://github.pydt.lan/szhao/AWS_TEST)

socketio-flask embedded with eventlet/gevent, so it has wsgi.

check deployment [details](https://flask-socketio.readthedocs.io/en/latest/#deployment)


## To do
0. redis detect 
1. thread blocking ..fixed?
2. global variable
3. post -> socket
3. task level info, ip >> id, more tag
4. config.json / Config module refactor
5. es part decouple
3. deploy on aws
6. pass users credentials (user login if sharing one credential)
7. readonly task ( task locker / is exclusively accessing neccessary?)

## Potential Problem

### global variable

some global variables exist. It is find if running under singel process, but could be a problem in the future product env.

### aws credential
share one credential or use user's credential
if sharing, login are required.

### Concurrency[FIXING]

JmeterAwsConf is designed as a single task/user API, so there is no consideration to handle multiple users. But the idea of this UI is to support multiple users.


### React vs JQurey
This UI are originally written in JQurey, then tranformed into react.js. Still some JQuery part are there, like socketio, and upload file. 

Some situations is against the idea of how react uses state to manage the page. For example, streamming backend output to page. In react, needs to maintain all the history output, re-render them once new output coming, which is exhausted. Instead, JQurey only appends new output to div. 


## workflow & Request/Response

0. redirect to /command:   
	**function** assign a new session id.
1. socketio connected call "connect"   
   **function** connect socketio, start bgthread, init a new taskMngr to taskMngrs
2. click create or resume
	1. create: call /get/defaultconfig   
	   **function** init new jac config to a new ip: [ip] --> [socketio event init_config emit customconfig]  
		i. save in popup config call /post/config    
	   **function** update jac config under: [ip,config] --> [socketio event init_config emit customconfig]
	2. resume: call /post/getTaskIDs   
	   **function** get a list of available tasks: [] --> [task list]
3. click confirm /click task to resume: call /post/taskName   
   **function** create a task cluster: [ip, task id, task name, salve number, create or resume, description] --> [task id, slace number, file list, description]
4. upload call /uploadFiles   
   **function** upload files: [task id, files] --> [success or not]
5. run call socketio event "startRunning"   
   **function** running jmeter test plan: [task id, jmx] --> [] second python process running and emit socketio event taskFinished after finished.
6. stop call /post/stop   
   **function** stop running task (terminate second python process, kill jmeter process): [taskID] --> [success or not]
7. del task call /post/cleanup   
   **function** terminate cluster, remove uploads dir [] --> [success or not]
6. socketio disconnected call "disconnect"  
   **function** del taskMngr from taskMngrs