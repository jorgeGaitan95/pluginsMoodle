require(['local_flowdiagram/go','jquery','core/ajax'], function (go,jquery,ajax){
  var modelData=[];
  var $ = go.GraphObject.make;
  var tiposInteraccion={
    facetoface:"img/diagramIcons/F.svg",
    blended:"img/diagramIcons/B.svg",
    web:"img/diagramIcons/W.svg"
  };
  var tiposActores={
    strudent:"img/diagramIcons/Individual AUX.svg",
    groups:"img/diagramIcons/Grupo.svg",
    class:"img/diagramIcons/CursoF.svg"
  };
  var tipoActividad={
    asimilativa:"asimilativas",
    gestion_informacion:"gestion_informacion",
    aplicacion:"aplicacion",
    comunicativas:"comunicativas",
    evaluativas:"evaluativas",
    productivas:"productivas",
    experienciales:"experienciales"
  };
  var subtiposActividad={
    asimilativa:["Formacion","Lectura","Observacion"],
    gestion_informacion:["Analisis","Busqueda"],
    aplicacion:["Entrenamiento"],
    comunicativas:["Asesoria","Asistencia","Discusion","Exposicion","Acuerdo","Conferencia"],
    evaluativas:["Escrita","Oral","Retroalimentacion"],
    productivas:"",
    experienciales:""
  };
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
    initNodeSplit();
    initNodeMerge();
    initNodeNotificacion();
    initNodeEspera();
    initNodeSincronizacion();
    initLinkTemplate();
    //addListenerModelChangedListener();
    addListenerModifiedDiagram();
    addListenerObjectSingleClickedToDiagram();
    // temporary links used by LinkingTool and RelinkingTool are also orthogonal:
    myDiagram.toolManager.linkingTool.temporaryLink.routing = go.Link.Orthogonal;
    myDiagram.toolManager.relinkingTool.temporaryLink.routing = go.Link.Orthogonal;

    initDiagramModel();


    function initNodeActivity(){
      myDiagram.nodeTemplateMap.add("Activity",  // the default category
        $(go.Node,"Spot",nodeStyle(),
          $(go.Panel,"Auto",{scale:1},
            new go.Binding("scale","scale"),
            $(go.Shape,
              { fill: $(go.Brush, "Linear", { 0: "white", 1: "#eee", start:go.Spot.Right }),stroke: "#bbb", strokeWidth:3},
              new go.Binding("fill","fillActivity"),
              new go.Binding("stroke","strokeActivity")
            ),
            $(go.Panel, "Table",
            { defaultAlignment: go.Spot.Top },
              $(go.RowColumnDefinition, { column: 1, width: 35 }),
              $(go.RowColumnDefinition, { row: 1, height: 5 }),
              $(go.RowColumnDefinition, { row: 2, height: 33 }),
              $(go.Panel, "Table",
                { row: 0, column: 0, margin: new go.Margin(1,0,0,1)},
                $(go.Panel,"Auto",
                  { row: 0, column: 0 },
                  $(go.Shape, "Rectangle", { fill:"transparent",stroke: "#bbb", strokeCap:"square", width:20, height:20 },
                    new go.Binding("stroke","strokeActivity")
                  ),
                  $(go.Picture,
                    { width: 15, height: 15, source:"img/diagramIcons/F.svg" },
                    new go.Binding("source","tipoInteraccion")
                  )
                ),
                $(go.Panel,"Auto",
                  { row: 0, column: 1 },
                  $(go.Shape, "Rectangle", { fill:"transparent",stroke: "#bbb", strokeCap:"square", width:20, height:20 },
                    new go.Binding("stroke","strokeActivity")
                  ),
                  $(go.Picture,
                    { width: 10, height: 10, source:"img/diagramIcons/Grupo.svg" },
                    new go.Binding("source","Actor")
                  )
                )
              ),
              $(go.Picture,
                { row:0, column: 2, width: 17, height: 17, margin:new go.Margin(4,3,0,0),source:"img/diagramIcons/Busqueda.svg" },
                new go.Binding("source","activityType")
              ),
              $(go.TextBlock, "Busqueda",  // spans all three columns
                  { row: 2, column: 0, columnSpan: 3, stretch: go.GraphObject.Horizontal, textAlign: "center",
                    margin: 2, editable: true,font: "13px Arial", maxSize: new go.Size(145, 60)
                  },
                  new go.Binding("text","name")
              )
            )
          ),
          makePort("T",go.Spot.Top, false, true),
          makePort("L",go.Spot.Left,true,true),
          makePort("R",go.Spot.Right,true,true),
          makePort("B",go.Spot.Bottom,true,false)
        )
      );
    }

    function initNodeDescision(){
      myDiagram.nodeTemplateMap.add("Decision",  // the default category
        $(go.Node, "Spot",nodeStyle(),
          // the main object is a Panel that surrounds a TextBlock with a rectangular Shape
          $(go.Panel, "Auto",
            $(go.Shape, "Diamond",
              { width: 35, height:42, fill: "#898989", stroke: "#afaaaa" }
            )
          ),
          makePort("T", go.Spot.Top, false, true),
          makePort("L", go.Spot.Left, true, false),
          makePort("R", go.Spot.Right, true, false),
          makePort("B", go.Spot.Bottom, true, false)
        )
      );
    }

    function initNodeStart(){
      myDiagram.nodeTemplateMap.add("Start",
        $(go.Node, "Spot",nodeStyle(),
          $(go.Panel, "Spot",
            $(go.Shape,"Circle",
            { width: 27, height:27, stroke:"#555", margin:4, fill: null}),

            $(go.Shape,"Circle",
            { width: 22, height:22, stroke:"#555", margin:4, fill: null}),

            $(go.Shape,"Circle",
            { width: 14, height:14, margin:4, fill: "#4CAF50",stroke:null}
            )
          ),
          makePort("B", go.Spot.Bottom, true, false)
        )
      );
    }

    function initNodeEnd(){
      myDiagram.nodeTemplateMap.add("End",
        $(go.Node, "Spot",nodeStyle(),
          $(go.Panel, "Spot",
            $(go.Shape,"Circle",
              { width: 27, height:27, stroke:"#555", margin:4, fill: null}
            ),
            $(go.Shape,"Circle",
              { width: 22, height:22, stroke:"#555", margin:4, fill: null}
            ),
            $(go.Shape,"Circle",
              { width: 14, height:14, margin:4, fill: "red",stroke:null}
            )
          ),
          makePort("T", go.Spot.Top, false, true)
        )
      );
    }

    function initNodeSplit(){
      myDiagram.nodeTemplateMap.add("Split",  // the default category
        $(go.Node, "Spot",nodeStyle(),
          $(go.Panel, "Spot",
            $(go.Picture,
              { width: 50, height: 40, source:"img/diagramIcons/Split.svg" }
            )
          ),
          makePort("T",go.Spot.Top,false,true),
          makePort("B",go.Spot.Bottom,true,false)
        )
      );
    }

    function initNodeMerge(){
      myDiagram.nodeTemplateMap.add("Merge",  // the default category
        $(go.Node, "Spot",nodeStyle(),
          $(go.Panel, "Spot",
            $(go.Picture,
              { width: 50, height: 40, source:"img/diagramIcons/Merge.svg" }
            )
          ),
          makePort("T",go.Spot.Top,false,true),
          makePort("B",go.Spot.Bottom,true,false)
        )
      );
    }

    function initNodeNotificacion(){
      myDiagram.nodeTemplateMap.add("Notificacion",  // the default category
        $(go.Node, "Spot",nodeStyle(),
          $(go.Panel, "Spot",
            $(go.Picture,
              { width: 45, height: 35, source:"img/diagramIcons/Notificacion.svg" }
            )
          ),
          makePort("T", go.Spot.Top, false, true),
          makePort("L", go.Spot.Left, true, false),
          makePort("R", go.Spot.Right, true, false),
          makePort("B", go.Spot.Bottom, true, true)
        )
      );
    }

    function initNodeEspera(){
      myDiagram.nodeTemplateMap.add("Espera",  // the default category
        $(go.Node, "Spot",nodeStyle(),
          $(go.Panel, "Spot",
            $(go.Picture,
              { width: 45, height: 35, source:"img/diagramIcons/Espera.svg" }
            )
          ),
          makePort("T", go.Spot.Top, false, true),
          makePort("L", go.Spot.Left, true, false),
          makePort("R", go.Spot.Right, true, false),
          makePort("B", go.Spot.Bottom, true, false)
        )
      );
    }

    function initNodeSincronizacion(){
      myDiagram.nodeTemplateMap.add("sincronozación",  // the default category
        $(go.Node, "Spot",nodeStyle(),
          $(go.Panel, "Spot",
            $(go.Shape,"Rectangle",
              { width: 200, height:8,fill: "#898989", stroke:"#555"}
            )
          ),
          makePort("T",go.Spot.Top,false,true),
          makePort("TL",new go.Spot(0.1,0),false,true),
          makePort("TR",new go.Spot(0.9,0),false,true),
          makePort("B",go.Spot.Bottom,true,false)
        )
      );
    }

    function initLinkTemplate(){
      // replace the default Link template in the linkTemplateMap
      myDiagram.linkTemplate =
      $(go.Link,  // the whole link panel
        {
          routing: go.Link.AvoidsNodes,
          curve: go.Link.JumpOver,
          corner: 2, toShortLength: 4,
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
            { isPanelMain: true, stroke: "gray", strokeWidth: 1 }),
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
              var nombre= part.data.name;
              var InteraccionNodo = part.data.tipoInteraccion;

              document.getElementById("input-nombre").value=nombre;
              /*if(nombre.includes("[Formación]")){
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
              }*/
              document.getElementById("input-descripcion").value=part.data.descripcion;
              selectTipoInteraccion = document.getElementById("select-tipointeraccion");
              switch (part.data.tipoInteraccion) {
                case tiposInteraccion.facetoface:
                  selectTipoInteraccion.options.selectedIndex="1";
                  break;
                case tiposInteraccion.blended:
                  selectTipoInteraccion.options.selectedIndex="2";
                  break;
                case tiposInteraccion.web:
                  selectTipoInteraccion.options.selectedIndex="3";
                  break;
                default:
                  break;
              }

              selectActor=document.getElementById("select-actor");
              switch (part.data.Actor) {
                case tiposActores.strudent:
                  selectActor.options.selectedIndex="1";
                  break;
                case tiposActores.groups:
                  selectActor.options.selectedIndex="2";
                  break;
                case tiposActores.class:
                  selectActor.options.selectedIndex="3";
                  break;
                default:
                  break;
              }
              selectTipoActividad = document.getElementById("select-tipoActividad");

              var subtiposActividad={
                asimilativa:["Formacion","Lectura","Observacion"],
                gestion_informacion:["Analisis","Busqueda"],
                aplicacion:["Entrenamiento"],
                comunicativas:["Asesoria","Asistencia","Discusion","Exposicion","Acuerdo","Conferencia"],
                evaluativas:["Escrita","Oral","Retroalimentacion"],
                productivas:"",
                experienciales:""
              };
              var array=[];
              var stringTipoActividad="";

              switch (part.data.tipoActividad) {
                case tipoActividad.asimilativa:
                  selectTipoActividad.options.selectedIndex="1";
                  array=subtiposActividad.asimilativa;
                  stringTipoActividad=tipoActividad.asimilativa;
                  break;
                case tipoActividad.gestion_informacion:
                  selectTipoActividad.options.selectedIndex="2";
                  array=subtiposActividad.gestion_informacion;
                  stringTipoActividad=tipoActividad.gestion_informacion;
                  break;
                case tipoActividad.aplicacion:
                  selectTipoActividad.options.selectedIndex="3";
                  array=subtiposActividad.aplicacion;
                  stringTipoActividad=tipoActividad.aplicacion;
                  break;
                case tipoActividad.comunicativas:
                  selectTipoActividad.options.selectedIndex="4";
                  array=subtiposActividad.comunicativas;
                  stringTipoActividad=tipoActividad.comunicativas;
                  break;
                case tipoActividad.evaluativas:
                  selectTipoActividad.options.selectedIndex="5";
                  array=subtiposActividad.evaluativas;
                  stringTipoActividad=tipoActividad.evaluativas;
                  break;
                case tipoActividad.productivas:
                  selectTipoActividad.options.selectedIndex="6";
                  array=subtiposActividad.productivas;
                  stringTipoActividad=tipoActividad.productivas;
                  break;
                case tipoActividad.experienciales:
                  selectTipoActividad.options.selectedIndex="7";
                  array=subtiposActividad.experienciales;
                  stringTipoActividad=tipoActividad.experienciales;
                  break;
                default:
                  break;
              }
              cargarSubtiposActividades(stringTipoActividad);
              var indexSubtipoActividad=0;
              var subtipoActividad=part.data.subtipoActividad;
              for (var i = 0; i < array.length; i++) {
                if(array[i]===subtipoActividad){
                  indexSubtipoActividad=i;
                  break;
                }
              }
              selectSubtipoActividad=document.getElementById("select-subtipoActividad");
              //esto debido a que la primera posicion del combobox es "seleccione una opcion"
              indexSubtipoActividad+=1;
              selectSubtipoActividad.options.selectedIndex=""+indexSubtipoActividad;
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
        {"category":"Activity", "name":"Conceptos\nBásicos", tipoActividad:"asimilativas", subtipoActividad:"Formacion", "key":-2, "loc":"-18.984375 -308", strokeActivity:"#F7C296", tipoInteraccion:"img/diagramIcons/W.svg",Actor:"img/diagramIcons/Individual AUX.svg",activityType:"img/diagramIcons/Presentacion.svg",fillActivity:$(go.Brush, "Linear", { 0: "white", 1: "#FBE9DA", start:go.Spot.Right })},
        {"category":"Activity", "name":"Busqueda", "key":-3, tipoActividad:"gestion_informacion", subtipoActividad:"Busqueda", "loc":"-18.984375 -206", tipoInteraccion:"img/diagramIcons/W.svg"},
        {"category":"Activity", "name":"Taller", tipoActividad:"aplicacion", subtipoActividad:"Entrenamiento", "key":-4, "loc":"-85.984375 -33",  strokeActivity:"#A0C96C", tipoInteraccion:"img/diagramIcons/F.svg",Actor:"img/diagramIcons/Grupo.svg",activityType:"img/diagramIcons/Entrenamiento.svg",fillActivity:$(go.Brush, "Linear", { 0: "white", 1: "#DBEACD", start:go.Spot.Right })},
        {"category":"Activity", "name":"Discusión\nsobre la tematica", tipoActividad:"comunicativas", subtipoActividad:"Discusion", "key":-5, "loc":"75.015625 -33", strokeActivity:"#A3BFE0", tipoInteraccion:"img/diagramIcons/F.svg",Actor:"img/diagramIcons/Grupo.svg",activityType:"img/diagramIcons/Chat.svg",fillActivity:$(go.Brush, "Linear", { 0: "white", 1: "#D4E0F2", start:go.Spot.Right })},
        {"category":"Activity", "name":"Evaluacion", tipoActividad:"evaluativas", subtipoActividad:"Escrita", "key":-6, "loc":"-5.984375 123", strokeActivity:"#F19093", tipoInteraccion:"img/diagramIcons/W.svg",Actor:"img/diagramIcons/Individual AUX.svg",activityType:"img/diagramIcons/Evaluacion.svg",fillActivity:$(go.Brush, "Linear", { 0: "white", 1: "#FBE1E2", start:go.Spot.Right })},
        {"category":"Merge", "key":-7, "loc":"-18.984375 -121"},
        {"category":"sincronozación", "key":-9, "loc":"-5.984375 52"},
        {"category":"Decision", "key":-8, "loc":"-5.984375 204"},
        {"category":"Activity", "name":" Asistir a\nAsesoria", tipoActividad:"comunicativas", subtipoActividad:"Asesoria", "key":-10, "loc":"136.015625 261", strokeActivity:"#A3BFE0", tipoInteraccion:"img/diagramIcons/F.svg",Actor:"img/diagramIcons/Individual AUX.svg",activityType:"img/diagramIcons/Revision.svg",fillActivity:$(go.Brush, "Linear", { 0: "white", 1: "#D4E0F2", start:go.Spot.Right })},
        {"category":"Notificacion", "key":-11, "loc":"-159.984375 57.99999999999994"},
        {"category":"Espera", "key":-12, "loc":"136.015625 337"},
        {"category":"Activity", "name":"Feedback de\nconceptos básicos", tipoActividad:"evaluativas", subtipoActividad:"Escrita", "key":-13, "loc":"-6.984375 423",strokeActivity:"#F19093", tipoInteraccion:"img/diagramIcons/W.svg",Actor:"img/diagramIcons/Individual AUX.svg",activityType:"img/diagramIcons/Evaluacion.svg",fillActivity:$(go.Brush, "Linear", { 0: "white", 1: "#FBE1E2", start:go.Spot.Right })},
        {"category":"End", "key":-14, "loc":"-6.984375 503"}
      ];
      return nodedata;
    }
    function initLinkData(){
      var linkdata = [
        {"from":-2, "to":-3, "fromPort":"B", "toPort":"T"},
        {"from":-3, "to":-7, "fromPort":"B", "toPort":"T"},
        {"from":-7, "to":-4, "fromPort":"B", "toPort":"T"},
        {"from":-7, "to":-5, "fromPort":"B", "toPort":"T"},
        {"from":-4, "to":-9, "fromPort":"B", "toPort":"TL"},
        {"from":-5, "to":-9, "fromPort":"B", "toPort":"TR"},
        {"from":-9, "to":-6, "fromPort":"B", "toPort":"T"},
        {"from":-6, "to":-8, "fromPort":"B", "toPort":"T"},
        {"from":-8, "to":-10, "fromPort":"R", "toPort":"T", "visible":true},
        {"from":-10, "to":-12, "fromPort":"B", "toPort":"T"},
        {"from":-12, "to":-13, "fromPort":"B", "toPort":"T"},
        {"from":-8, "to":-13, "fromPort":"B", "toPort":"T", "visible":true},
        {"from":-13, "to":-14, "fromPort":"B", "toPort":"T"},
        {"from":-6, "to":-11, "fromPort":"L", "toPort":"B"},
        {"from":-4, "to":-11, "fromPort":"L", "toPort":"T"}
      ];
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

    myPalette =
      $(go.Palette, "myPaletteDiv",  // must name or refer to the DIV HTML element
        {
          "animationManager.duration": 800, // slightly longer than default (600ms) animation
          nodeTemplateMap: myDiagram.nodeTemplateMap,
          initialScale:0.85, // share the templates used by myDiagram
          model: new go.GraphLinksModel([  // specify the contents of the Palette
            { category: "Start"},
            { category: "End"},
            { category: "Activity", name:"activity"},
            { category: "Decision"},
            { category: "Merge"},
            { category: "Split"},
            { category: "Notificacion"},
            { category: "Espera"}
            //{ category: "sincronozación"}
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
        //determinarCambiosModelo();
        imprimirModelo();
      });
      function imprimirModelo(){
        console.log(myDiagram.model.toJson());
      };

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

      activateChangeEventSelectActivityType();
      function activateChangeEventSelectActivityType(){
        jquery('#select-tipoActividad').on('change',function(){
          cargarSubtiposActividades(jquery('#select-tipoActividad').val());
        });
      };

      function cargarSubtiposActividades(valor){
        if(valor!==""){
          array=[];
          switch (valor) {
            case tipoActividad.asimilativa:
              array=subtiposActividad.asimilativa;
              break;
            case tipoActividad.gestion_informacion:
              array=subtiposActividad.gestion_informacion;
              break;
            case tipoActividad.aplicacion:
              array=subtiposActividad.aplicacion;;
              break;
            case tipoActividad.comunicativas:
              array=subtiposActividad.comunicativas;
              break;
            case tipoActividad.evaluativas:
              array=subtiposActividad.evaluativas;
              break;
            case tipoActividad.productivas:
              array=subtiposActividad.productivas;
              break;
            case tipoActividad.experienciales:
              array=subtiposActividad.experienciales;
              break;
            default:
              return;
          }
          console.log(array);
          document.getElementById("select-subtipoActividad").options.length=0;

          // añadimos los nuevos valores al select2
          document.getElementById("select-subtipoActividad").options[0]=new Option("Selecciona una opcion", "");
          for(i=0;i<array.length;i++)
          {
            document.getElementById("select-subtipoActividad").options[document.getElementById("select-subtipoActividad").options.length]=new Option(array[i], array[i]);
          }

        }
      }

});
