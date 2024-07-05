// Plots
var colors = [];
for (var i = 0; i < elements.outputs.variable.length; i++) {
  colors.push(elements.outputs.variable[i].style.color);
}
subroutines.fitCanvasToContainer();
var axesState = {
  "2d": subroutines.initPolarPlot({
    fontSize: 14,
    numberAngleGuides: 8,
    colors: colors,
  }),
};

// Events
for (var i = 0; i < 6; i++) {
  for (var j = i; j < 6; j++) {
    var input = elements.inputs.matrixC[i][j];
    input.addEventListener("change", listeners.changeC, false);
  }
}
var elementTypeListenerData = [
  ["inputs",       "rho",           "changeRho"],
  ["inputs",       "symmetry",      "changeSymmetry"],
  ["inputs",       "angle",         "changePolarAngle"],
  ["selects",      "material",      "changeMaterial"],
  ["radioButtons", "XY-plane",      "changeCoordinatePlane"],
  ["radioButtons", "XZ-plane",      "changeCoordinatePlane"],
  ["radioButtons", "YZ-plane",      "changeCoordinatePlane"],
  ["radioButtons", "velocity",      "changeDependantVariable"],
  ["radioButtons", "slowness",      "changeDependantVariable"],
  ["radioButtons", "groupvelocity", "changeDependantVariable"],
];
for (var i = 0; i < elementTypeListenerData.length; i++) {
  var elementType = elementTypeListenerData[i][0];
  var elementName = elementTypeListenerData[i][1];
  var listenerName = elementTypeListenerData[i][2];
  var element = elements[elementType][elementName];
  element.addEventListener("change", listeners[listenerName], false);
}
var plotEventListeners = {
  events: ["down", "move", "up"],
  fields: ["polar"],
  canvas: ["plot2d"],
}
for (var i = 0; i < plotEventListeners.fields.length; i++) {
  var canvas = elements.canvases[plotEventListeners.canvas[i]];
  var fieldName = plotEventListeners.fields[i] + "Plot";
  for (var j = 0; j < plotEventListeners.events.length; j++) {
    var eventName = plotEventListeners.events[j];
    var listenerName = listeners.mouse[eventName][fieldName];
    canvas.addEventListener("mouse" + eventName, listenerName, false);
  }
}
window.addEventListener("resize", listeners.resizeWindow);

// Initialize
subroutines.sendNumbers();
subroutines.updateDependentVariableText();
