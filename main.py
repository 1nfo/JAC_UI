from server import *
import sys, os

if __name__ == "__main__":
    db_path = "server/"+app.config["SQLALCHEMY_DATABASE_URI"].split("/")[-1]
    if not os.path.exists(db_path):
        with app.app_context():
            db.create_all()

    if "server" in sys.argv:
        socketio.run(app, host="0.0.0.0", port=80, debug=True)
    else:
        socketio.run(app, debug=True)
