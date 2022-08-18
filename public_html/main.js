import { Game, Keyboard } from "./game.js";

const game = new Game();
window.game = game;
console.log("Feel free to interact with `game`");

// MOD skybox
{
  import("./mods/skybox/load.js").then((ns) => ns.default(game));
}

// OrbitControl https://threejs.org/docs/#examples/en/controls/OrbitControls
// import { OrbitControls } from 'https://unpkg.com/three@0.110.0/examples/jsm/controls/OrbitControls.js'
// {

//   const {camera, renderer} = game
//   const controls = new OrbitControls( camera, renderer.domElement );

//   function animate() {

//     requestAnimationFrame( animate );

//     // required if controls.enableDamping or controls.autoRotate are set to true
//     controls.update();

//     // renderer.render( scene, camera );
//   }
//   animate()
// }

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
  // game.loadEnvironment();
  // game.loadNextAnim();
  game.stats();
  game.play()
}
