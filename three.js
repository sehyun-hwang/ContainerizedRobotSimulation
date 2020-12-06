import * as THREE from 'https://cdn.jsdelivr.net/npm/three/build/three.module.js';
const { Vector3 } = THREE;
export { THREE, Vector3 };
export const Z = new THREE.Vector3(0, 0, 1);

import Stats from 'https://cdn.jsdelivr.net/npm/three/examples/jsm/libs/stats.module.min.js';
import { OrbitControls } from "https://cdn.jsdelivr.net/npm/three/examples/jsm/controls/OrbitControls.js";

import Load from './three-loader.js';
export { Load };

export const Rad = deg => deg / 180 * Math.PI;

const element = document.querySelector('#three');

export const camera = new THREE.PerspectiveCamera();
export const renderer = new THREE.WebGLRenderer({ antialias: true });
export const scene = new THREE.Scene();
export const clock = new THREE.Clock();
const control = new OrbitControls(camera, renderer.domElement);
export { control as orbit };
export const stats = new Stats();


element.appendChild(renderer.domElement);
camera.position.set(0, 0, 10);
//scene.add(new THREE.AmbientLight());
scene.add(new THREE.HemisphereLight(undefined, .1));
const light = new THREE.PointLight();
light.position.set(0, 0, 1);
scene.add(light);

{
    renderer.setClearColor(0x0F0F0F);
    renderer.setPixelRatio(window.devicePixelRatio);
} {
    const grid = new THREE.GridHelper(100, 100);
    grid.rotateX(Rad(90));
    scene.add(grid);
} {
    const { style } = stats.dom;
    style.position = 'absolute';
    style.left = 'unset';
    style.right = 0;
    element.appendChild(stats.dom);
} {
    control.enableKeys = false;
    control.WithTransformControls = TransformControls => TransformControls.addEventListener('dragging-changed',
        ({ value }) => control.enabled = !value);
}

function animate() {
    renderer.domElement.dispatchEvent(new CustomEvent('Render', {
        detail: clock.getDelta()
    }));
    requestAnimationFrame(animate);

    stats.update();
    control.update();
    renderer.render(scene, camera);
}

window.addEventListener('load', function () {
    renderer.setSize(element.offsetWidth, element.offsetHeight);
    clock.start();
    animate();
});

export function OnResize() {
    const {
        offsetWidth: width,
        offsetHeight: height,
    } = element;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
}

window.addEventListener('resize', OnResize, false);
