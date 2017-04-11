from flask import Flask, render_template, request, redirect, session, Response
from flask_login import LoginManager , login_required , login_user, logout_user
from werkzeug.utils import secure_filename
from .socket_app import *
from .SimpleModel import User, db
import json, os


app = Flask(__name__)

app.config.update(
    DEBUG=True,
    TEMPLATES_AUTO_RELOAD=True,
    UPLOAD_FOLDER='uploads/',
    SECRET_KEY='secret!',
    SQLALCHEMY_DATABASE_URI="sqlite:///users.db",
    SQLALCHEMY_TRACK_MODIFICATIONS = False
)

login_manager = LoginManager()


@app.route("/")
def index():
    return redirect("/command")


@app.route("/command")
@login_required
def command():
    import uuid
    title = "Jmeter Cloud Testing"
    if "sid" in session:
        del taskMngrs[session["sid"]]
    session['sid'] = str(uuid.uuid4())
    return render_template("index.html", async_mode=socketio.async_mode, title=title, sessionID = session["sid"])


@app.route("/uploadFiles", methods=['POST'])
@login_required
def uploadFiles():
    from multiprocessing import Process as P
    taskID = request.form["taskID"]
    files = request.files.getlist("file")
    taskMngr = taskMngrs[session["sid"]]
    for file in files:
        filename = secure_filename(file.filename)
        file.save(os.path.join(app.config['UPLOAD_FOLDER'] + taskID + "/", filename))
    def wrapper():
        path_to_upload = os.path.join(os.getcwd(), app.config['UPLOAD_FOLDER'], taskID)
        if taskMngr.checkStatus(socketio.sleep):
            taskMngr.refreshConnections()
            taskMngr.uploadFiles()
            try:
                taskMngr.setUploadDir(path_to_upload)
                tmp = os.listdir(path_to_upload)
            except:
                tmp = []
            tmp = [ff for ff in tmp if not ff.startswith(".")]
            jmxList = [f for f in tmp if f.endswith(".jmx")]
            socketio.emit('upload_done',json.dumps({"jmxList": jmxList, "files": tmp}), namespace='/redirect', room=taskMngr.sid)
            print("")
        else:
            print("Time out, please check instances status on AWS web console or try again")
    p = P(target=wrapper)
    with jredirectors[taskMngr.sid]:
        p.start()
    return ""


@login_manager.user_loader
def load_user(userid):
    return User.query.get(userid)


@app.route('/login' , methods=['GET' , 'POST'])
def login():
    title="Jmeter Cloud Testing -- Login"
    # if 'logged_in' in session and session["logged_in"]: return redirect("/command")
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        registeredUser = User.query.filter_by(username=username).first()
        if registeredUser != None and registeredUser.password == password:
            login_user(registeredUser)
            # session['logged_in'] = True
            session["credentials"] = registeredUser.getCredentials()
            session["username"] = username
            return redirect( request.args.get("next") or "/command" )
        else:
            return render_template("login.html", title=title, display="block")
    else:
        return render_template("login.html", title=title, display="none")


@app.route('/logout')
@login_required
def logout():
    logout_user()
    # session['logged_in'] = False
    del session["username"]
    return redirect('/')


@app.route('/register' , methods = ['GET' , 'POST'])
def register():
    # del session["username"]
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        new_user = User(username , password , User.query.all().__len__())
        with app.app_context():
            db.session.add(new_user)
            db.session.commit()
        return Response("<p>Registered Successfully<p><p><a href='/login'>login</a><p>")
    else:
        return Response("Not available now <br> <a href='/login'>login</a>")
        return Response('''
        <form action="" method="post">
            <p><input type=text name=username placeholder="Enter username">
            <p><input type=password name=password placeholder="Enter password">
            <p><input type=submit value=Register>
        </form>
        ''')


@app.route("/credential", methods = ["GET", "POST"])
@login_required
def credential():
    if request.method == "POST":
        user = User.query.filter_by(username=session["username"]).first()
        d = {k:request.form[k] for k in request.form}
        print(d)
        user.setCredentials(d)
        print(user.getCredentials())
        db.session.commit()
        print(user.getCredentials())

    user = User.query.filter_by(username=session["username"]).first()
    kargs ={
            "title":"AWS Credential",
            "key_id":user.aws_access_key_id,
            "access_key":user.aws_secret_access_key,
            "role":user.role
        }
    return render_template("credential.html",**kargs)