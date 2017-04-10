from flask_login import UserMixin


class User(UserMixin):
    def __init__(self , username , password , id , active=True):
        self.id = id
        self.username = username
        self.password = password
        self.active = active
        self.authenticated = True

    def get_id(self):
        return self.id

    def is_active(self):
        return self.active

    def is_authenticated(self):
        """Return True if the user is authenticated."""
        return self.authenticated


class UsersRepository:

    def __init__(self):
        self.users = dict()
        self.users_id_dict = dict()
        self.identifier = 0

    def save_user(self , user):
        self.users_id_dict.setdefault(user.id , user)
        self.users.setdefault(user.username , user)

    def get_user(self , username):
        return self.users.get(username)

    def get_user_by_id(self , userid):
        return self.users_id_dict.get(userid)

    def next_index(self):
        self.identifier +=1
        return self.identifier