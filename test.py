#https://github.com/jcjohnson/pytorch-examples/blob/master/nn/two_layer_net_nn.py
from os import getuid as UID
from random import random, randrange

from aiohttp import web
from socketio import AsyncClient as IO
from asyncio import sleep, get_event_loop
from socket import gethostname as Host

io = IO()

namespace = '/Container'


async def Emit(*args):
    await io.emit('Container', list(args), namespace=namespace)


async def main():
    host = Host()
    host = 'http://{}{}?Container={}'.format(
        'localhost' if 'hwangsehyun' in host else 'express.network',
        ':{}'.format(8080) if UID() else '', host.replace('.network', ''))
    print('Host:', host)

    await io.connect(host, namespaces=[namespace])
    print('Connected')

    @io.event(namespace=namespace)
    async def test(data):
        print("test event", data)

    while True:
        await Emit('Angles',
                   ('+' if random() > .5 else '-') + str(randrange(5)))
        await sleep(1)

    #await io.wait()


get_event_loop().run_until_complete(main())

print("Running")
