



# Usage
```js
import { Game } from "./game.js";

const game = new Game();
window.game = game;
console.log("Feel free to interact with `game`");

// Add to scene
game.add()
game.undo()

// # Camera
game.cameras
// Change camera
game.activeCamera = game.cameras.active
game.activeCamera = game.cameras.back
game.activeCamera = game.cameras.chat
game.activeCamera = game.cameras.collect
game.activeCamera = game.cameras.front
game.activeCamera = game.cameras.overhead
game.activeCamera = game.cameras.wide

// # Walk player
game.playerControl(0.4,0)
// Stop
game.playerControl(0.0,0)

// # Local player
game.player.state
// Change walk speed
game.player.state.RUN = 1000
game.player.state.TURN = 2

// World
await game.loadEnvironment()

// Player
await game.loadNextAnim()

// Add object
await game.load("https://tracks-earth.github.io/airplanes/models/paraglider.glb")

// Mods
import("./mods/skybox/load.js").then(ns=>ns.default(game))
import("./mods/sand/load.js").then(ns=>ns.default(game))

// Add NPC


```


# Links 
https://github.com/gabrielcmoraru/blockland