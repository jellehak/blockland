import { Game, Keyboard } from "./game.js";

const game = new Game();
window.game = game;
console.log("Feel free to interact with `game`");

// MOD: Keyboard input
{
  const keyboard = new Keyboard();
  // Expose
  window.keyboard = keyboard;
  function update() {
    // console.log(k.keysPressed);
    if (keyboard.keysPressed["w"]) {
      game.playerControl(0.4, 0);
    }
    if (keyboard.keysPressed["s"]) {
      game.playerControl(-0.1, 0);
    }
    if (keyboard.keysPressed["a"]) {
      game.playerControl(0.0, -0.1);
    }
    if (keyboard.keysPressed["d"]) {
      game.playerControl(0.0, 0.1);
    }
    requestAnimationFrame(update);
  }
  update();
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
