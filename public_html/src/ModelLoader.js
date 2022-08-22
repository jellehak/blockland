import { Scene } from "three";
import { GLTFLoader, FBXLoader } from "./three.js";
import { THREE } from "./three.js";

// NOTE raypicking with glb files
// https://stackoverflow.com/questions/15492857/any-way-to-get-a-bounding-box-from-a-three-js-object3d
// geometry.computeBoundingBox();  // otherwise geometry.boundingBox will be undefined
// Nice example https://codepen.io/Ip3ly5/project/editor/ZLRQNr#0

export const resolvers = {
  glb: new GLTFLoader(),
  fbx: new FBXLoader(),
};

function processGltfModel(gltf) {
  const {scene} = gltf;

  scene.traverse(function (object) {
    // if (object.isMesh)
    object.castShadow = true;
  });
  // parent.add(scene);
  // scene.add(scene);

  // Helper
  // {
  //   const box = new THREE.BoxHelper(scene, 0xffff00);
  //   container.add(box);
  // }

  // Add animation object
  // Usage:
  // actions['Idle'].play()
  const mixer = new THREE.AnimationMixer(scene);
  const actions = {};
  const clips = [];
  gltf.animations.forEach((a) => {
    const clip = mixer.clipAction(a)
    clips.push(clip);
    actions[a.name] = clip
  });
  gltf.actions = actions;
  gltf.clips = clips;

  gltf.mixer = mixer

  return gltf
}

class Entity {
  constructor(scene) {
    const mixer = new THREE.AnimationMixer(scene);
    this.mixer = mixer
  }
  update() {
    this.mixer.update()
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

    const container = new THREE.Object3D();
    container.name = url;

    // Convert THREE loader to Promise
    return new Promise((resolve, reject) => {
        loader.load(url, objectWrapper => {
          const gltf = processGltfModel(objectWrapper)
          // resolve(object.scene ? object.scene : object)
          resolve(gltf)
        });
    })
  } 
}
