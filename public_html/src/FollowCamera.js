import { THREE } from "./three.js";

/**
 * 
 * @param {*} parent game.player.object
 * @returns 
 */
export function createCameras(parent) {
  const offset = new THREE.Vector3(0, 80, 0);
  const cameras = {}
  
  const front = new THREE.Object3D();
  front.name = "front"
  front.position.set(112, 100, 600);
  front.parent = parent;
  const back = new THREE.Object3D();
  back.name = "back"
  back.position.set(0, 300, -1050);
  back.parent = parent;
  const chat = new THREE.Object3D();
  chat.position.set(0, 200, -450);
  chat.parent = parent;
  const wide = new THREE.Object3D();
  wide.position.set(178, 139, 1665);
  wide.parent = parent;
  const overhead = new THREE.Object3D();
  overhead.position.set(0, 400, 0);
  overhead.parent = parent;
  const collect = new THREE.Object3D();
  collect.position.set(40, 82, 94);
  collect.parent = parent;

  return { front, back, wide, overhead, collect, chat };
  // game.activeCamera = game.cameras.back;
}

export class FollowCamera {
  constructor(game) {
    if(!game.player) {
      console.warn('No player found for FollowCamera, falling back to scene')
    }
    const container = game.player && game.player.object || game.scene
    this.camera = game.camera;
    this.cameras = createCameras(container)
    this.cameras.active = null
    this.player = game.player
    this.active = this.cameras.back;
    this.cameraHeight = 30;
  }

  disableFollowCamera() {
    this.cameras.active = null;
  }
  set active(object) {
    this.cameras.active = object;
  }
  get active() {
    return this.cameras.active;
  }

  update(dt) {
    if(!this.cameras.active) {
      return
    }
    if(!this.player || !this.player.object) {
      return
    }

    console.log('lerp cam')
    this.camera.position.lerp(
      this.cameras.active.getWorldPosition(new THREE.Vector3()),
      0.05
    );
    const pos = this.player.object.position.clone();
    pos.y += this.cameraHeight;
    this.camera.lookAt(pos);
  }
}
