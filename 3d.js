import { THREE, scene } from './three.js';

class CustomSinCurve extends THREE.Curve {

    constructor() {
        super();
    }

    getPoint(t, optionalTarget = new THREE.Vector3()) {
        const tx = t * 3 - 1.5;
        const ty = Math.sin(2 * Math.PI * t);
        const tz = 0;
        return optionalTarget.set(tx, ty, tz);
    }

}

const path = new CustomSinCurve();
const geometry = new THREE.TubeGeometry(path, 20, 2, 8, false);
const material = new THREE.MeshPhongMaterial({
    color: 0x00ff00,
    //wireframe: true

});
const mesh = new THREE.Mesh(geometry, material);
scene.add(mesh);
