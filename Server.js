import express from 'express';
import { PathParser } from "utils";
import Run, { Docker } from "utils/Docker";

import router from "./Router.js";

const { App } = PathParser(new Error());

router.get('/ddpg', ({ query: { Subdomain } }, res) => Docker(Subdomain).listContainers({
        all: true,
        filters: { ancestor: ['param-server'] },
    }).then(data => {
        console.log(data);
        res.json(data);
    }))


    .post('/ddpg', express.json(), express.raw({
            type: 'text/plain'
        }), ({ query: { Subdomain, name }, body }, res) =>

        Promise.resolve(typeof body instanceof Buffer ? Buffer.from(JSON.stringify(body)) : body)
        .then(buffer => Run({
            name,
            Labels: { APP: App },
            Image: "param-server",
            Env: 'PARAMS=' + buffer.toString('base64'),
            Hostname: name,
            HostConfig: {
                Binds: ['$/param-server:/root'],
                //AutoRemove: true,
            },
            Cmd: ['bash', 'Docker.sh', 'param-server']
        }, Subdomain))

        .then(emitter => emitter.once('Name', Name => res.send(Name)))

        .catch(error => {
            console.log(error);
            res.status(500).json(error);
        }));



export { router };
