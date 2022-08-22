// Basic scene viewer
// https://lil-gui.georgealways.com/
export {};

{
  const { gui } = window;

  const sceneRootFolder = gui.addFolder(`Scene`).open(false);
  const methods = {
    refresh() {
      scan(game.scene, sceneFolder);
    },
  };
  sceneRootFolder.add(methods, "refresh");
  const sceneFolder = sceneRootFolder.addFolder(`children`).open(true);

  // Init
  methods.refresh();

  // Scene
  function scan(parent = {}, sceneFolder) {
    // Clear
    sceneFolder.children.map((child) => child.destroy());
    sceneFolder.folders.map((child) => child.destroy());

    // Append
    parent.children.map((node) => {
      const nodeFolder = sceneFolder
        .addFolder(node.name || node.type || node.id)
        .open(false);

      const methods = {
        select() {
          console.log('Exposed as "current"', node);
          window.current = node;

          game.select(node);
        },
        children() {
          scan(node, nodeFolder);
        },
        remove() {
          parent.remove(node);
          scan(node, nodeFolder);
        },
        export() {
          // TODO
        },
      };

      {
        nodeFolder.add(methods, "select");
        nodeFolder.add(methods, "remove");
      }

      nodeFolder.add(node, "type");
      nodeFolder.add(node, "visible");
      nodeFolder.add(node, "castShadow");
      nodeFolder.add(node, "receiveShadow");
      if (node.material) {
        {
          const folder = nodeFolder.addFolder("Material");
          folder.add(node.material, "type");
          if(node.material.wireframe) {
            folder.add(node.material, "wireframe");
          }
        }
      }

      {
        const folder = nodeFolder.addFolder("Position");
        folder.add(node.position, "x");
        folder.add(node.position, "y");
        folder.add(node.position, "z");
      }
      {
        const folder = nodeFolder.addFolder("Scale");
        folder.add(node.scale, "x");
        folder.add(node.scale, "y");
        folder.add(node.scale, "z");
      }
      {
        const folder = nodeFolder.addFolder("Rotation");
        folder.add(node.rotation, "_x");
        folder.add(node.rotation, "_y");
        folder.add(node.rotation, "_z");
      }
      if (node.children) {
        const childFolder = nodeFolder
          .addFolder(`Children (${node.children.length})`)
          .open(false);
        childFolder.domElement.addEventListener("click", function () {
          if (childFolder._closed === false) {
            scan(node.children, childFolder);
          }
        });
      }
    });

    // Sync values
    setInterval(() => {
      // sceneFolder.updateDisplay()
    }, 500);
  }
}
