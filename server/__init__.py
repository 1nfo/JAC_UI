from .flask_app import socketio, app, db, login_manager

login_manager.login_view = "login"

socketio.init_app(app)
login_manager.init_app(app)
db.init_app(app)
