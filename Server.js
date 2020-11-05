import express from 'express';
import { PathParser } from "utils";
import Run from "utils/Docker";

import router from "./Router.js";

const { App } = PathParser(new Error());

router.post('/docker', express.json('*/*'), ({ query: { Subdomain }, body }, res) => Run({
        Labels: { APP: App },
        Image: "tensorflow/tensorflow",
        Env: Object.entries(body)
            .map(([key, value]) => key + '=' + value),
        HostConfig: {
            Binds: ['$/finger_inverse_kinematic:/root'],
            AutoRemove: true,
        },
    }, Subdomain)

    .then(emitter => emitter.once('Name', Name => res.send(Name)))

    .catch(error => {
        console.log(error);
        res.status(500).json(error);
    }));

export { router };
