import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.117.0/build/three.module.js';
import WebSocket from './WebSocket.js';
import Cortex from './Cortex.js';

let _cortex;

export default Emitter => WebSocket.then(WebSocket => new Cortex({
            "clientId": 'db2JvMFuUF7RFh0rdlldDz6Od97W0HIdw1e06HNK',
            "clientSecret": 'ksfiaENC6rXYI5Y7xBrFTA2hos42aau9uGo6DYPpWxldEWG0NNYwilU0m7l6LH335oPvgqrEGV3rygGIzWBqdbUvKNvbKd3z0gzzClxBG8i2Cj8FKeIhpPESmdlQUAcb',
            "debit": 1
        }, 'wss://localhost:6868/com.hwanghyun3.app3',
        WebSocket))

    .then(async cortex => {
        _cortex && _cortex.socket.close();
        _cortex = cortex;
        //WebSocket.createWebSocketStream(cortex.socket, { encoding: 'utf8' }).pipe(process.stdout);

        await cortex.sub('met mot'.split(' '));

        cortex.socket.addEventListener('message', ({ data }) => Promise.resolve(data)
            .then(JSON.parse)
            .then(data => {
                const { met, mot } = data;

                if (met)
                    return ['met', met];

                else if (mot) {
                    const [i] = mot;

                    const quaternion = new THREE.Quaternion(...mot.slice(2, 6));
                    const vector = new THREE.Vector3(1, 0, 0);
                    vector.applyQuaternion(quaternion);
                    const vector2 = new THREE.Vector3(0, 1, 0);
                    vector2.applyQuaternion(quaternion);

                    return ['mot', [vector.x, vector.y, vector2.x, vector2.y]];
                }

                else
                    return console.warn(data);

                /*.reduce((all, one, i) => {
                                        const ch = Math.floor(i / 3);
                                        all[ch] = (all[ch] || []).concat(one);
                                        return all;
                                    }, [])*/

                //typeof window !== 'undefined' && i || console.table(data);
                //Roll, Pitch, Yaw
            })
            .then(([key, detail]) => !Emitter ? console.log(key, detail) :
                Emitter.dispatchEvent(new CustomEvent(key, { detail })))
            .catch(console.error)
        );
    })
    .catch(console.error);
