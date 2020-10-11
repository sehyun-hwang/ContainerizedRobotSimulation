import router from "./Router.js";

import { PathParser } from "utils";
const { App } = PathParser(new Error());
import Run from "utils/Docker";

router.get('/docker', ({ query }, res) => Run({
        Labels: { APP: App },
        Image: "tensorflow/tensorflow",
        Env: Object.entries(query)
            .map(([key, value]) => key + '=' + value),
        HostConfig: {
            Binds: ['$/finger_inverse_kinematic:/root'],
        },
    })

    .then(emitter => emitter.once('Name', Name => res.send(Name)))

    .catch(error => {
        console.log(error);
        res.status(500).send(error);
    }));

export { router };
