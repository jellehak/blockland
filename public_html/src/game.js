// @ts-nocheck
import { JoyStick, SFX } from "./toon3d.esm.js";
import { Player, PlayerLocal } from "./Player.js";
import { ModelLoader } from "./ModelLoader.js";
import { THREE } from "./three.js";
import { GLTFLoader, FBXLoader } from "./three.js";
import { FollowCamera } from "./FollowCamera.js";
import { Storage } from "./Storage.js";
export * from "./PlayerController.js";

class SceneProxy {
  constructor(scene) {
    this.stack = [];
    this.scene = scene;
  }
  add(what) {
    window.last = what;

    this.stack.push(what);
    this.scene.add(what);
  }
  undo() {}
}

export function createCameras(game) {
  const offset = new THREE.Vector3(0, 80, 0);
  const front = new THREE.Object3D();
  front.position.set(112, 100, 600);
  front.parent = game.player.object;
  const back = new THREE.Object3D();
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

  game.cameras = { front, back, wide, overhead, collect, chat };
  game.activeCamera = game.cameras.back;
}

/**
 * @example
 */
export class Keyboard {
  constructor() {
    // CONTROL KEYS
    const keysPressed = {};

    this.keysPressed = keysPressed;

    const keydown = (event) => {
      // if (event.shiftKey && characterControls) {
      //     characterControls.switchRunToggle()
      // }

      keysPressed[event.key.toLowerCase()] = true;
    };

    const keyup = (event) => {
      keysPressed[event.key.toLowerCase()] = false;
    };

    document.addEventListener("keydown", keydown, false);
    document.addEventListener("keyup", keyup, false);

    this.dispose = () => {
      document.removeEventListener("keydown", keydown);
      document.removeEventListener("keyup", keyup);
    };
  }
}

const ANIMS = [
  "Walking",
  "Walking Backwards",
  "Turn",
  "Running",
  "Pointing",
  "Talking",
  "Pointing Gesture",
];
export class Game {
  constructor() {
    const game = this;

    this.storage = new Storage(this);

    this.THREE = THREE;
    this.container;
    this.cameras;
    this.camera;
    this.scene = new THREE.Scene();
    this.sceneProxy = new SceneProxy(this.scene);
    this.stack = [];
    this.renderer;
    this.animations = {};
    this.assetsPath = "assets/";
    this.modelLoader = new ModelLoader();
    // Network
    {
      const socket = io({
        autoConnect: false,
      });
      // socket.connect();
      this.socket = socket;
    }
    this.entities = {};
    this.rafs = [];
    this.player = null;
    this.remotePlayers = [];
    this.remoteColliders = [];
    this.initialisingPlayers = [];
    this.remoteData = [];
    this.anims = ANIMS;
    this.clock = new THREE.Clock();
    this.camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      10,
      20000
    );

    // Set default cam pointing to origin
    this.camera.position.z = 50;
    this.camera.position.y = 50;

    const { scene } = this

    scene.background = new THREE.Color(0x00a0f0);

    const ambient = new THREE.AmbientLight(0xaaaaaa);
    scene.add(ambient);

    {
      const light = new THREE.DirectionalLight(0xaaaaaa);
      light.position.set(30, 100, 40);
      light.target.position.set(0, 0, 0);

      light.castShadow = true;

      const lightSize = 500;
      light.shadow.camera.near = 1;
      light.shadow.camera.far = 50000;
      light.shadow.camera.left = light.shadow.camera.bottom = -lightSize;
      light.shadow.camera.right = light.shadow.camera.top = lightSize;
      light.shadow.bias = 0.0039;
      light.shadow.mapSize.width = 1024;
      light.shadow.mapSize.height = 1024;

      const helper = new THREE.DirectionalLightHelper( light, 5 );
      scene.add( helper );

      this.sun = light;
      scene.add(light);
    }

    {
      this.renderer = new THREE.WebGLRenderer({ antialias: true });
      this.renderer.setPixelRatio(window.devicePixelRatio);
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.renderer.shadowMap.enabled = true;
      this.container = document.createElement("div");
      this.container.style.height = "100%";
      document.body.appendChild(this.container);
      this.container.appendChild(this.renderer.domElement);
    }

    // Set pointer for clickable objects
    const onMouseMove = (event) => {
      // calculate mouse position in normalized device coordinates
      // (-1 to +1) for both components
      const mouse = new THREE.Vector2();
      mouse.x = (event.clientX / this.renderer.domElement.clientWidth) * 2 - 1;
      mouse.y =
        -(event.clientY / this.renderer.domElement.clientHeight) * 2 + 1;

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, this.camera);

      const intersects = raycaster.intersectObjects(this.remoteColliders);

      this.intersects = intersects;

      if (!intersects.length) {
        document.body.style.cursor = "inherit";
      }

      if (intersects.length > 0) {
        const object = intersects[0].object;
        const players = this.remotePlayers.filter(function (player) {
          if (player.collider && player.collider == object) {
            return true;
          }
        });

        if (players.length > 0) {
          const player = players[0];
          document.body.style.cursor = "pointer";
        }
      }
    };
    window.addEventListener("mousemove", onMouseMove, false);
    window.addEventListener("resize", () => this.onWindowResize(), false);

    // Example load...
    // {
    //   const player = new PlayerLocal(this);
    //   this.player = player;
    //   this.entities.player = player;
    // }

    // this.joystick = new JoyStick({
    //   onMove: this.playerControl,
    //   game: this,
    // });
    this.cameraController = new FollowCamera(this);
  }

  get stackWithMatrix() {
    return this.stack.map((stack) => {
      const object = this.scene.getObjectById(stack.id);
      if (!object) {
        throw new Error(`Could not resolve object with ${stack.id}`);
      }
      return {
        ...stack,
        // Root Object Mutations
        position: object.position,
        scale: object.scale,
        rotation: object.rotation,
        userData: object.userData,
      };
    });
  }

  /**
   * Load a model
   * @param  {...any} args
   * @returns
   */
  async load(...args) {
    const entity = await this.modelLoader.load(...args);

    // add to scene
    const object = entity.scene;
    this.add(object);

    // Set Name
    const getFilename = (url) => url.substring(url.lastIndexOf("/") + 1);
    object.name = getFilename(args[0]);

    // Mixer ?
    if (entity.mixer) {
      // Play first animation?
      entity.clips[0].play();
      this.rafs.push((dt) => {
        entity.mixer.update(dt);
      });
    }

    // Replay
    this.stack.push({
      method: "load",
      args,
      createdAt: new Date(),
      // resolved: true,
      id: object.id,
    });

    // Bind entity info
    object.entity = entity;

    // Mixin specials
    // object.addScript = (script = ()=>{}) => {
    //   script(this)
    // }

    return object;
  }

  select(what) {
    const { THREE, scene } = game;
    const box = new THREE.BoxHelper(what, 0xffff00);
    what.add(box);
  }

  async addAsync(promise) {
    const response = await promise;
    // Assume default export method
    const resp = response.default(game);
    return resp
  }
  
  async loadAsync(promise) {
    // const container = new THREE.Object3D()
    const response = await promise;
    // Assume default export method
    const resp = response.default(game);
    return resp
  }

  add(what) {
    this.sceneProxy.add(what);
  }

  undo(what) {
    this.sceneProxy.undo();
  }

  reset() {
    const { scene } = this;
    scene.children.forEach((child) => {
      scene.remove(child);
    });
    // this.init()
  }

  // loadAssets(urls = []) {
  //   return Promise.all(urls.map((url) => this.loadAsset(url)));
  // }

  loadAsset(url = [], key = "", parent = null) {
    const loader = new FBXLoader();

    return new Promise((resolve, reject) => {
      loader.load(`${url}`, function (object) {
        // game.player.animations[key] = object.animations[0];
        parent.animations[key] = object.animations[0];
        resolve(object);
      });
    });
  }

  play() {
    this.playing = true;
    this.animate();
  }
  stop() {
    this.playing = false;
  }

  onUpdate(cb) {
    this.rafs.push(cb);
  }

  animate() {
    const game = this;
    const dt = this.clock.getDelta(); // seconds

    // Keep looping
    requestAnimationFrame(() => {
      // console.time('animate')
      if (this.playing) {
        try {
          game.animate();
        } catch (err) {
          this.stop();
          throw new Error(err);
        }
      }
      // console.timeEnd('animate')
    });

    // Play all rafs
    this.rafs.forEach((raf) => {
      raf(dt);
    });
    // userData Script runner
    // const hasScripts = game.scene.children.filter(e => e.userData.scripts)
    // game.scene.children.forEach(function (object) {
    //   if (object.userData.script) {
    //     // object.userData.script(game)
    //   }
    // });

    game.updateRemotePlayers(dt);

    if (game.player) {
      game.player.step(dt);
    }

    // Third person follow camera
    game.cameraController.update(dt);

    // if (game.sun) {
    //   game.sun.position.copy(game.camera.position);
    //   game.sun.position.y += 10;
    // }

    game.renderer.render(game.scene, game.camera);
  }

  disableFollowCamera() {
    game.cameraController.active = null;
  }
  set activeCamera(object = null) {
    this.cameraController.active = object;
  }
  get activeCamera() {
    return this.cameraController.active;
  }

  playerControl(forward = 0, turn = 0) {
    const { player } = this;

    turn = -turn;

    if (forward > 0.3) {
      if (player.action != "Walking" && player.action != "Running")
        player.action = "Walking";
    } else if (forward < -0.3) {
      if (player.action != "Walking Backwards")
        player.action = "Walking Backwards";
    } else {
      forward = 0;
      if (Math.abs(turn) > 0.1) {
        if (player.action != "Turn") player.action = "Turn";
      } else if (player.action != "Idle") {
        player.action = "Idle";
      }
    }

    if (forward == 0 && turn == 0) {
      delete player.motion;
    } else {
      player.motion = { forward, turn };
    }

    if (player.updateSocket) {
      player.updateSocket();
    }
  }

  createCameras() {
    return createCameras(this);
  }

  showMessage(msg = "", fontSize = 20, onOK = null) {
    const txt = document.getElementById("message_text");
    txt.innerHTML = msg;
    txt.style.fontSize = fontSize + "px";
    const btn = document.getElementById("message_ok");
    const panel = document.getElementById("message");
    const game = this;
    if (onOK != null) {
      btn.onclick = function () {
        panel.style.display = "none";
        onOK.call(game);
      };
    } else {
      btn.onclick = function () {
        panel.style.display = "none";
      };
    }
    panel.style.display = "flex";
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  updateRemotePlayers(dt) {
    if (
      !this.remoteData ||
      this.remoteData.length == 0 ||
      !this.player ||
      !this.player.id
    ) {
      // console.info('nothing to update')
      return;
    }

    const game = this;
    //Get all remotePlayers from remoteData array
    const remotePlayers = [];
    const remoteColliders = [];

    this.remoteData.forEach(function (data) {
      if (game.player.id != data.id) {
        //Is this player being initialised?
        let iplayer;
        game.initialisingPlayers.forEach(function (player) {
          if (player.id == data.id) iplayer = player;
        });
        //If not being initialised check the remotePlayers array
        if (!iplayer) {
          let rplayer;
          game.remotePlayers.forEach(function (player) {
            if (player.id == data.id) rplayer = player;
          });
          if (!rplayer) {
            //Initialise player
            game.initialisingPlayers.push(new Player(game, data));
          } else {
            //Player exists
            remotePlayers.push(rplayer);
            remoteColliders.push(rplayer.collider);
          }
        }
      }
    });

    // Loop scene
    this.scene.children.forEach(function (object) {
      if (
        object.userData.remotePlayer &&
        game.getRemotePlayerById(object.userData.id) == undefined
      ) {
        game.scene.remove(object);
      }
    });

    this.remotePlayers = remotePlayers;
    this.remoteColliders = remoteColliders;
    this.remotePlayers.forEach(function (player) {
      player.update(dt);
    });
  }

  getRemotePlayerById(id = "") {
    if (!this.remotePlayers || this.remotePlayers.length == 0) return;

    const players = this.remotePlayers.filter(function (player) {
      if (player.id == id) return true;
    });

    if (players.length == 0) return;

    return players[0];
  }
}
