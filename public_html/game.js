// @ts-nocheck
import { JoyStick, SFX } from "./libs/toon3d.esm.js";
import { Player, PlayerLocal } from "./Player.js";
import { ModelLoader } from "./ModelLoader.js";
import { THREE } from "./three.js";
import { GLTFLoader, FBXLoader } from "./three.js";
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

    this.modes = Object.freeze({
      NONE: Symbol("none"),
      PRELOAD: Symbol("preload"),
      INITIALISING: Symbol("initialising"),
      CREATING_LEVEL: Symbol("creating_level"),
      ACTIVE: Symbol("active"),
      GAMEOVER: Symbol("gameover"),
    });
    this.mode = this.modes.NONE;

    this.THREE = THREE;
    this.container;
    this.player = {};
    this.cameras;
    this.camera;
    this.scene = new THREE.Scene();
    this.sceneProxy = new SceneProxy(this.scene);
    this.renderer;
    this.animations = {};
    this.assetsPath = "assets/";

    this.entities = {}

    this.modelLoader = new ModelLoader();
    this.remotePlayers = [];
    this.remoteColliders = [];
    this.initialisingPlayers = [];
    this.remoteData = [];

    this.messages = {
      text: ["Welcome to Blockland", "GOOD LUCK!"],
      index: 0,
    };

    this.container = document.createElement("div");
    this.container.style.height = "100%";
    document.body.appendChild(this.container);

    const sfxExt = SFX.supportsAudioType("mp3") ? "mp3" : "ogg";

    this.anims = ANIMS;

    this.clock = new THREE.Clock();

    window.onError = function (error) {
      console.error(JSON.stringify(error));
    };

    this.mode = this.modes.INITIALISING;

    this.camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      10,
      200000
    );

    this.scene.background = new THREE.Color(0x00a0f0);

    const ambient = new THREE.AmbientLight(0xaaaaaa);
    this.scene.add(ambient);

    const light = new THREE.DirectionalLight(0xaaaaaa);
    light.position.set(30, 100, 40);
    light.target.position.set(0, 0, 0);

    light.castShadow = true;

    const lightSize = 500;
    light.shadow.camera.near = 1;
    light.shadow.camera.far = 500;
    light.shadow.camera.left = light.shadow.camera.bottom = -lightSize;
    light.shadow.camera.right = light.shadow.camera.top = lightSize;

    light.shadow.bias = 0.0039;
    light.shadow.mapSize.width = 1024;
    light.shadow.mapSize.height = 1024;

    this.sun = light;
    this.scene.add(light);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.container.appendChild(this.renderer.domElement);

    window.addEventListener(
      "ontouchstart" in window ? "touchdown" : "mousedown",
      (event) => this.onMouseDown(event),
      false
    );
    window.addEventListener(
      "mousemove",
      (event) => {
        // calculate mouse position in normalized device coordinates
        // (-1 to +1) for both components
        const mouse = new THREE.Vector2();
        mouse.x =
          (event.clientX / this.renderer.domElement.clientWidth) * 2 - 1;
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
      },
      false
    );

    window.addEventListener("resize", () => this.onWindowResize(), false);

    // Load scene
    this.player = new PlayerLocal(this);

    this.speechBubble = new SpeechBubble(this, "", 150);
    this.speechBubble.mesh.position.set(0, 350, 0);

    this.joystick = new JoyStick({
      onMove: this.playerControl,
      game: this,
    });
    // this.loadEnvironment();
    // this.loadNextAnim();

    // Start animation
    // game.animate();
  }

  persist() {
    localStorage.setItem('graph', JSON.stringify(this.entities))
  }

  // Sugar
  async load(...args) {
    const object = await this.modelLoader.load(...args)
    this.scene.add(object)
    return object
  }

  play() {
    this.playing = true;
    this.animate();
  }
  stop() {
    this.playing = false;
  }

  animate() {
    const game = this;
    const dt = this.clock.getDelta();

    requestAnimationFrame(() => {
      // console.time('animate')
      if (this.playing) {
        game.animate();
        // this.renderer.render(this.scene, this.camera);
      }
      // console.timeEnd('animate')
    });

    this.updateRemotePlayers(dt);

    if (this.player.mixer && this.mode == this.modes.ACTIVE)
      this.player.mixer.update(dt);

    if (this.player.action == "Walking") {
      const elapsedTime = Date.now() - this.player.actionTime;
      if (elapsedTime > 1000 && this.player.motion.forward > 0) {
        this.player.action = "Running";
      }
    }

    if (this.player.motion) this.player.move(dt);

    if (
      this.cameras &&
      this.cameras.active &&
      this.player &&
      this.player.object
    ) {
      this.camera.position.lerp(
        this.cameras.active.getWorldPosition(new THREE.Vector3()),
        0.05
      );
      const pos = this.player.object.position.clone();
      if (this.cameras.active == this.cameras.chat) {
        pos.y += 200;
      } else {
        pos.y += 300;
      }
      this.camera.lookAt(pos);
    }

    if (this.sun) {
      this.sun.position.copy(this.camera.position);
      this.sun.position.y += 10;
    }

    if (this.speechBubble) this.speechBubble.show(this.camera.position);

    this.renderer.render(this.scene, this.camera);
  }

  initSfx() {
    this.sfx = {};
    this.sfx.context = new (window.AudioContext || window.webkitAudioContext)();
    this.sfx.gliss = new SFX({
      context: this.sfx.context,
      src: {
        mp3: `${this.assetsPath}sfx/gliss.mp3`,
        ogg: `${this.assetsPath}sfx/gliss.ogg`,
      },
      loop: false,
      volume: 0.3,
    });
  }

  set activeCamera(object) {
    this.cameras.active = object;
  }
  get activeCamera() {
    return this.cameras.active;
  }

  // Scene proxy
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

  loadAssets(urls = []) {
    return Promise.all(urls.map(url => this.loadAsset(url)))
  }

  loadAsset(url = [], key = "") {
    const loader = new FBXLoader();

    const game = this;
    return new Promise((resolve, reject) => {
      loader.load(`${url}`, function (object) {
        game.player.animations[key] = object.animations[0];
        // if (game.anims.length > 0) {
        //   game.loadNextAnim();
        // } else {
        //   delete game.anims;
        //   game.action = "Idle";
        //   game.mode = game.modes.ACTIVE;
        // }
        resolve(object);
      });
    });
  }

  playerControl(forward = 0, turn = 0) {
    const { player } = this;

    // console.log({...player}, forward, turn)
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
    const offset = new THREE.Vector3(0, 80, 0);
    const front = new THREE.Object3D();
    front.position.set(112, 100, 600);
    front.parent = this.player.object;
    const back = new THREE.Object3D();
    back.position.set(0, 300, -1050);
    back.parent = this.player.object;
    const chat = new THREE.Object3D();
    chat.position.set(0, 200, -450);
    chat.parent = this.player.object;
    const wide = new THREE.Object3D();
    wide.position.set(178, 139, 1665);
    wide.parent = this.player.object;
    const overhead = new THREE.Object3D();
    overhead.position.set(0, 400, 0);
    overhead.parent = this.player.object;
    const collect = new THREE.Object3D();
    collect.position.set(40, 82, 94);
    collect.parent = this.player.object;
    
    this.cameras = { front, back, wide, overhead, collect, chat };
    this.activeCamera = this.cameras.back;
  }

  showMessage(msg, fontSize = 20, onOK = null) {
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
    )
      return;

    const newPlayers = [];
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

  onMouseDown(event) {
    if (
      !this.remoteColliders ||
      this.remoteColliders.length == 0 ||
      !this.speechBubble ||
      !this.speechBubble.mesh
    )
      return;

    const chat = document.getElementById("chat");

    // calculate mouse position in normalized device coordinates
    // (-1 to +1) for both components
    const mouse = new THREE.Vector2();
    mouse.x = (event.clientX / this.renderer.domElement.clientWidth) * 2 - 1;
    mouse.y = -(event.clientY / this.renderer.domElement.clientHeight) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, this.camera);

    const intersects = raycaster.intersectObjects(this.remoteColliders);

    if (intersects.length > 0) {
      const object = intersects[0].object;
      const players = this.remotePlayers.filter(function (player) {
        if (player.collider && player.collider == object) {
          return true;
        }
      });

      // document.body.style.cursor = "inherit";

      if (players.length > 0) {
        const player = players[0];

        // document.body.style.cursor = "pointer";
        console.log(`onMouseDown: player ${player.id}`);
        this.speechBubble.player = player;
        this.speechBubble.update("");
        this.scene.add(this.speechBubble.mesh);
        this.chatSocketId = player.id;
        chat.style.bottom = "0px";
        this.activeCamera = this.cameras.chat;
      }
    } else {
      //Is the chat panel visible?
      if (
        chat.style.bottom == "0px" &&
        window.innerHeight - event.clientY > 40
      ) {
        console.log("onMouseDown: No player found");
        if (this.speechBubble.mesh.parent !== null)
          this.speechBubble.mesh.parent.remove(this.speechBubble.mesh);
        delete this.speechBubble.player;
        delete this.chatSocketId;
        chat.style.bottom = "-50px";
        this.activeCamera = this.cameras.back;
      } else {
        console.log("onMouseDown: typing");
      }
    }
  }

  getRemotePlayerById(id) {
    if (!this.remotePlayers || this.remotePlayers.length == 0)
      return;

    const players = this.remotePlayers.filter(function (player) {
      if (player.id == id) return true;
    });

    if (players.length == 0) return;

    return players[0];
  }
}

class SpeechBubble {
  constructor(game, msg, size = 1) {
    this.config = {
      font: "Calibri",
      size: 24,
      padding: 10,
      colour: "#222",
      width: 256,
      height: 256,
    };

    const planeGeometry = new THREE.PlaneGeometry(size, size);
    const planeMaterial = new THREE.MeshBasicMaterial();
    this.mesh = new THREE.Mesh(planeGeometry, planeMaterial);
    game.scene.add(this.mesh);

    const self = this;
    const loader = new THREE.TextureLoader();
    loader.load(
      // resource URL
      `${game.assetsPath}images/speech.png`,

      // onLoad callback
      function (texture) {
        // in this example we create the material when the texture is loaded
        self.img = texture.image;
        self.mesh.material.map = texture;
        self.mesh.material.transparent = true;
        self.mesh.material.needsUpdate = true;
        if (msg) self.update(msg);
      },

      // onProgress callback currently not supported
      undefined,

      // onError callback
      function (err) {
        console.error("An error happened.");
      }
    );
  }

  update(msg) {
    if (this.mesh === undefined) return;

    let context = this.context;

    if (this.mesh.userData.context === undefined) {
      const canvas = this.createOffscreenCanvas(
        this.config.width,
        this.config.height
      );
      this.context = canvas.getContext("2d");
      context = this.context;
      context.font = `${this.config.size}pt ${this.config.font}`;
      context.fillStyle = this.config.colour;
      context.textAlign = "center";
      this.mesh.material.map = new THREE.CanvasTexture(canvas);
    }

    const bg = this.img;
    context.clearRect(0, 0, this.config.width, this.config.height);
    context.drawImage(
      bg,
      0,
      0,
      bg.width,
      bg.height,
      0,
      0,
      this.config.width,
      this.config.height
    );
    this.wrapText(msg, context);

    this.mesh.material.map.needsUpdate = true;
  }

  createOffscreenCanvas(w, h) {
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    return canvas;
  }

  wrapText(text, context) {
    const words = text.split(" ");
    let line = "";
    const lines = [];
    const maxWidth = this.config.width - 2 * this.config.padding;
    const lineHeight = this.config.size + 8;

    words.forEach(function (word) {
      const testLine = `${line}${word} `;
      const metrics = context.measureText(testLine);
      const testWidth = metrics.width;
      if (testWidth > maxWidth) {
        lines.push(line);
        line = `${word} `;
      } else {
        line = testLine;
      }
    });

    if (line != "") lines.push(line);

    let y = (this.config.height - lines.length * lineHeight) / 2;

    lines.forEach(function (line) {
      context.fillText(line, 128, y);
      y += lineHeight;
    });
  }

  show(pos) {
    if (this.mesh && this.player) {
      this.mesh.position.set(
        this.player.object.position.x,
        this.player.object.position.y + 380,
        this.player.object.position.z
      );
      this.mesh.lookAt(pos);
    }
  }
}
