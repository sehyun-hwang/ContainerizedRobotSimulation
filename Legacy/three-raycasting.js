import { scene, camera, renderer, stats } from './three.js';

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.117.0/build/three.module.js';

var raycaster = new THREE.Raycaster();
var mouse = new THREE.Vector2();

function onMouseMove(event) {

    // calculate mouse position in normalized device coordinates
    // (-1 to +1) for both components

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

}

let intersects_prev = [];

function render() {
    requestAnimationFrame(render)
    // update the picking ray with the camera and mouse position
    raycaster.setFromCamera(mouse, camera);

    // calculate objects intersecting the picking ray
    var intersects = raycaster.intersectObjects(scene.children);

    intersects_prev.length === intersects.length || console.log('Camera Raycasting', intersects);
    intersects_prev = intersects;

    for(var i = 0; i < intersects.length; i++) {

        intersects[i].object.material.color.set(0xff00ff);

    }

    renderer.render(scene, camera);
    stats.update();

}

render();

window.addEventListener('mousemove', onMouseMove, false);
