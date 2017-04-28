# JAC_UI

UI for JmeterAwsConf package.

For developer, webpack needs to be install to generate bundle.js.

Front-end: Bootstrap, JQurey, React.js, and socket.io.js  
Back-end: Flask, Flask-socketio, Flask-Session, Flask-SQLAlchemy, Redis and [JmeterAwsConf](https://github.pydt.lan/szhao/JmeterAwsConf)

## Deployment step

docker bulid:
	
	docker build -t jac .
	
docker run

	docker run -p 0.0.0.0:80:80 -it jac start 

~~check [AWS_TEST](https://github.pydt.lan/szhao/AWS_TEST)

socketio-flask embedded with eventlet/gevent, so it has wsgi.

check deployment [details](https://flask-socketio.readthedocs.io/en/latest/#deployment)~~


## To do
0. [√]redis detect 
1. [?]thread blocking ..fixed?
3. task level info, ip >> id, more tag
3. [√]afterReady -> reactjs; post -> socket
3. [√]deploy on aws
6. [√]pass users credentials (user login if sharing one credential)
7. readonly task ( task locker / is exclusively accessing neccessary?)
8. socket no response sometimes, not reproducible
9. encrypt request
10. user register?
11. font-end, popup interface

## basic component

### SQLAlchemy
Save user's aws credentials.

### React.js
Generate bundles.js to control "command" page behavior. One page application.


### socket io
socket io is responsible for building a socket connection when user accessing "command" page. It will pass user's command like creating instance and starting jmeter test on instance. It also forwards some outputs from jmeter test cluster to report the testing progress.

### Redis
Redis has two purposes here.  

1. It is required by Flask-Session to create a server-side session. 
2. Redis is useful to share objects between the requests. specifically, to store \<class JmeterAwsConf.Manager.TaskManager \>, so taskmanager can be reused between the requests. 

**More about 2:** 
Now taskmanager is wrapped by server/Redisable.py and uses separated db in redis, but theoretically this wrapper can be merged into Flask-Session.  

Actually, using redis to store taskmanager might be not very necessary. Because taskmanager is used only when socket is connected and no use after socket disconnected. Just using a global variable during the socket connection should be fine. But if object is required to be shared between the normal http request instead of using socket, then this redisable manager is necessary.

**NOTE:** In order to make object saved in redis, this object must be picklable. Reconstruct unpickable object like boto3.client.

## workflow & Request/Response ("command" page)

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