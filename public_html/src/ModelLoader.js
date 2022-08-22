import { GLTFLoader, FBXLoader } from "./three.js";
import { THREE } from "./three.js";

export const resolvers = {
  glb: new GLTFLoader(),
  fbx: new FBXLoader(),
};

function processGltfModel(gltf) {
  const { scene } = gltf;

  scene.traverse(function (object) {
    if (object.isMesh) {
      object.castShadow = true;
    }
  });

  // Add animation object
  // Usage:
  // actions['Idle'].play()
  const mixer = new THREE.AnimationMixer(scene);
  const actions = {};
  const clips = [];
  gltf.animations.forEach((a) => {
    const clip = mixer.clipAction(a);
    clips.push(clip);
    actions[a.name] = clip;
  });
  gltf.actions = actions;
  gltf.clips = clips;

  gltf.mixer = mixer;

  return gltf;
}

class Entity {
  constructor(scene) {
    const mixer = new THREE.AnimationMixer(scene);
    this.mixer = mixer;
  }
  update() {
    this.mixer.update();
  }
}

export class ModelLoader {
  constructor() {
    this.resolvers = resolvers;
  }

  /**
   *
   * @param {*} url
   * @returns { scene, animations, ... }
   */
  async load(url = "") {
    // Detect loader
    const ext = url.slice(url.lastIndexOf(".")).substring(1);

    const loader = resolvers[ext];
    if (!loader) {
      throw new Error(
        `Sorry can't find suitable loader for extension: ${ext} [${url}]`
      );
    }

    // Container
    const container = new THREE.Object3D();
    container.name = url;

    // Convert THREE loader to Promise
    return new Promise((resolve, reject) => {
      loader.load(url, (objectWrapper) => {
        if (ext === "glb") {
          const gltf = processGltfModel(objectWrapper);
          resolve(gltf);
          return;
        }

        // Assume FBX for now
        const scene = objectWrapper;
        scene.traverse(function (object) {
          if (object.isMesh) {
            object.castShadow = true;
          }
        });
        // resolve(object.scene ? object.scene : object)
        resolve({
          scene: objectWrapper,
        });
      });
    });
  }

  /**
   *
   * @param {*} url
   * @returns { scene, animations, ... }
   */
  async loadGlb(url = "") {
    const loader = new GLTFLoader();

    // Convert THREE loader to Promise
    return new Promise((resolve, reject) => {
      new GLTFLoader().load(url, (objectWrapper) => {
        // Mixin animations: actions (object), clips (array)
        const gltf = processGltfModel(objectWrapper);
        resolve(gltf);
      });
    });
  }
}
