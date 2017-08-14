from ldap3 import Server, Connection, ALL
from ldap3.core.exceptions import LDAPBindError,LDAPSocketOpenError

class PaydiantAuthentication(object):
    def __init__(self):
        self.server = Server("cse1-ad1.pydt.lan",get_info=ALL)

    def verify(self,username,password):
        if not username or not password: return False
        try:
            Connection(self.server, username+"@pydt.lan", password, auto_bind=True)
            return True
        except LDAPBindError:
            return False
        except LDAPSocketOpenError as ex:
            print("Connection is not open yet")
            raise ex        
        except Exception as e:
            print(e)
            raise e