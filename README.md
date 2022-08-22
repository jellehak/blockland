



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

// Disable follow cam
game.cameras.active = null

// #########
// # Walk player
game.playerControl(0.4,0)
// Stop
game.playerControl(0.0,0)

// # Local player
game.player.state
// Change walk speed
game.player.state.RUN = 1000
game.player.state.TURN = 2

game.player.root.scale.setScalar(0.1)


// Add object
await game.load("https://tracks-earth.github.io/airplanes/models/707.glb")

// # Mods
import("./mods/skybox/load.js").then(ns=>ns.default(game))
import("./mods/desert/load.js").then(ns=>ns.default(game))
game.addAsync(import("./mods/desert/load.js"))
await game.load("mods/models/Soldier.glb")

// Add NPC


```


# Links 
https://github.com/gabrielcmoraru/blockland