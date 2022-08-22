import { Object3D } from "three";
import { Game, Keyboard, PlayerController } from "./src/game.js";
import * as Engine from "./src/game.js";

const game = new Game();
window.game = game;
console.log("Feel free to interact with `game`");

// MOD skybox
{
  import("./mods/skybox/load.js").then((ns) => ns.default(game));
}

// OrbitControl https://threejs.org/docs/#examples/en/controls/OrbitControls
// import { OrbitControls } from 'https://unpkg.com/three@0.110.0/examples/jsm/controls/OrbitControls.js'
{
  const { camera, renderer } = game;
  const { OrbitControls } = await import(
    "https://unpkg.com/three@0.110.0/examples/jsm/controls/OrbitControls.js"
  );
  const controls = new OrbitControls(camera, renderer.domElement);

  function animate() {
    requestAnimationFrame(animate);

    // required if controls.enableDamping or controls.autoRotate are set to true
    controls.update();

    // renderer.render( scene, camera );
  }
  animate();
}

// MOD: Keyboard input
{
  const keyboard = new Keyboard();

  const input = {
    keyboard,
    state: {
      FORWARD: 0.8,
      TURN: 0.4,
    },
    dispose() {},
  };
  // Expose
  window.input = input;

  function update() {
    let forward = 0;
    let turn = 0;

    // console.log(k.keysPressed);
    if (keyboard.keysPressed["w"]) {
      forward = input.state.FORWARD;
    }
    if (keyboard.keysPressed["s"]) {
      forward = -input.state.FORWARD;
    }
    if (keyboard.keysPressed["a"]) {
      turn = -input.state.TURN;
    }
    if (keyboard.keysPressed["d"]) {
      turn = input.state.TURN;
    }

    if (game.player) {
      game.playerControl(forward, turn);
    }

    requestAnimationFrame(update);
  }

  // Wait some time
  setTimeout(() => {
    update();
  }, 3000);
}

// MOD: Stats
{
  console.log("Enable stats with game.stats()");
  window.game.stats = () => {
    var script = document.createElement("script");
    script.onload = function () {
      var stats = new Stats();
      document.body.appendChild(stats.dom);
      requestAnimationFrame(function loop() {
        stats.update();
        requestAnimationFrame(loop);
      });
    };
    script.src = "//mrdoob.github.io/stats.js/build/stats.min.js";
    document.head.appendChild(script);
  };
}

// MOD: Teleport
{
  //TODO
}

{
  const { GUI } = await import(
    "https://cdn.jsdelivr.net/npm/lil-gui@0.17/+esm"
  );

  const gui = new GUI();
  window.gui = gui;
}

{
  import("./src/SceneDebugGui.js");
}

// ORIGIN
{
  const { scene, THREE } = game;
  const axesHelper = new THREE.AxesHelper(100);
  scene.add(axesHelper);
}

// GUI: Camera
{
  const { gui } = window;
  if (game.cameras) {
    const folder = gui.addFolder(`Camera`).open(false);
    folder.add(game, "activeCamera", game.cameras);
    folder.add(game, "disableFollowCamera");
  }
}

{
  const folder = gui.addFolder("game");
  // .open(false);
  folder.add(game, "play");
  folder.add(game, "stop");
}

// GUI: Camera
{
  const { gui } = window;
  const folder = gui.addFolder(`Storage`).open(false);
  folder.add(game.storage, "persist");
  folder.add(game.storage, "restore");
}

// GUI: Entity Manager
{
  const { gui } = window;
  // gui.add( game, 'player', game.players )
  // TODO
}

{
  // const promises = [
  //   "Walking",
  //   "Walking Backwards",
  //   "Turn",
  //   "Running",
  //   "Pointing",
  //   "Talking",
  //   "Pointing Gesture",
  // ].map((anim) => {
  //   return game.loadAsset(`${game.assetsPath}fbx/anims/${anim}.fbx`, anim, game.player);
  // });
  // // Change walk speed
  // if (game.player) {
  //   game.player.state.RUN = 100;
  //   game.player.state.TURN = 20;
  // }
}

// MAIN
{
  game.stats();
  game.play();
}

class ZoneManager {
  constructor(num = 5 * 5) {
    this.WIDTH = 1000;

    const { THREE } = game;
    const sections = Array(num || 25).fill(0);

    const WIDTH = 1000;

    const scene = new THREE.Object3D();
    scene.name = "worlds";
    game.add(scene);

    sections.forEach((section, index) => {
      const geometry = new THREE.BoxGeometry(WIDTH, WIDTH, WIDTH);
      const material = new THREE.MeshBasicMaterial({
        visible: true,
        wireframe: true,
      });
      const box = new THREE.Mesh(geometry, material);
      // container.add(box);
      box.position.x = Math.floor(index / 5) * WIDTH;
      box.position.z = Math.floor(index % 5) * WIDTH;
      scene.add(box);
      return box;
    });
  }

  set(index, object) {
    object.position.x = Math.floor(index / 5) * this.WIDTH;
    object.position.z = Math.floor(index % 5) * this.WIDTH;
  }
}

// Create World placeholders
const zoneManager = new ZoneManager();

// Load world(s)
{
  const resp = await game.addAsync(import("./mods/desert/load.js"));
  // zoneManager.set(1)
}
{
  const resp = await game.addAsync(import("./mods/grass/load.js"));
  zoneManager.set(3, resp)
}
{
  const resp = await game.load("./mods/nature/FBX/BirchTree_1.fbx");
  resp.castShadow = true;
}

// Load Player
// {
//   const entity = await game.modelLoader.loadGlb("mods/models/Soldier.glb");
//   entity.scene.scale.setScalar(20);

//   window.last = entity
//   const c = new PlayerController()
//   c.attach(entity)
//   game.scene.add(entity.scene)
// }
