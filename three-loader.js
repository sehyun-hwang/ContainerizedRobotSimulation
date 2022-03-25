const BASE = 'https://cdn.jsdelivr.net/npm/three@0.113/examples/jsm/';

const Paths = {
    TransformControls: "controls/TransformControls.js",
    OBB: 'math/OBB.js',
    ParametricGeometries: 'geometries/ParametricGeometries.js',
    MeshSurfaceSampler: 'math/MeshSurfaceSampler.js',
    CSG: './build/_snowpack/pkg/three-csg.js',
    CANNON: 'https://cdn.jsdelivr.net/npm/cannon/build/cannon.min.js',
    OBJLoader: 'loaders/OBJLoader.js',
    ArmBones: './ArmBones.js',
};

export default modules => Promise.all(modules.map(module => {
    if (module instanceof Promise)
        return module;

    const Path = Paths[module];
    if (!Path)
        return Promise.reject(x + 'does not exsists');

    let Base = '';
    try {
        new URL(Path);
    }
    catch (error) {
        if (!Path.startsWith('./'))
            Base = BASE;
    }

    return import (Base + Path)
        .then(Module => Module.default || (Object.keys(Module).length ? Module : window[module]));
}))
