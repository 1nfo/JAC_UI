from flask_login import UserMixin
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

# basic user model to store aws credentials
class User(db.Model, UserMixin):

    __tablename__ = "users"

    id = db.Column(db.Integer,primary_key=True)
    username = db.Column(db.String(20), unique=True)
    aws_access_key_id = db.Column(db.String(50))
    aws_secret_access_key = db.Column(db.String(50))
    role = db.Column(db.String(50))
    access = db.Column(db.Integer)

    def __init__(self , username , id , active=True):
        self.id = id
        self.username = username
        self.active = active
        self.authenticated = True
        self.aws_access_key_id=""
        self.aws_secret_access_key=""
        self.role=""
        self.access=0

    def get_id(self):
        return self.id

    def is_active(self):
        return self.active

    def is_authenticated(self):
        return self.authenticated

    def setCredentials(self, credentials):
        self.aws_access_key_id=credentials["aws_access_key_id"]
        self.aws_secret_access_key=credentials["aws_secret_access_key"]
        self.role=credentials["role"]

    def getCredentials(self):
        return {
            "aws_access_key_id":self.aws_access_key_id,
            "aws_secret_access_key":self.aws_secret_access_key,
            "role":self.role
        }

    def __repr__(self):
        return '<User %r>' % self.username

