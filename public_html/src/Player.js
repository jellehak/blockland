import { GLTFLoader, FBXLoader, THREE } from "./three.js";

export class Player {
  constructor(game = {}, options) {
    this.local = true;
    let model, colour;

    const colours = ["Black", "Brown", "White"];
    colour = colours[Math.floor(Math.random() * colours.length)];

    if (options === undefined) {
      const people = [
        "BeachBabe",
        "BusinessMan",
        "Doctor",
        "FireFighter",
        "Housewife",
        "Policeman",
        "Prostitute",
        "Punk",
        "RiotCop",
        "Roadworker",
        "Robber",
        "Sheriff",
        "Streetman",
        "Waitress",
      ];
      model = people[Math.floor(Math.random() * people.length)];
    } else if (typeof options == "object") {
      this.local = false;
      this.options = options;
      this.id = options.id;
      model = options.model;
      colour = options.colour;
    } else {
      model = options;
    }
    this.model = model;
    this.colour = colour;
    this.game = game;
    this.animations = this.game.animations;

    const container = new THREE.Object3D();
    container.name = "Player"
    this.object = container

    const loader = new FBXLoader();
    const player = this;

    loader.load(`${game.assetsPath}fbx/people/${model}.fbx`, function (object) {
      object.mixer = new THREE.AnimationMixer(object);
      player.root = object;
      player.mixer = object.mixer;

      object.name = "Person";

      object.traverse(function (child) {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

      const textureLoader = new THREE.TextureLoader();

      textureLoader.load(
        `${game.assetsPath}images/SimplePeople_${model}_${colour}.png`,
        function (texture) {
          object.traverse(function (child) {
            if (child.isMesh) {
              child.material.map = texture;
            }
          });
        }
      );
      
      // container.position.set(3122, 0, -173);
      // container.rotation.set(0, 2.6, 0);

      container.add(object);
      if (player.deleted === undefined) game.scene.add(container);

      if (player.local) {
        game.createCameras();
        game.sun.target = container;
        game.animations.Idle = object.animations[0];
        if (player.initSocket) player.initSocket();
      } else {
        const geometry = new THREE.BoxGeometry(100, 300, 100);
        const material = new THREE.MeshBasicMaterial({ visible: false });
        const box = new THREE.Mesh(geometry, material);
        box.name = "Collider";
        box.position.set(0, 150, 0);
        container.add(box);
        player.collider = box;
        container.userData.id = player.id;
        container.userData.remotePlayer = true;
        const players = game.initialisingPlayers.splice(
          game.initialisingPlayers.indexOf(this),
          1
        );
        game.remotePlayers.push(players[0]);
      }

      if (game.animations.Idle) player.action = "Idle";
    });
  }

  set action(name) {
    //Make a copy of the clip if this is a remote player
    if (this.actionName == name) return;

    if (!this.mixer) {
      console.warn("player not loaded yet");
    }

    const clip = this.local
      ? this.animations[name]
      : THREE.AnimationClip.parse(
          THREE.AnimationClip.toJSON(this.animations[name])
        );
    const action = this.mixer.clipAction(clip);
    action.time = 0;
    this.mixer.stopAllAction();
    this.actionName = name;
    this.actionTime = Date.now();

    action.fadeIn(0.5);
    action.play();
  }

  get action() {
    return this.actionName;
  }

  update(dt) {
    this.mixer.update(dt);

    if (this.game.remoteData.length > 0) {
      let found = false;
      for (let data of this.game.remoteData) {
        if (data.id != this.id) continue;
        //Found the player
        this.object.position.set(data.x, data.y, data.z);
        const euler = new THREE.Euler(data.pb, data.heading, data.pb);
        this.object.quaternion.setFromEuler(euler);
        this.action = data.action;
        found = true;
      }
      if (!found) this.game.removePlayer(this);
    }
  }
}

class FakeSocket {
  on(event = "", cb = () => {}) {}
  emit() {}
}

class InitMessage {
  constructor() {
    this.model = "";
    this.colour = "";
    this.x = 0;
    this.y = 0;
    this.z = 0;
    this.h = 0;
    this.pb = 0;
  }
}

export class PlayerLocal extends Player {
  constructor(game, model) {
    super(game, model);

    this.state = {
      RUN: 500,
      WALK: 150,
      TURN: 1,
    };

    const player = this;
    const socket = io.connect("http://localhost:2002");
    // const socket = new FakeSocket()

    socket.on("setId", (data) => {
      player.id = data.id;
    });
    socket.on("remoteData", (data) => {
      game.remoteData = data;
    });
    socket.on("deletePlayer", (data) => {
      const players = game.remotePlayers.filter(function (player) {
        if (player.id == data.id) {
          return player;
        }
      });
      if (players.length > 0) {
        let index = game.remotePlayers.indexOf(players[0]);
        if (index != -1) {
          game.remotePlayers.splice(index, 1);
          game.scene.remove(players[0].object);
        }
      } else {
        const index = game.initialisingPlayers.indexOf(data.id);
        if (index != -1) {
          const player = game.initialisingPlayers[index];
          player.deleted = true;
          game.initialisingPlayers.splice(index, 1);
        }
      }
    });

    // Chat
    const msgForm = document.getElementById("msg-form");
    const m = document.getElementById("m");
    msgForm.onsubmit = function (e) {
      socket.emit("chat message", {
        id: game.chatSocketId,
        message: m.value,
      });
      m.value = "";
      return false;
    };

    this.socket = socket;
  }

  step(dt) {
    const player = this;

    if (player.mixer) player.mixer.update(dt);

    if (player.action == "Walking") {
      const elapsedTime = Date.now() - player.actionTime;
      if (elapsedTime > 1000 && player.motion.forward > 0) {
        player.action = "Running";
      }
    }

    if (player.motion) player.move(dt);
  }

  initSocket() {
    //console.log("PlayerLocal.initSocket");
    const message = {
      model: this.model,
      colour: this.colour,
      x: this.object.position.x,
      y: this.object.position.y,
      z: this.object.position.z,
      h: this.object.rotation.y,
      pb: this.object.rotation.x,
    };
    this.welcome = message;
    this.socket.emit("init", message);
  }

  updateSocket() {
    if (!this.socket) {
      return;
    }

    // TODO Only update change?

    // console.log(`PlayerLocal.updateSocket - rotation(${this.object.rotation.x.toFixed(1)},${this.object.rotation.y.toFixed(1)},${this.object.rotation.z.toFixed(1)})`);
    this.socket.emit("update", {
      x: this.object.position.x,
      y: this.object.position.y,
      z: this.object.position.z,
      h: this.object.rotation.y,
      pb: this.object.rotation.x,
      action: this.action,
    });
  }

  move(dt) {
    const pos = this.object.position.clone();
    pos.y += 60;
    let dir = new THREE.Vector3();
    this.object.getWorldDirection(dir);
    if (this.motion.forward < 0) dir.negate();
    let raycaster = new THREE.Raycaster(pos, dir);
    let blocked = false;
    const colliders = this.game.colliders;

    if (colliders) {
      const intersect = raycaster.intersectObjects(colliders);
      if (intersect.length > 0) {
        if (intersect[0].distance < 50) blocked = true;
      }
    }

    if (!blocked) {
      if (this.motion.forward > 0) {
        const speed =
          this.action == "Running" ? this.state.RUN : this.state.WALK;
        this.object.translateZ(dt * speed);
      } else {
        this.object.translateZ(-dt * 30);
      }
    }

    if (colliders) {
      //cast left
      dir.set(-1, 0, 0);
      dir.applyMatrix4(this.object.matrix);
      dir.normalize();
      raycaster = new THREE.Raycaster(pos, dir);

      let intersect = raycaster.intersectObjects(colliders);
      if (intersect.length > 0) {
        if (intersect[0].distance < 50)
          this.object.translateX(100 - intersect[0].distance);
      }

      //cast right
      dir.set(1, 0, 0);
      dir.applyMatrix4(this.object.matrix);
      dir.normalize();
      raycaster = new THREE.Raycaster(pos, dir);

      intersect = raycaster.intersectObjects(colliders);
      if (intersect.length > 0) {
        if (intersect[0].distance < 50)
          this.object.translateX(intersect[0].distance - 100);
      }

      //cast down
      dir.set(0, -1, 0);
      pos.y += 200;
      raycaster = new THREE.Raycaster(pos, dir);
      const gravity = 30;

      intersect = raycaster.intersectObjects(colliders);
      if (intersect.length > 0) {
        const targetY = pos.y - intersect[0].distance;
        if (targetY > this.object.position.y) {
          //Going up
          this.object.position.y = 0.8 * this.object.position.y + 0.2 * targetY;
          this.velocityY = 0;
        } else if (targetY < this.object.position.y) {
          //Falling
          if (this.velocityY == undefined) this.velocityY = 0;
          this.velocityY += dt * gravity;
          this.object.position.y -= this.velocityY;
          if (this.object.position.y < targetY) {
            this.velocityY = 0;
            this.object.position.y = targetY;
          }
        }
      }
    }

    this.object.rotateY(this.state.TURN * this.motion.turn * dt);

    this.updateSocket();
  }
}
