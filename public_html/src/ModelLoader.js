import { GLTFLoader, FBXLoader } from "./three.js";
import { THREE } from "./three.js";

// NOTE raypicking with glb files
// https://stackoverflow.com/questions/15492857/any-way-to-get-a-bounding-box-from-a-three-js-object3d
// geometry.computeBoundingBox();  // otherwise geometry.boundingBox will be undefined
// Nice example https://codepen.io/Ip3ly5/project/editor/ZLRQNr#0

export const resolvers = {
  glb:new GLTFLoader(),
  fbx: new FBXLoader(),
};

export class ModelLoader {
  constructor() {
    this.resolvers = resolvers;
  }

  async load(url = "") {
    // Detect loader
    const ext = url.slice(url.lastIndexOf(".")).substring(1);

    const loader = resolvers[ext];
    if (!loader) {
      throw new Error(
        `Sorry can't find suitable loader for extension: ${ext} [${url}]`
      );
    }

    const container = new THREE.Object3D();
    container.name = url;
    // scene.add(container);

    // Convert THREE loader to Promise
    return new Promise((resolve, reject) => {
        loader.load(url, object => {
            resolve(object.scene ? object.scene : object)
        });
    })
  }

  processGltfModel(gltf, container) {
    const model = gltf.scene;

    model.traverse(function (object) {
      // if (object.isMesh)
      object.castShadow = true;
    });
    container.add(model);
    // scene.add(model);

    // Helper
    // const { THREE, scene } = ctx;
    {
      const box = new THREE.BoxHelper(model, 0xffff00);
      container.add(box);
    }

    // Add animation object
    // Usage:
    // actions['Idle'].play()
    const mixer = new THREE.AnimationMixer(model);
    const actions = {};
    gltf.animations.forEach((a) => {
      actions[a.name] = mixer.clipAction(a);
    });
    gltf.actions = actions;
  }
}
