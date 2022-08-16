import { Game, Keyboard } from "./game.js";

const game = new Game();
window.game = game;
console.log("Feel free to interact with `game`");

// MOD: Keyboard input
{
  const keyboard = new Keyboard();
  
  const input = {
    keyboard,
    state: {
        FORWARD: 0.8,
        TURN: 0.4 
    },
    dispose() {}
  }
  // Expose
  window.input = input

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

    // if(keyboard.keysPressed) { console.log(keyboard.keysPressed) }
    // console.log(keyboard.keysPressed)

    game.playerControl(forward, turn);

    requestAnimationFrame(update);
  }
  setTimeout(() => {
      update();
  }, 3000)
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
