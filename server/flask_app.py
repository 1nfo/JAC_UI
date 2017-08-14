from flask import Flask, render_template, request, redirect, session, Response
from flask_login import LoginManager , login_required , login_user, logout_user
from werkzeug.utils import secure_filename
from .socket_app import *
from .SimpleModel import User, db
from .PaydiantAuthentication import PaydiantAuthentication as PydtAuth
import json, os


app = Flask(__name__)

app.config.update(
    TEMPLATES_AUTO_RELOAD=True,
    UPLOAD_FOLDER='uploads/'
)

login_manager = LoginManager()
login_manager.login_view = "login"

@app.route("/")
def index():
    return redirect("/command")

# main page, perform commands to control instances and jmeter test.
@app.route("/command")
@login_required
def command():
    title = "Jmeter Cloud Testing"
    return render_template("index.html", async_mode=socketio.async_mode, title=title, sessionID = session["_id"])

# upload test plan endpoint
@app.route("/uploadFiles", methods=['POST'])
@login_required
def uploadFiles():
    from multiprocessing import Process as P
    clusterID = request.form["clusID"]
    files = request.files.getlist("file")
    clusterMngr = clusterMngrs[session["_id"]]
    def wrapper():
        path_to_upload = os.path.join(os.getcwd(), app.config['UPLOAD_FOLDER'], clusterID)
        if clusterMngr.checkStatus(socketio.sleep):
            for file in files:
                filename = secure_filename(file.filename)
                file.save(os.path.join(app.config['UPLOAD_FOLDER'] + clusterID + "/", filename))
            clusterMngr.refreshConnections()
            clusterMngr.uploadFiles()
            try:
                clusterMngr.setUploadDir(path_to_upload)
                tmp = os.listdir(path_to_upload)
            except:
                tmp = []
            tmp = [ff for ff in tmp if not ff.startswith(".")]
            jmxList = [f for f in tmp if f.endswith(".jmx")]
            socketio.emit('upload_done',json.dumps({"jmxList": jmxList, "files": tmp}), namespace='/redirect', room=clusterMngr.sid)
            # don't know why in mp, must print something after emit, otherwise it won't emit.
            # probably because print calls jredirector, which contains socketio.sleep
            print("")
        else:
            socketio.emit('time_out',"{}", namespace='/redirect', room=clusterMngr.sid)
            print("")
    p = P(target=wrapper)
    with jredirectors[clusterMngr.sid]:
        p.start()
    return ""

# login api
@login_manager.user_loader
def load_user(userid):
    return User.query.get(userid)

# login page
@app.route('/login/' , methods=['GET' , 'POST'])
def login():
    session.permanent=True
    title="Jmeter Cloud Testing -- Login"
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        try:
            print(username)
            verified = PydtAuth().verify(username,password)
            print(verified)
        except Exception as e:
            return json.dumps({"exception":"1","msg":str(e)})
        if verified:
            registeredUser = User.query.filter_by(username=username).first()
            if registeredUser == None:
                new_user = User(username,User.query.all().__len__())
                with app.app_context():
                    db.session.add(new_user)
                    db.session.commit()
                registeredUser = User.query.filter_by(username=username).first()
            login_user(registeredUser)
            session["credentials"] = registeredUser.getCredentials()
            session["username"] = username
            session["superAccess"] = registeredUser.access==1
            init_costom_config()
            if not validateCredentials(): return json.dumps({"success":"1","url":"/credential"})
            return json.dumps({"success":"1","url":request.args.get("next") or "/command"})
        else:
            return json.dumps({"success":"0"})
    else:
        return render_template("login.html", title=title)

# logout page
@app.route('/logout')
@login_required
def logout():
    logout_user()
    del session["username"]
    return redirect('/')


# update credentials.
@app.route("/credential", methods = ["GET", "POST"])
@login_required
def credential():
    # validateCredentails must be run under get / post separately. Since post updated credentials
    if request.method == "POST":
        user = User.query.filter_by(username=session["username"]).first()
        d = {k:request.form[k] for k in request.form}
        user.setCredentials(d)
        db.session.commit()
        session["credentials"] = user.getCredentials()
        init_costom_config()
        return json.dumps(validateCredentials())
    else:
        user = User.query.filter_by(username=session["username"]).first()
        kargs ={
                "title":"AWS Credential",
                "key_id":user.aws_access_key_id,
                "access_key":user.aws_secret_access_key,
                "role":user.role,
                "valid":validateCredentials()
            }
        return render_template("credential.html",**kargs)