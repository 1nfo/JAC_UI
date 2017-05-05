from ldap3 import Server, Connection, ALL
from ldap3.core.exceptions import LDAPBindError

class PaydiantAuthentication(object):
    def __init__(self):
        self.server = Server("cse1-ad1.pydt.lan",get_info=ALL)

    def verify(self,username,password):
        if not username: return False
        try:
            Connection(self.server, username+"@pydt.lan", password, auto_bind=True)
            return True
        except LDAPBindError:
            return False
