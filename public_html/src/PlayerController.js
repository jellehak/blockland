import { Keyboard } from "./game.js";
import { THREE } from "./three.js";

export class Character {
  constructor(object, game = null) {
    this.action = "";
    this.mixer = new THREE.AnimationMixer(object);
    this.object = object;
    this.motion = null;

    this.update();
  }

  update(dt) {
    this.mixer.update(dt);
    requestAnimationFrame(this.update.bind(this));
  }
}

export class PlayerController {
  constructor(game) {
    const keyboard = new Keyboard();

    const input = {
      keyboard,
      state: {
        FORWARD: 0.8,
        TURN: 0.4,
      },
      dispose() {},
    };

    this.player = null;
    this.input = input;
    this.keyboard = keyboard;
    this.update();
  }

  update() {
    const { keyboard, input } = this;

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

    this.move(forward, turn);

    requestAnimationFrame(this.update.bind(this));
  }

  move(forward = 0, turn = 0) {
    const { player } = this;
    if (!player) {
      return;
    }

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

    // if (player.updateSocket) {
    //   player.updateSocket();
    // }
  }

  attach(entity) {
    console.log("TODO", entity);
    const character = new Character(entity.scene);

    this.player = character;
  }
}
