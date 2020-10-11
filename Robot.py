import traceback

import numpy as np
from env import Env
from ddpg import DDPG
import config

from os import getuid as UID, environ
from random import random, randrange

from socketio import Client as IO, ClientNamespace as Namespace
from socket import gethostname as Host

#import JSON
import numpy as np
import json

def default(obj):
    if isinstance(obj, np.ndarray):
        return obj.tolist()
    #if isinstance(value, date):
    #    return value.replace(tzinfo=timezone.utc).timestamp()
    raise TypeError(type(obj) + 'is not serializable')

class JSON:
    @staticmethod
    def dumps(obj, *args, **kwargs):
        return json.dumps(obj, *args, default=default, **kwargs)

    @staticmethod
    def loads(*args, **kwargs):
        return json.loads(*args, **kwargs)

namespace = '/Container'

"""
class CustomNamespace(Namespace):
    def on_test(self, data, callback=Callback):
        print('test', data)
        return ["OK", 123]


    def reset(self, reset_rotation=True):
        print('reset')
        return self.get_state()

    def step(self, action):
        return s, r, done

    def get_state(self):

        return np.array([x1, y1, x2, y2, x3, y3, xt, yt])
"""

io = IO(json=JSON())

Emit = lambda *args: io.emit('Container', list(args), namespace=namespace)

def On(value, key=''):
    global io, namespace

    isFn = callable(value)
    if not key:
        key = value.__name__ if isFn else type(value).__name__

    print(key)

    @io.on(key, namespace=namespace)
    def handler(data):

        fn = value if isFn else getattr(value, data[0])
        kwargs = data.pop() if len(data) and isinstance(data[-1],
                                                        dict) else {}
        args = data[0 if isFn else 1:]

        print(fn.__name__, args, kwargs)
        try:
            result = fn(*args, **kwargs)
            print(result)
        except BaseException as error:
            print(error)
            result = {
                "error": repr(error),
                "stack": traceback.format_exc()
            }

        return result

def Learn(var):
    print(model.memory_counter, model.memory_size)
    if model.memory_counter > model.memory_size:
        var *= .9995
        model.learn()
    return var

def main():
    global io
    io.sleep(1)

    host = Host()
    host = 'http://{}{}?Container={}&KeepAlive=1'.format(
        'localhost' if 'hwangsehyun' in host else 'express.network',
        ':8080' if UID() else '', host.replace('.network', ''))
    print('Host:', host)

    io.connect(host, namespaces=[namespace])
    #io.register_namespace(CustomNamespace(namespace))

    io.emit('Room', 'robot', namespace=namespace)

    print('Connected')
    #get_event_loop().run_until_complete(self.main())



if __name__ == '__main__':
    actions, states = map(lambda x: int(environ[x]), 'ACTIONS STATES'.split(' '))
    print('actions', actions, 'states', states)
    model = DDPG(actions, states, 1)
    On(model, "model")
    On(Learn)
    main()
