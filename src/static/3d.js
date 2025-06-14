var plotData3d = {};

var canvas = document.getElementById("renderCanvas");
var engine = new BABYLON.Engine(canvas, true);

var createScene = function () {
    var scene = new BABYLON.Scene(engine);
    scene.clearColor = new BABYLON.Color3.White()

    var camera = new BABYLON.ArcRotateCamera("camera", 2 * Math.PI / 3, Math.PI / 3, 30, BABYLON.Vector3.Zero(),
        scene)
    camera.attachControl(canvas, true);

    new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0.5, 0.6, 0), scene);

    var meshData = [];
    var materialData = [{
        "color": "#AA0000",
        "alpha": 1.0
    },
    {
        "color": "#005000",
        "alpha": 0.4
    },
    {
        "color": "#0000FF",
        "alpha": 0.2
    }
    ];
    for (i = 0; i < materialData.length; i++) {
        var materialColor = materialData[i].color
        var standardMaterial = new BABYLON.StandardMaterial(materialColor, scene);

        standardMaterial.diffuseColor = new BABYLON.Color3.FromHexString(materialColor);
        standardMaterial.alpha = materialData[i].alpha;
        standardMaterial.backFaceCulling = false;

        var mesh = new BABYLON.Mesh("mesh" + i, scene);
        mesh.material = standardMaterial;
        mesh.markVerticesDataAsUpdatable(BABYLON.VertexBuffer.PositionKind, true);

        meshData.push(mesh);
    }

    var materialSelectElement = document.getElementById("material");
    materialSelectElement.addEventListener("change", function (event) {
        var target = event.target;
        var nameMaterial = target.value;

        if (nameMaterial === "no-selection") {
            target.value = target.oldValue;
            return;
        }

        var data = {
            material: nameMaterial
        };

        var xhr = new XMLHttpRequest();
        xhr.addEventListener("load", function (e) {
            var json = JSON.parse(e.target.responseText);
            plotData3d = json.plotData3d;

            var faces = plotData3d.faces;
            var vertices = plotData3d.velocity.vertices;

            for (i = 0; i < meshData.length; i++) {
                var vertexData = new BABYLON.VertexData();

                vertexData.positions = vertices[i];
                vertexData.indices = faces;

                vertexData.applyToMesh(meshData[i], true);
            }
        });
        xhr.open("POST", "");
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.send(JSON.stringify(data));

        target.oldValue = target.value;
    });

    return scene;
}

var scene = createScene();
engine.runRenderLoop(function () {
    scene.render();
});
window.addEventListener("resize", function () {
    engine.resize();
});