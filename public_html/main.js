import { Object3D } from "three";
import { Game, Keyboard, PlayerController } from "./src/game.js";
import * as Engine from "./src/game.js";

const game = new Game();
window.game = game;
console.log("Feel free to interact with `game`");
const { scene, THREE } = game;

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

  //controls.update() must be called after any manual changes to the camera's transform
  // camera.position.set( 0, 20, 100 );
  // controls.update();

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

    this.sections = sections;

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
    return object;
  }
  get(index) {
    return {
      x: Math.floor(index / 5) * this.WIDTH,
      y: 0,
      z: Math.floor(index % 5) * this.WIDTH,
    };
  }
}

// Create World placeholders
const zoneManager = new ZoneManager();
window.zoneManager = zoneManager;

// Load world(s)
{
  const grounds = {};
  const desert = await game.addAsync(import("./mods/desert/load.js"));
  grounds.desert = desert;

  const grass = await game.addAsync(import("./mods/grass/load.js"));
  grounds.grass = grass;

  // scene.add( zoneManager.set(0, grounds.desert.clone()) )
  // scene.add( zoneManager.set(1, grounds.desert.clone()) )
  // scene.add( zoneManager.set(2, grounds.desert.clone()) )

  const zones = new THREE.Object3D();
  zones.name = "zones";
  scene.add(zones);

  const materials = Object.values(grounds);
  zoneManager.sections.forEach((section, index) => {
    zones.add(zoneManager.set(index, materials[1].clone()));
  });
}
{
  const resp = await game.load("./mods/nature/FBX/BirchTree_1.fbx");
  // resp.castShadow = true;
  // const tree2 = await game.load("./mods/nature/FBX/BirchTree_2.fbx");
}

// {
//   {
//     const resp = await game.load("./mods/nature/FBX/BirchTree_1.fbx");
//     // Populate each zone
//     const zones = new THREE.Object3D();
//     scene.add(zones);
//     zoneManager.sections.forEach((section, index) => {
//       zones.add(zoneManager.set(index, resp.clone()));
//     });
//   }
// }

// {
//   const randomizeMatrix = (function () {
//     const position = new THREE.Vector3();
//     const rotation = new THREE.Euler();
//     const quaternion = new THREE.Quaternion();
//     const scale = new THREE.Vector3();

//     return function (matrix) {
//       position.x = Math.random() * 400 - 200;
//       position.y = Math.random() * 400 - 200;
//       position.z = Math.random() * 400 - 200;

//       rotation.x = 2 * Math.PI;
//       rotation.y = 2 * Math.PI;
//       rotation.z = 2 * Math.PI;
//       quaternion.setFromEuler(rotation);

//       scale.x = scale.y = scale.z = 1;

//       matrix.compose(position, quaternion, scale);
//     };
//   })();

//   const count = 10;

//   const mesh1 = await game.modelLoader.load("./mods/nature/FBX/BirchTree_1.fbx");
//   console.log(mesh1)

//   const mesh = mesh1.scene.children[0]
  
//   const matrix = new THREE.Matrix4();
//   const meshI = new THREE.InstancedMesh(mesh.geometry, mesh.material, count);
//   for (let i = 0; i < count; i++) {
//     randomizeMatrix(matrix);
//     meshI.setMatrixAt(i, matrix);
//   }
//   scene.add(meshI);
// }

// // Place random
// {
//   const mesh1 = await game.load("./mods/nature/FBX/BirchTree_1.fbx");
//   mesh1.castShadow = true;

//   const count = 100;
//   const mesh = new THREE.InstancedMesh(mesh1.geometry, mesh1.material, count);
//   // mesh.instanceMatrix.setUsage( THREE.DynamicDrawUsage ); // will be updated every frame

//   scene.add(mesh);

//   const dummy = new THREE.Object3D();

//   zoneManager.sections.forEach((section, index) => {
//     zoneManager.set(index, dummy);
//     dummy.updateMatrix();
//     console.log(index, dummy.position, dummy.matrix);
//     mesh.setMatrixAt(index, dummy.matrix);
//     // scene.add(mesh);
//   });
//   mesh.instanceMatrix.needsUpdate = true;
// }

// Load Player
// {
//   const entity = await game.modelLoader.loadGlb("mods/models/Soldier.glb");
//   entity.scene.scale.setScalar(20);

//   window.last = entity
//   const c = new PlayerController()
//   c.attach(entity)
//   scene.add(entity.scene)
// }
