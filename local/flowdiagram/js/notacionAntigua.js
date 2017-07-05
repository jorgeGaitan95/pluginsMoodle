require(['local_flowdiagram/go','jquery','core/ajax'], function (go,jquery,ajax){
  var modelData=[];
  var $ = go.GraphObject.make;
  myDiagram =$(go.Diagram, "myDiagramDiv",  // must name or refer to the DIV HTML element
    {
      initialContentAlignment: go.Spot.Center,
      allowDrop: true,  // must be true to accept drops from the Palette
      "LinkDrawn": showLinkLabel,  // this DiagramEvent listener is defined below
      "LinkRelinked": showLinkLabel,
      "animationManager.duration": 800, // slightly longer than default (600ms) animation
      "undoManager.isEnabled": true  // enable undo & redo
    });


// helper para brindar un estilo generico a cada uno de los nodos del diagrama
function nodeStyle() {
  return [
    new go.Binding("location", "loc", go.Point.parse).makeTwoWay(go.Point.stringify),
    {
      // the Node.location is at the center of each node
      locationSpot: go.Spot.Center,
      //isShadowed: true,
      //shadowColor: "#888",
      // handle mouse enter/leave events to show/hide the ports
      mouseEnter: function (e, obj) { showPorts(obj.part, true); },
      mouseLeave: function (e, obj) { showPorts(obj.part, false); }
    }
  ];
}
// Define a function for creating a "port" that is normally transparent.
// The "name" is used as the GraphObject.portId, the "spot" is used to control how links connect
// and where the port is positioned on the node, and the boolean "output" and "input" arguments
// control whether the user can draw links from or to the port.
function makePort(name, spot, output, input) {
  // the port is basically just a small circle that has a white stroke when it is made visible
  return $(go.Shape, "Circle",
           {
              fill: "transparent",
              stroke: null,  // this is changed to "white" in the showPorts function
              desiredSize: new go.Size(8, 8),
              alignment: spot, alignmentFocus: spot,  // align the port on the main Shape
              portId: name,  // declare this object to be a "port"
              fromSpot: spot, toSpot: spot,  // declare where links may connect at this port
              fromLinkable: output, toLinkable: input,  // declare whether the user may draw links to/from here
              cursor: "pointer"  // show a different cursor to indicate potential link point
           });
}
// define the Node templates for regular nodes
var lightText = "whitesmoke";
initNodeActivity();
initNodeDescision();
initNodeStart();
initNodeEnd();
initNodeCommment();
initLinkTemplate();
//addListenerModelChangedListener();
addListenerModifiedDiagram();
addListenerObjectSingleClickedToDiagram();

// temporary links used by LinkingTool and RelinkingTool are also orthogonal:
myDiagram.toolManager.linkingTool.temporaryLink.routing = go.Link.Orthogonal;
myDiagram.toolManager.relinkingTool.temporaryLink.routing = go.Link.Orthogonal;

initDiagramModel();


function initNodeActivity(){
  myDiagram.nodeTemplateMap.add("",  // the default category
    $(go.Node, "Spot", nodeStyle(),
      // the main object is a Panel that surrounds a TextBlock with a rectangular Shape
      $(go.Panel, "Auto",
        $(go.Shape, "Rectangle",
          { fill: "#fff", stroke: "gray" },
          new go.Binding("figure", "figure")),
        $(go.TextBlock,
          {
            font: "10pt Helvetica, Arial, sans-serif",
            stroke: "black",
            margin: 8,
            maxSize: new go.Size(220, NaN),
            wrap: go.TextBlock.WrapFit,
            editable: true
          },
          new go.Binding("text").makeTwoWay())
      ),
      // four named ports, one on each side:
      makePort("T", go.Spot.Top, false, true),
      makePort("L", go.Spot.Left, true, true),
      makePort("R", go.Spot.Right, true, true),
      makePort("B", go.Spot.Bottom, true, false)
    ));
}
function initNodeDescision(){
  myDiagram.nodeTemplateMap.add("Decision",  // the default category
    $(go.Node, "Spot", nodeStyle(),
      // the main object is a Panel that surrounds a TextBlock with a rectangular Shape
      $(go.Panel, "Auto",
        $(go.Shape, "Diamond",
          { fill: "#fff", stroke: "gray" }),
        $(go.TextBlock,
          {
            font: "10pt Helvetica, Arial, sans-serif",
            stroke: "black",
            margin: 2,
            textAlign: "center",
            maxSize: new go.Size(220, NaN),
            wrap: go.TextBlock.WrapFit,
            editable: true
          },
          new go.Binding("text").makeTwoWay())
      ),
      // four named ports, one on each side:
      makePort("T", go.Spot.Top, false, true),
      makePort("L", go.Spot.Left, true, true),
      makePort("R", go.Spot.Right, true, true),
      makePort("B", go.Spot.Bottom, true, false)
    ));
}
function initNodeStart(){
  myDiagram.nodeTemplateMap.add("Start",
    $(go.Node, "Spot", nodeStyle(),
      $(go.Panel, "Auto",
        $(go.Shape, "Circle",
          { minSize: new go.Size(40, 40), fill: "#79C900", stroke: null }),
        $(go.TextBlock, "Start",
          { font: "bold 11pt Helvetica, Arial, sans-serif", stroke: lightText },
          new go.Binding("text"))
      ),
      // three named ports, one on each side except the top, all output only:
      makePort("L", go.Spot.Left, true, false),
      makePort("R", go.Spot.Right, true, false),
      makePort("B", go.Spot.Bottom, true, false)
  ));
}
function initNodeEnd(){
  myDiagram.nodeTemplateMap.add("End",
    $(go.Node, "Spot", nodeStyle(),
      $(go.Panel, "Auto",
        $(go.Shape, "Circle",
          { minSize: new go.Size(40, 40), fill: "#DC3C00", stroke: null }),
        $(go.TextBlock, "End",
          { font: "bold 11pt Helvetica, Arial, sans-serif", stroke: lightText },
          new go.Binding("text"))
      ),
      // three named ports, one on each side except the bottom, all input only:
      makePort("T", go.Spot.Top, false, true),
      makePort("L", go.Spot.Left, false, true),
      makePort("R", go.Spot.Right, false, true)
    )
  );
}
function initNodeCommment(){
  myDiagram.nodeTemplateMap.add("Comment",
    $(go.Node, "Auto", nodeStyle(),
      $(go.Shape, "File",
        { fill: "#EFFAB4", stroke: null }),
      $(go.TextBlock,
        {
          margin: 5,
          maxSize: new go.Size(200, NaN),
          wrap: go.TextBlock.WrapFit,
          textAlign: "center",
          editable: true,
          font: "12pt Helvetica, Arial, sans-serif",
          stroke: "#454545"
        },
        new go.Binding("text").makeTwoWay())
      // no ports, because no links are allowed to connect with a comment
    ));
}
function initLinkTemplate(){
  // replace the default Link template in the linkTemplateMap
  myDiagram.linkTemplate =
  $(go.Link,  // the whole link panel
    {
      routing: go.Link.AvoidsNodes,
      curve: go.Link.JumpOver,
      corner: 5, toShortLength: 4,
      relinkableFrom: true,
      relinkableTo: true,
      reshapable: true,
      resegmentable: true,
      // mouse-overs subtly highlight links:
      mouseEnter: function(e, link) { link.findObject("HIGHLIGHT").stroke = "rgba(30,144,255,0.2)"; },
      mouseLeave: function(e, link) { link.findObject("HIGHLIGHT").stroke = "transparent"; }
    },
    new go.Binding("points").makeTwoWay(),
    $(go.Shape,  // the highlight shape, normally transparent
      { isPanelMain: true, strokeWidth: 8, stroke: "transparent", name: "HIGHLIGHT" }),
      $(go.Shape,  // the link path shape
        { isPanelMain: true, stroke: "gray", strokeWidth: 2 }),
        $(go.Shape,  // the arrowhead
          { toArrow: "standard", stroke: null, fill: "gray"}),
          $(go.Panel, "Auto",  // the link label, normally not visible
          { visible: false, name: "LABEL", segmentIndex: 2, segmentFraction: 0.5},
          new go.Binding("visible", "visible").makeTwoWay(),
          $(go.Shape, "RoundedRectangle",  // the label shape
          { fill: "#F8F8F8", stroke: null }),
          $(go.TextBlock, "Yes",  // the label
          {
            textAlign: "center",
            font: "10pt helvetica, arial, sans-serif",
            stroke: "#333333",
            editable: true
          },
          new go.Binding("text").makeTwoWay())
        )
      );
}

function addListenerModelChangedListener(){
  myDiagram.addModelChangedListener(function(evt){
  console.log(evt);
  })
}
function addListenerModifiedDiagram(){
  // when the document is modified, add a "*" to the title and enable the "Save" button
  myDiagram.addDiagramListener("Modified", function(e) {
    var button = document.getElementById("SaveButton");
    if (button) button.disabled = !myDiagram.isModified;
    var idx = document.title.indexOf("*");
    if (myDiagram.isModified) {
      if (idx < 0) document.title += "*";
    } else {
      if (idx >= 0) document.title = document.title.substr(0, idx);
    }
  });
}
function addListenerObjectSingleClickedToDiagram(){
  //Detecta cuando un nodo es seleccionado
  myDiagram.addDiagramListener("ObjectSingleClicked",
      function(e) {
        var part = e.subject.part;
        if (!(part instanceof go.Link)){
          var nombre= part.data.text;
          document.getElementById("input-nombre").value=nombre;
          if(nombre.includes("[Formación]")){
            getTemplatesForActivityType("Formacion");
          } else if(nombre.includes("[Conferencia]")){
            getTemplatesForActivityType("Formacion");
          } else if(nombre.includes("[Tarea]")){
            getTemplatesForActivityType("Tarea");
          } else if(nombre.includes("[Retroalimentación]")){
            getTemplatesForActivityType("Formacion");
          } else if(nombre.includes("[Evaluación Escrita]")){
            getTemplatesForActivityType("Evaluacion");
          } else if(nombre.includes("[Retroalimentación]")){
            getTemplatesForActivityType("Formacion");
          }
          document.getElementById("input-descripcion").value=part.data.descripcion;
        }
  });
}

function getTemplatesForActivityType(activityType){
  var promises = ajax.call([
         { methodname: 'local_estrategia_didactica_get_templates_for_type', args: { tipoActividad: activityType } }
  ]);
  promises[0].done(function(response) {
      renderTemplates(response);
      activateChangeEventFormInput();
  }).fail(function(ex) {
      console.log(ex);
  });
}

function renderTemplates(plantillas){
  contenedorPlantillas = document.getElementById("container-form");
  contenedorPlantillas.innerHTML="";

  for(var i=0;i<plantillas.length;i++){
    var imageContainer = document.createElement('div');
    imageContainer.className = 'image-container';

    var image = document.createElement('img');
    image.src=plantillas[i].imageurl;

    var input = document.createElement('input');
    input.type = "radio";
    input.value = plantillas[i].id;
    input.name = "input-variabilidad";

    var br = document.createElement('br');

    imageContainer.appendChild(image);
    input.appendChild(br);
    imageContainer.appendChild(input);
    contenedorPlantillas.appendChild(imageContainer);
  }
}

function initNodeData(){
  var nodedata = [
    {"key":-1, "category":"Start", "loc":"159 0", "text":"Inicio"},
    {"key":1, "educational_strategy_id":1, "loc":"158.5 81", "text":"[Formación] Conceptos generales de bases de datos", "description":"actividad1","activitytype":"Formacion","fecha_inicio":0,"fecha_fin":0,"prev_activityid":0,"next_activityid":0},
    {"key":2, "educational_strategy_id":1, "loc":"158.5 161", "text":"[Conferencia] Importancia de las bases de datos -Profesor invitado","description":"actividad2","activitytype":"Conferencia","fecha_inicio":0,"fecha_fin":0,"prev_activityid":0,"next_activityid":0},
    {"key":3, "educational_strategy_id":1, "loc":"158.5 236", "text":"[Tarea] Resolver taller","description":"actividad3","activitytype":"Tarea","fecha_inicio":0,"fecha_fin":0,"prev_activityid":0,"next_activityid":0},
    {"key":4, "educational_strategy_id":1, "loc":"158.5 305", "text":"[Retroalimentación] Sugerencias generales de la tarea","description":"actividad4","activitytype":"Retroalimentación","fecha_inicio":0,"fecha_fin":0,"prev_activityid":0,"next_activityid":0},
    {"key":6, "educational_strategy_id":1, "loc":"158.5 371", "text":"[Evaluación Escrita] Responder quiz","description":"actividad5","activitytype":"Evaluación Escrita","fecha_inicio":0,"fecha_fin":0,"prev_activityid":0,"next_activityid":0},
    {"key":-3, "category":"Decision", "loc":"158.5 450", "text":"Puntuación\n>=3"},
    {"key":7, "educational_strategy_id":1, "loc":"158.5 552", "text":"[Retroalimentación] Sugerencias generales del quiz","description":"actividad6","activitytype":"Formación","fecha_inicio":0,"fecha_fin":0,"prev_activityid":0,"next_activityid":0},
    {"key":-2, "category":"End", "loc":"158 622", "text":"Fin"},
  ]
  return nodedata;
}
function initLinkData(){
  var linkdata = [
    {"from":-1, "to":1, "fromPort":"B", "toPort":"T"},
    {"from":1, "to":2, "fromPort":"B", "toPort":"T"},
    {"from":2, "to":3, "fromPort":"B", "toPort":"T"},
    {"from":3, "to":4, "fromPort":"B", "toPort":"T"},
    {"from":4, "to":6, "fromPort":"B", "toPort":"T"},
    {"from":6, "to":-3, "fromPort":"B", "toPort":"T"},
    {"from":-3, "to":6, "fromPort":"L", "toPort":"L", "visible":true,"text":"No"},
    {"from":-3, "to":7, "fromPort":"B", "toPort":"T", "visible":true, "text":"Si"},
    {"from":7, "to":-2, "fromPort":"B", "toPort":"T"}
  ]
  return linkdata;
}
function initDiagramModel(){
  myDiagram.model = $(go.GraphLinksModel,
    {
      copiesArrays: true,
      copiesArrayObjects: true,
      "linkFromPortIdProperty": "fromPort",
      "linkToPortIdProperty": "toPort",
      nodeDataArray: initNodeData(),
      linkDataArray: initLinkData()
    });

    for (var i = 0; i < myDiagram.model.nodeDataArray.length; i++) {
      var currentNodeData=myDiagram.model.nodeDataArray[i];
      modelData[currentNodeData.key]=jquery.extend({},currentNodeData);
    }
}

// initialize the Palette that is on the left side of the page
myPalette =
  $(go.Palette, "myPaletteDiv",  // must name or refer to the DIV HTML element
    {
      "animationManager.duration": 800, // slightly longer than default (600ms) animation
      nodeTemplateMap: myDiagram.nodeTemplateMap,  // share the templates used by myDiagram
      model: new go.GraphLinksModel([  // specify the contents of the Palette
        { category: "Start", text: "Inicio" },
        { text: "Activity" },
        { category: "Decision", text: "???" },
        { category: "End", text: "Fin" },
        { category: "Comment", text: "Comment" }
      ])
  });

// Make link labels visible if coming out of a "conditional" node.
// This listener is called by the "LinkDrawn" and "LinkRelinked" DiagramEvents.
function showLinkLabel(e) {
  var label = e.subject.findObject("LABEL");
  if (label !== null) label.visible = (e.subject.fromNode.data.category === "Decision");
}

// The following code overrides GoJS focus to stop the browser from scrolling
// the page when either the Diagram or Palette are clicked or dragged onto.
function customFocus() {
  var x = window.scrollX || window.pageXOffset;
  var y = window.scrollY || window.pageYOffset;
  go.Diagram.prototype.doFocus.call(this);
  window.scrollTo(x, y);
}

myDiagram.doFocus = customFocus;
myPalette.doFocus = customFocus;
// Make all ports on a node visible when the mouse is over the node
function showPorts(node, show) {
var diagram = node.diagram;
if (!diagram || diagram.isReadOnly || !diagram.allowLink) return;
node.ports.each(function(port) {
    port.stroke = (show ? "white" : null);
  });
}
activateChangeEventFormInput();
function activateChangeEventFormInput(){
  jquery('#form-variabilidades input').on('change',function(){
    getComponentsFromTemplateId(jquery('input[name=input-variabilidad]:checked','#form-variabilidades').val());
  });
}

function getComponentsFromTemplateId(idVariabilidad){
  var promises = ajax.call([
         { methodname: 'local_estrategia_didactica_getcomponents_template', args: { idtemplate: idVariabilidad } }
  ]);
  promises[0].done(function(response) {
      renderRecursos(response);
  }).fail(function(ex) {
      console.log(ex);
  });
}

function renderRecursos(data){
  var divComponentesToTemplate=jquery('#componentesToTemplate');
  divComponentesToTemplate.html("");
  for(var i=0;i<data.length;i++){
    var labelName= getLabelNameOfComponent(data[i].id);
    divComponentesToTemplate.append(getComponentRender(labelName));
    if(data[i].id===1){
      divComponentesToTemplate.append(getComponentRender("Metadatos"));
    }
  }
}

function getLabelNameOfComponent(idComponent){
  switch (idComponent) {
    case 1:
      return "Video";
    case 2:
      return "Presentacion";
    case 6:
      return "Recursos";
    case 4:
      return "Tarea";
    case 9:
      return "Quiz";
    default:
      return "";

  }
}

function getComponentRender(labelName){
 var html="<div class=''><label class='label-input' for=''>"+labelName+"</label>"
 html +="<input class='input-inspector' type='text' name='name' value=''>"
 html +="</div>"
 return html;
}

jquery("#saveButton").click(function(){
  determinarCambiosModelo();
});

function determinarCambiosModelo(){
 console.log(modelData);
 var datamodelArray=myDiagram.model.nodeDataArray;
 console.log(datamodelArray);
 var logData = [];
 for (var i = 0; i < datamodelArray.length; i++) {
   nodeDataInModelJson=modelData[datamodelArray[i].key];
   if(nodeDataInModelJson){
     if(! (JSON.stringify(datamodelArray[i]) === JSON.stringify(modelData[datamodelArray[i].key]))){
       var logItem={
         "event":"update",
         "activityid": datamodelArray[i].key,
         "activity": datamodelArray[i]
       }
       logData.push(logItem);
     }
     nodeDataInModelJson.comparado = true;
   }else{
     var logItem={
       "event":"add",
       "activityid": datamodelArray[i].key,
     }
    logData.push(logItem);
   }
 }
 console.log("modelData");
 for (var x in modelData) {
   if(modelData[x].key>0){
     if(modelData[x].comparado != true)
     {
       var logItem={
         "event":"delete",
         "activityid": modelData[x].key
       }
       logData.push(logItem);
     }
   }
 }
 console.log(logData);
}

function saveActivities(){
  var activities = initNodeData();
  for (var i = 0; i < activities.length; i++) {
    var currentActivity = activities[i];
    delete currentActivity.key;
    if(currentActivity.category==="Start"||currentActivity.category==="Decision"||currentActivity.category==="End"||currentActivity.category==="Comment")
    {
      activities.splice(i, 1);
      i--;
    }
  }
// Now we can continue...
ajax.call([{
    methodname: 'local_estrategia_didactica_save_activities',
    args: {activities},
    done: function(result){console.log(result);},
    fail: function(error){console.log(error);}
}]);
}



});
