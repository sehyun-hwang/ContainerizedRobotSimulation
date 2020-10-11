import router from "./Router.js";
export { router };

import got from 'got';
import { MyURL, PathParser } from "utils";
const { App } = PathParser(new Error());
import { Run } from "utils/Docker";

router.get('/docker', (req, res) => Run({
        Labels: { APP: App },
        Image: "pytorch/pytorch",
        Env: [
            'PIP_INDEX_URL=http://apt.network:3141/root/pypi/+simple/',
            'PIP_TRUSTED_HOST=apt.network'
        ]
    }, Name => res.send(Name))
    .then(data => console.log("data", data && data.toString()))
    .catch(error => {
        console.log(error);
        res.status(500).send(error);
    }));
