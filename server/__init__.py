from .flask_app import socketio, app, db, login_manager
from flask_session import Session
from datetime import timedelta
import uuid, os


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

# if no db it will create one.
db_path = os.path.join(os.path.dirname(__file__),app.config["SQLALCHEMY_DATABASE_URI"].split("/")[-1])
if not os.path.exists(db_path):
    with app.app_context():
        db.create_all()

