# Jmeter cloud performance testing 

<strike>UI for JmeterAwsConf package.</strike>  
Now [JmeterAwsConf](https://github.pydt.lan/szhao/JmeterAwsConf) has been merged into this repo under `./server/JmeterAwsconf`

**Purpose** of this project is to help easily create ec2 instances, build clusters, then perform the jmeter cloud testing on AWS. Instances are managed by this tool automatically. Users can login the web application with paydiant account, create or choose the clusters they previous created and perform load testing on AWS. The summary report generated by jmeter will be uploaded into s3, and user can use this tool to quickly check them. The detailed test logs will be stored in s3 as well as being forwarded, by [Logstash](https://www.elastic.co/products/logstash), to [Elasticsearch](https://www.elastic.co/) server on AWS so users can search/visualize them by using [Kibana](https://www.elastic.co/products/kibana).

For developer, webpack needs to be install to generate bundle.js.

Front-end: Bootstrap, JQurey, React.js, and socket.io.js  
Back-end: Flask, Flask-socketio, Flask-Session, Flask-SQLAlchemy, Redis and [JmeterAwsConf](https://github.pydt.lan/szhao/JmeterAwsConf)

## How it works

Paydiant user can login this application and spin up ec2 instances from pre-set images. Users own and use their clusters while they can access other's with **readonly** access. 

All users should seperately use their own **AWS credentials**. When users want to run some load test, they must first create a cluster. Application will use the credentials user provided to spin up a cluster including **a master node and several slaves**. After these instances are initialized (2-3 mins), user can select the test scripts(the jmx/csv files required by jmeter) to upload and run the test.

During running jmeter scripts, application can forwarding the progress from master node. User can stop running test but the result will be lost. 

When task is finished, the test results, including **summary report** and **original logs**, will be saved into AWS S3. Moreover, original logs will be forwarded into **Elasticsearch** server on AWS for searching/visualizing. Application also provides result panel to check summary report.

After test is done, user should terminate their cluster.

## Directory Structure

========== .  
--- README.md  
--- Dockerfile  [Docker build file]   
--- clientJs/  [react client javascript]  
--- main.py    [application entry]   
--- package.json  [npm js packages]   
--- requirements.txt  [python packages]     
--- start.sh   [shortcut for docker]  
--- uploads/  [user upload directory]  
--- webpack.config.js [webpack build file]  
--- server/    [flask backend]    
	

## Deployment

### MAC OS 

Deployment on mac is generally for developing and testing. So it's good idea to use virtualenv.  

See this repo [AWS_TEST](https://github.pydt.lan/szhao/AWS_TEST)

### windows

Since multiprocessing package requires picklable object, this app is hard to run on windows OS. Please use Virtual Machine or Docker.

### linux

Refer to [Dockerfile](https://github.pydt.lan/paypal-instore/jmeter-cloud-perf/blob/master/Dockerfile) under this repo. 

DON'T FORGET TO:  

1. Put JAC\_key\_pair.pem under home directory.
2. Clone this repo to you server.
3. Start redis server first before application.
4. Bind port 80 requires sudo.
5. Add "server" flag `sudo python3 main.py server`

### docker
cd to this directory and put the AWS EC2 JAC\_key\_pair.pem here.

docker bulid:
	
	docker build -t jac .
	
after building:
	
docker run

	docker run -p 0.0.0.0:80:80 -it jac start 


## basic component

### Flask
URL routing and api.

### JmeterAwsConf
Controller / Managers

### SQLAlchemy
Save user's aws credentials.   
ORM.   
SQLite3.  

### React.js 

Front-end, one-page js application. Mixed with Socket.io    

Under clientJS directory.   
For developer, please install npm and webpack.  
**npm** for managing javascript package, see package.json  
**webpack** for generating bundles.js in index.html. see webpack.config.js.

### Socket.io
socket io is responsible for building a socket connection when users stay on "command" page. It will pass user's commands, like creating instance and starting jmeter test on remote instances. It also forwards some outputs from jmeter test cluster so as to report the testing progress.

### Redis
Redis has two purposes here.  

1. It is required by Flask-Session to create a server-side session. 
2. Redis is useful to share objects between the requests. specifically, to store \<class JmeterAwsConf.Manager.TaskManager \>, so taskmanager can be reused between the requests. Global variables should works as well under linux. 


**NOTE:** In order to make object saved in redis, this object must be picklable. To make objects redis-able, unpickable element of these object, like boto3.client,  must be deleted before dumping and reconstruct right after loading.

## Workflow & Request/Response ("command" page)
 
1. socketio connected call "connect"   
   **function** connect socketio, start bgthread, init a new taskMngr to taskMngrs
2. click create or resume
	1. create: call /get/defaultconfig   
	   **function** init new jac config to a new ip: [ip] --> [socketio event init_config emit customconfig]  
		i. save in popup config call /post/config    
	   **function** update jac config under: [ip,config] --> [socketio event init_config emit customconfig]
	2. resume: call /post/getTaskIDs   
	   **function** get a list of available tasks: [] --> [task list]
3.** click confirm /click task to resume**: call /post/taskName   
   **function** create a task cluster: [ip, task id, task name, salve number, create or resume, description] --> [task id, slace number, file list, description]
4. **upload**: call /uploadFiles   
   **function** upload files: [task id, files] --> [success or not]
5. **run**: call socketio event "startRunning"   
   **function** running jmeter test plan: [task id, jmx, result name] --> [] second python process running and emit socketio event taskFinished after finished.
6. **stop**: call /post/stop   
   **function** stop running task (terminate second python process, kill jmeter process): [taskID] --> [success or not]
7. **delete**: call /post/cleanup   
   **function** terminate cluster, remove uploads dir [] --> [success or not]
6. **socketio disconnected**: call "disconnect"  
   **function** del taskMngr from taskMngrs
