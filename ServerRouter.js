import { createWriteStream } from 'fs';
import express from 'express';

import Run, { Docker } from "utils/Docker";
import { PathParser } from "utils";

const Image = ({ Architecture }) => Architecture === 'aarch64' ?
    'linaro/tensorflow-arm-neoverse-n1:2.3.0-eigen' :
    'tensorflow/tensorflow';
const { App } = PathParser(
    import.meta.url);
const LogStream = createWriteStream(`${App}/param-server/${Date.now()}.txt`);

export const Router = express.Router();
const ComplexRouter = express.Router()
    .use(express.json())
    .use(express.raw({
        type: 'text/plain'
    }))
    .use((req, res, next) => {
        console.log('ComplexRouter');
        const { body } = req;

        const buffer = typeof body instanceof Buffer ? body : Buffer.from(JSON.stringify(body));
        req.body = buffer.toString('base64');
        next();
    });


function ErrorHandler(res, error) {
    console.log(error);
    res.status(error.statusCode || 500).json(error);
}


Router.post('/log', express.text(), ({ body }, res) => {
    console.log(body);
    LogStream.write(body);
    res.status(20).send();
});


Router.get('/ddpg', ({ query: { Subdomain } }, res) => Docker(Subdomain).listContainers({
        all: true,
        filters: { ancestor: ['param-server'] },
    }).then(data => {
        console.log(data);
        res.json(data);
    })
    .catch(error => ErrorHandler(res, error)));


ComplexRouter.post('/ddpg', ({ query: { Subdomain, name }, body }, res) => Run({
        name,
        Labels: { APP: App },
        Image,
        Env: [
            'PARAMS=' + body,
            'PIP=python-socketio[client]'
        ],
        Hostname: name,
        HostConfig: {
            Binds: ['$/finger_inverse_kinematic:/root'],
            //AutoRemove: true,
        },
    }, Subdomain)

    .then(emitter => emitter.once('Name', Name => res.send(Name)))

    .catch(error => ErrorHandler(res, error)));


const PIP = {
    index: 'pandas',
    example: 'tensorflow-datasets',
    localhost: 'tensorflow-datasets',
};
const Keys = Object.keys(PIP);


function Env(file) {
    const arr = [];
    if (file in PIP);
    else
        throw new Error('Invalid file');

    arr.push('PIP=' + PIP[file]);
    return arr;
}


Router.get('/paramserver', (req, res) => res.json(Keys))

ComplexRouter.put('/paramserver/:file', ({
        headers,
        params: { file },
        query: { name },
        body
    }, res) => Run({
        name,
        Labels: {
            APP: 'robot',
            PARAM_SERVER: name ? name.split('-')[0] : '',
        },
        Env: [
            'GRPC_VERBOSITY=DEBUG',
            "PARAMS=" + body,
            ...Env(file)
        ],
        Image,
        Hostname: name,
        HostConfig: {
            AutoRemove: !name,
        },
        Cmd: ['bash', 'Docker.sh', 'param-server', file]
    })

    .then(async emitter => {
        const Stream = new Promise(resolve => emitter.once('Stream', resolve));
        const name = await new Promise(resolve => emitter.once('Name', resolve));

        headers.accept === 'text/plain' ? res.send(name) : Stream.then(Stream => {
            res.writeHead(200, {
                'Content-Type': 'application/octet-stream',
                'Access-Control-Expose-Headers': 'X-Container',
                'X-Container': name
            });
            Stream.pipe(res);
        });
    })

    .catch(error => ErrorHandler(res, error)));


const Workers = new Map();

Router.get('/paramserver/:name', ({ params: { name } }, res) => docker.listContainers({
            all: true,
            filters: {
                label: ["PARAM_SERVER=" + name.split('-')[1]]
            }
        })

        .then(async data => {
            const Ids = data.map(({ Id }) => Id);
            console.log('param-servers:', Ids);
            Workers.set(name, Ids);

            const Logs = await Promise.all(Ids.map(x => docker.getContainer(x).logs({
                stdout: true,
                stderr: true,
            })));

            data.forEach((x, i) => x.Logs = Logs[i].toString());
            data.sort((a, b) => a.Created - b.Created);
            res.json(data);
        })

        .catch(error => {
            console.log(error);
            res.status(500).json(error);
        }))

    .delete('/paramserver/:name', ({ params: { name } }, res) => Promise.all(Workers.has(name) &&
            Workers.get(name).map(x => docker.getContainer(x).remove()))
        .then(data => res.json(data))
        .catch(error => ErrorHandler(res, error)));

export { ComplexRouter as Router2 };
