var elements = {
  inputs: {
    matrixC: [],
  },
  outputs: {
    matrixA: [],
  },
};


// Fill elements object with document object references
for (var i = 0; i < 6; i++) {
  var row = [];
  for (var j = 0; j < 6; j++) {
    var input = document.getElementById("C" + i + j);
    row.push(input);
  }
  elements.inputs.matrixC.push(row);
}

for (var i = 0; i < 3; i++) {
  var row = [];
  for (var j = 0; j < 3; j++) {
    var output = document.getElementById("A" + i + j);
    row.push(output);
  }
  elements.outputs.matrixA.push(row);
}

var elementIds = {
  "inputs": ["rho", "symmetry", "angle"],
  "selects": ["material"],
  "canvases": ["plot2d"],
  "radioButtons": [
    "XY-plane", "XZ-plane", "YZ-plane",
    "velocity", "slowness", "groupvelocity",
  ],
  "spans": ["loading"],
  "divs": ["plot2d-container"],
};
for (var elementType in elementIds) {
  var ids = elementIds[elementType];
  for (var i = 0; i < ids.length; i++) {
    var id = ids[i];
    if (!elements[elementType]) elements[elementType] = {};
    elements[elementType][id] = document.getElementById(id);
  }
}

elements.outputs.variable = document.querySelectorAll(".dep-var-output");


// Methods
elements.inputs.matrixC.fill = function (newMatrix) {
  for (var i = 0; i < elements.inputs.matrixC.length; i++) {
    var row = elements.inputs.matrixC[i];
    for (var j = 0; j < row.length; j++) {
      var element = row[j];
      var value = newMatrix[i][j];
      if (!value) continue;
      element.value = value;
    }
  }
};
elements.inputs.matrixC.parsed = function () {
  var C = [];
  for (var i = 0; i < elements.inputs.matrixC.length; i++) {
    var row = elements.inputs.matrixC[i];
    var parsedRow = [];
    for (var j = 0; j < row.length; j++) {
      var element = row[j];
      var value = subroutines.getFloatValue(element.value);
      parsedRow.push(value);
    }
    C.push(parsedRow);
  }
  return C;
};

elements.outputs.matrixA.fill = function (newMatrix) {
  for (var i = 0; i < elements.outputs.matrixA.length; i++) {
    var row = elements.outputs.matrixA[i];
    for (var j = 0; j < row.length; j++) {
      var element = row[j];
      var preBracket = (j === 0) ? "[" : "";
      var postBracket = (j === row.length-1) ? "]" : "";
      element.innerHTML = preBracket + "0" + postBracket;
      var value = newMatrix[i][j];
      if (!value) continue;
      element.innerHTML = preBracket + value + postBracket;
    }
  }
};


// Attributes
elements.selects.material.oldValue = elements.selects.material.value;
elements.inputs.angle.oldValue = elements.inputs.angle.value;
