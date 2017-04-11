import redis, pickle, socket

# Defalut param
HOST='localhost'
PORT=6379
DB=5

# override the for basic operators to read, write, delete, check object in redis
# and make object picklable and store in redis.
class RedisableDict(object):
    def __init__(self):
        self.redis = redis.StrictRedis(host=HOST, port=PORT, db=DB)

    def __getitem__(self,key):
        return pickle.loads(self.redis.get(key))

    def __setitem__(self,key,value):
        self.redis.set(key, pickle.dumps(value))

    def __delitem__(self, key):
        self.redis.delete(key)

    def __contains__(self, key):
        return self.redis.get(key) is not None


class RedisableManagers(RedisableDict):
    def __setitem__(self,key,value):
        if value.instMngr and "client" in value.instMngr.__dict__:
            del value.instMngr.__dict__["client"]
        self.redis.set(key, pickle.dumps(value))

# check is redis-server is running
def redisReady():
    try:
        socket.create_connection((HOST,PORT))
        return True
    except:
        print("\nRedis server is not ready, using default dictionary.\n")
        return False
