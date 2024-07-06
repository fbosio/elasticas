var listeners = {


  changeC: function (e) {
    elements.spans.loading.hidden = false;
    var textInput = e.target;
    var id = textInput.id;
    var symmetrical = elements.inputs.matrixC[id[2]][id[1]];
    symmetrical.value = textInput.value;
    subroutines.sendNumbers();
  },
    

  changeRho: function () {
    elements.spans.loading.hidden = false;
    subroutines.sendNumbers();
  },


  changeMaterial: function (e) {
    elements.spans.loading.hidden = false;
    var input = e.target;
    var name_material = input.value;
    if (name_material === "no-selection") {
      input.value = input.oldValue;
      return;
    }

    subroutines.postData({content: "material", material: name_material},
      function (json) {
        elements.inputs.matrixC.fill(json.C);
        elements.inputs.rho.value = json.rho;
        subroutines.sendNumbers();
      }
    );

    input.oldValue = input.value;
  },
    

  changeSymmetry: function (e) {
    elements.spans.loading.hidden = false;
    subroutines.postData({
      content: "symmetry",
      symmetry: e.target.selectedIndex,
      C: elements.inputs.matrixC.parsed()
    }, function (json) {
      elements.inputs.matrixC.fill(json.C);
      subroutines.sendNumbers();
    });
  },


  changeCoordinatePlane: function (e) {
    axesState["2d"].selected.plane = e.target.value;
    subroutines.updatePolarPlot();
  },


  changePolarAngle: function (e) {
    var input = e.target;
    var angle = subroutines.parsePolarAngle(input.value);

    if (isNaN(angle)) 
      angle = input.oldValue;

    input.value = angle;
    angleRadians = subroutines.normalizePolarAngleRadians(angle);

    axesState["2d"].selected.angle = angleRadians;
    
    subroutines.updatePolarPlot();
  },


  changeDependantVariable: function (e) {
    var variable = e.target.value;
    axesState["2d"].selected.variable = variable;
    subroutines.updatePolarPlot();
    subroutines.updateDependentVariableText();
  },


  mouse: {
    down: {
      polarPlot: function (e) {
        axesState["2d"].dragState.isRotating = true;
        listeners.mouse.move.polarPlot(e);
      },
    },
    move: {
      polarPlot: function (e) {
        var state = axesState["2d"].dragState;
        if (!state.isRotating) return;
        var rect = e.target.getBoundingClientRect();
        var width = e.target.width;
        var height = e.target.height;
        var x = e.clientX - rect.x - width/2;
        var y = e.clientY - rect.y - height/2;
        var selectedAngle = Math.PI + Math.atan2(y, -x);
        axesState["2d"].selected.angle = selectedAngle;
        elements.inputs.angle.value = (selectedAngle*180/Math.PI).toFixed(2);
        subroutines.updatePolarPlot();
      },
    },
    up: {
      polarPlot: function () {
        axesState["2d"].dragState.isRotating = false;
      },
    },
  },

  resizeWindow: function () {
    subroutines.fitCanvasToContainer();
    var plotData = subroutines.drawOffscreenCanvas(axesState["2d"]);
    axesState["2d"].radius = plotData.radius;
    axesState["2d"].numberGuideCircles = plotData.numberGuideCircles;
    subroutines.updatePolarPlot();
  },
    
};
