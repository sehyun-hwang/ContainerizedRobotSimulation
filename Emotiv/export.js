import Emotiv from './Emotiv.js';
import { Fresh } from './IndexedDB.js';

const DeadZone = .3;
const Speed = .15;

let Origin;
let SetOrigin = true;
window.EmotivOrigin = () => SetOrigin = true;

const Emitter = document.createElement('div');

export default fn => Promise.all([Fresh(), Emotiv(Emitter)])
    .then(([Transaction]) => {
        Emitter.addEventListener('met', ({ detail }) => {
            console.warn(detail);

            /*Transaction().store.add({
                timestamp: Date.now(),
                pow: detail,
            });*/

        });

        Emitter.addEventListener('mot', ({ detail }) => {
            //console.warn(detail);
            if (SetOrigin) {
                Origin = detail;
                SetOrigin = false;
            }

            detail = detail.map((x, i) => x - Origin[i]);
            const detailAbs = detail.map(Math.abs);
            const Max = Math.max(...detailAbs);
            const Index = detailAbs.indexOf(Max);

            const Angles = Array(detail.length).fill(0);
            if (Max > DeadZone) {
                Angles[Index] = detail[Index] * Speed;
            }

            console.log('Emotiv Angle', Angles);
            fn(Angles);
        });
    });
