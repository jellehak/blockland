export class Storage {
  constructor(game) {
    this.KEY = "stack"
    this.game = game
  }

  persist() {
    // localStorage.setItem("graph", JSON.stringify(this.entities));
    localStorage.setItem(this.KEY, JSON.stringify(this.game.stackWithMatrix));
  }

  async restore(verbose = true) {
    const { game } = this

    const stackRaw = localStorage.getItem(this.KEY);

    const stack = JSON.parse(stackRaw);

    const promises = stack.map((entity) => {
      if (verbose) {
        console.log("Running", entity);
      }
      return game[entity.method](...entity.args).then((obj) => {
        // Apply transform
        obj.position.set(
          entity.position.x,
          entity.position.y,
          entity.position.z
        );
        // obj.rotation.set(...entity.rotation)
        obj.scale.set(entity.scale.x, entity.scale.y, entity.scale.z);
        obj.userData = entity.userData || {};
      });
    });
    return Promise.all(promises);
  }
}
