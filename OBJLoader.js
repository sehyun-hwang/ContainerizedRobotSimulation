import { Load } from './three.js';

let loader;
const init = Load(['OBJLoader']).then(([{ OBJLoader }]) => loader = new OBJLoader());

export default (file, Faces) => Promise.all([file && file.arrayBuffer(), init])
    .then(([body]) => fetch('https://kbdlab.hwangsehyun.com/meshlab?' + new URLSearchParams({
        Faces
    }), file && {
        method: 'POST',
        headers: {
            'Content-Type': 'application/object'
        },
        body,
    }))
    .then(res => res.text())
    .then(obj => loader.parse(obj));

/*Path=>new Promise((resolve, reject) => loader.parse(
    Path,
    resolve,
    xhr => console.log((xhr.loaded / xhr.total * 100) + '% loaded'),
    reject,
));
*/
