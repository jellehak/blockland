export class Network {
  constructor(_socket = null) {
    this.server = "http://localhost:2002";
    this.status = "connecting";
    this.id = "";

    this.socket = _socket || io.connect(this.server);

    const { socket } = this
    // const socket = new FakeSocket()

    // socket.onAny(event, message => {
    //   console.log(event, message)
    // })

    socket.on("setId", (data) => {
      this.id = data.id;
    });
    socket.on("remoteData", (data) => {
      // game.remoteData = data;
    });
    socket.on("deletePlayer", (data) => {
      // TODO
    });

    socket.on("chat message", (data) => {
      // TODO
    });

    this.socket = socket;
  }

  updateRemotePlayers(dt) {
    const {game} = this

    if (
      !game.remoteData ||
      game.remoteData.length == 0 ||
      !game.player ||
      !game.player.id
    ) {
      return;
    }

    const newPlayers = [];
    //Get all remotePlayers from remoteData array
    const remotePlayers = [];
    const remoteColliders = [];

    game.remoteData.forEach(function (data) {
      if (game.player.id != data.id) {
        //Is this player being initialised?
        let iplayer;
        game.initialisingPlayers.forEach(function (player) {
          if (player.id == data.id) iplayer = player;
        });
        //If not being initialised check the remotePlayers array
        if (!iplayer) {
          let rplayer;
          game.remotePlayers.forEach(function (player) {
            if (player.id == data.id) rplayer = player;
          });
          if (!rplayer) {
            //Initialise player
            game.initialisingPlayers.push(new Player(game, data));
          } else {
            //Player exists
            remotePlayers.push(rplayer);
            remoteColliders.push(rplayer.collider);
          }
        }
      }
    });

    game.scene.children.forEach(function (object) {
      if (
        object.userData.remotePlayer &&
        game.getRemotePlayerById(object.userData.id) == undefined
      ) {
        game.scene.remove(object);
      }
    });

    game.remotePlayers = remotePlayers;
    game.remoteColliders = remoteColliders;
    game.remotePlayers.forEach(function (player) {
      player.update(dt);
    });
  }
}
