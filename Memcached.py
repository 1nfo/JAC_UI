import redis, pickle

class RedisableManagers(object):
    def __init__(self):
        self.redis = redis.StrictRedis(host='localhost', port=6379, db=0)

    def __getitem__(self,key):
        return pickle.loads(self.redis.get(key))

    def __setitem__(self,key,value):
        if value.instMngr and "client" in value.instMngr.__dict__:
            del value.instMngr.__dict__["client"]
        self.redis.set(key,
            pickle.dumps(value))