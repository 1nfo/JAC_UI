from .flask_app import socketio, app, db, login_manager
from flask_session import Session
from datetime import timedelta
import uuid


app.config.update(
    DEBUG=True,
    SECRET_KEY=str(uuid.uuid4()),
    PERMANENT_SESSION_LIFETIME=timedelta(seconds=6000),
    SQLALCHEMY_DATABASE_URI="sqlite:///pydtusers.db",
    SQLALCHEMY_TRACK_MODIFICATIONS = False,
    SESSION_TYPE = 'redis'
)

sess = Session()

db.init_app(app)
sess.init_app(app)
socketio.init_app(app)
login_manager.init_app(app)

