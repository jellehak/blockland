import { Object3D } from "three";
import { Game, Keyboard } from "./src/game.js";

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
  const {camera, renderer} = game
  const {OrbitControls} = await import ('https://unpkg.com/three@0.110.0/examples/jsm/controls/OrbitControls.js')
  const controls = new OrbitControls( camera, renderer.domElement );

  function animate() {

    requestAnimationFrame( animate );

    // required if controls.enableDamping or controls.autoRotate are set to true
    controls.update();

    // renderer.render( scene, camera );
  }
  animate()
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

    game.playerControl(forward, turn);

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

// Basic scene viewer
// https://lil-gui.georgealways.com/
{
  const { GUI } = await import(
    "https://cdn.jsdelivr.net/npm/lil-gui@0.17/+esm"
  );

  const gui = new GUI();
  window.gui = gui;

  const sceneFolder = gui.addFolder(`Scene`).open(false);

  const methods = {
    refresh() {
      // Cleanup
      // gui.folders[1].destroy();
      sceneFolder.children.map(child => child.destroy())
      sceneFolder.folders.map(child => child.destroy())
      scan(game.scene.children, sceneFolder);
    },
  };

  sceneFolder.add(methods, "refresh");

  const folder = gui.addFolder("game");
  // .open(false);
  // folder.add(game, "loadEnvironment");
  folder.add(game, "play");
  folder.add(game, "stop");

  // const sceneFolder = gui.addFolder(`Scene (${children.length})`).open(false);
  scan(game.scene.children, sceneFolder);

  // Scene
  function scan(children = [], sceneFolder) {
    children.map((node) => {
      const nodeFolder = sceneFolder
        .addFolder(node.name || node.type || node.id)
        .open(false);

      const obj = {
        select() {
          console.log(node);
          window.current = node;
          // node.removeFromParent();
        },
        open() {
          scan(node.children, nodeFolder)
          // node.removeFromParent();
        },
      };

      nodeFolder.add(node, "type");
      nodeFolder.add(node, "visible");
      {
        const folder = nodeFolder.addFolder("Position");
        folder.add(node.position, "x")
        folder.add(node.position, "y")
        folder.add(node.position, "z")
      }
      {
        const folder = nodeFolder.addFolder("Scale");
        folder.add(node.scale, "x")
        folder.add(node.scale, "y")
        folder.add(node.scale, "z")
      }
      {
        const folder = nodeFolder.addFolder("Rotation");
        folder.add(node.rotation, "_x")
        folder.add(node.rotation, "_y")
        folder.add(node.rotation, "_z")
        folder.add(obj, "select"); // button
        folder.add(obj, "open"); // button
      }

    });

    // Sync values
    setInterval(() => {
      // sceneFolder.updateDisplay()
    }, 500)
  }
}

// ORIGIN
{
  const { scene, THREE } = game;
  const axesHelper = new THREE.AxesHelper(100);
  scene.add(axesHelper);
}

// GUI: Camera
{
  const {gui} = window
  if(game.cameras) {
    const folder = gui.addFolder(`Camera`).open(false);
    folder.add( game, 'activeCamera', game.cameras )
    folder.add( game, 'disableFollowCamera' )
  }
}

// GUI: Entity Manager
{
  const {gui} = window
  // gui.add( game, 'player', game.players )
  // TODO
}

// MAIN
{
  const promises = [
    "Walking",
    "Walking Backwards",
    "Turn",
    "Running",
    "Pointing",
    "Talking",
    "Pointing Gesture",
  ].map((anim) => {
    return game.loadAsset(`${game.assetsPath}fbx/anims/${anim}.fbx`, anim);
  });
  game.stats();
  game.play();
  game.mode = game.modes.ACTIVE;

  // Change walk speed
  game.player.state.RUN = 1000;
  game.player.state.TURN = 2;
}

// NETWORK
{
  // const {Network} = await import("./src/Network.js")
  // const network = new Network()

  // window.network = network

  // const {gui} = window
  // const folder = gui.addFolder(`Network`)
  //   //.open(false);
  // // folder.domElement.children[1].innerHTML = 'cool'

  // folder.add(network, "server")
  // folder.add(network, "status")
  // folder.add(network, "id").listen()
}

// Mod Loader
{
  const files = await fetch("mods/files.txt").then(r => r.text()).then(files => files.split("\n"))
  console.log(files)
  const methods = {
    play(what) {
      console.log(what)
    },
  };
  // const folder = gui.addFolder("Worlds");
  // // .open(false);
  // folder.add(methods, "play");
  // folder.domElement.innerHTML = `<div class="widget"><button><div class="name" onclick="game.addAsync(import("./mods/western/load.js"))">play</div></button></div>`
}

{
  // speechSynthesis.speak(new SpeechSynthesisUtterance('cool'))
}

// Speech
{
  game.socket.on("chat message", (data) => {
    const {message} = data
    speechSynthesis.speak(new SpeechSynthesisUtterance(message))
  });
}

// Create World placeholders
{
  const {THREE} = game
  const sections = Array(5 * 5).fill(0)

  const WIDTH = 100
  
  const scene = new Object3D()
  scene.name = "worlds"
  game.add(scene)
  window.worlds = scene

  sections.forEach((section, index) => {
    const geometry = new THREE.BoxGeometry(WIDTH, 100, 100);
    const material = new THREE.MeshBasicMaterial({ visible: true, wireframe: true });
    const box = new THREE.Mesh(geometry, material);
    // container.add(box);
    box.position.x += index * WIDTH
    scene.add(box)
    return box
  })
}

// Load world
{
  // game.addAsync(import("./mods/western/load.js"))
}