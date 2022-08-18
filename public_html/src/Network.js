export class Network {
  constructor() {
    const socket = io.connect("http://localhost:2002");
    // const socket = new FakeSocket()

    socket.onAny(event, message => {
      console.log(event, message)
    })

    this.socket = socket
  }

    updateRemotePlayers(dt) {
        if (
          this.remoteData === undefined ||
          this.remoteData.length == 0 ||
          this.player === undefined ||
          this.player.id === undefined
        )
          return;
    
        const newPlayers = [];
        const game = this;
        //Get all remotePlayers from remoteData array
        const remotePlayers = [];
        const remoteColliders = [];
    
        this.remoteData.forEach(function (data) {
          if (game.player.id != data.id) {
            //Is this player being initialised?
            let iplayer;
            game.initialisingPlayers.forEach(function (player) {
              if (player.id == data.id) iplayer = player;
            });
            //If not being initialised check the remotePlayers array
            if (iplayer === undefined) {
              let rplayer;
              game.remotePlayers.forEach(function (player) {
                if (player.id == data.id) rplayer = player;
              });
              if (rplayer === undefined) {
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
    
        this.scene.children.forEach(function (object) {
          if (
            object.userData.remotePlayer &&
            game.getRemotePlayerById(object.userData.id) == undefined
          ) {
            game.scene.remove(object);
          }
        });
    
        this.remotePlayers = remotePlayers;
        this.remoteColliders = remoteColliders;
        this.remotePlayers.forEach(function (player) {
          player.update(dt);
        });
      }
}
