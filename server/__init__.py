from .flask_app import socketio, app, db, login_manager
from flask_session import Session

app.config.update(
    DEBUG=True,
    SECRET_KEY='48065a15-fc1c-4eec-829d-cc8faeea0356',
    SQLALCHEMY_DATABASE_URI="sqlite:///users.db",
    SQLALCHEMY_TRACK_MODIFICATIONS = False,
    SESSION_TYPE = 'redis'
)

sess = Session()

sess.init_app(app)
socketio.init_app(app)
login_manager.init_app(app)
db.init_app(app)
