import { THREE } from "./three.js";

export function createCameras(game) {
  const offset = new THREE.Vector3(0, 80, 0);
  const cameras = {}
  
  const front = new THREE.Object3D();
  front.name = "front"
  front.position.set(112, 100, 600);
  front.parent = game.player.object;
  const back = new THREE.Object3D();
  back.name = "back"
  back.position.set(0, 300, -1050);
  back.parent = game.player.object;
  const chat = new THREE.Object3D();
  chat.position.set(0, 200, -450);
  chat.parent = game.player.object;
  const wide = new THREE.Object3D();
  wide.position.set(178, 139, 1665);
  wide.parent = game.player.object;
  const overhead = new THREE.Object3D();
  overhead.position.set(0, 400, 0);
  overhead.parent = game.player.object;
  const collect = new THREE.Object3D();
  collect.position.set(40, 82, 94);
  collect.parent = game.player.object;

  return { front, back, wide, overhead, collect, chat };
  // game.activeCamera = game.cameras.back;
}

export class FollowCamera {
  constructor(game) {
    this.camera = game.camera;
    this.cameras = createCameras(game)
    this.cameras.active = null
    this.player = game.player

    this.activeCamera = this.cameras.back;
  }

  disableFollowCamera() {
    this.cameras.active = null;
  }
  set activeCamera(object) {
    this.cameras.active = object;
  }
  get activeCamera() {
    return this.cameras.active;
  }

  update(dt) {
    if(!this.cameras.active) {
      return
    }
    if(!this.player.object) {
      return
    }

    this.camera.position.lerp(
      this.cameras.active.getWorldPosition(new THREE.Vector3()),
      0.05
    );
    const pos = this.player.object.position.clone();
    pos.y += 300;
    this.camera.lookAt(pos);
  }
}
