require(['local_flowdiagram/go','jquery','core/ajax'], function (go,jquery,ajax){
  var modelData=[];
  var $ = go.GraphObject.make;
  var informacionGeneral={
    tiposInteraccion:{ facetoface:"img/diagramIcons/F.svg", blended:"img/diagramIcons/B.svg",web:"img/diagramIcons/W.svg"},
    tiposActores: { strudent:"img/diagramIcons/Individual AUX.svg", groups:"img/diagramIcons/Grupo.svg", class:"img/diagramIcons/CursoF.svg", teacher:"profesor.svg"},
    tiposActividad:{
      asimilativa: {
        nombre:"asimilativas",
        subtipos:["Formacion","Lectura","Observacion"]
      },
      gestion_informacion:{
        nombre:"gestion_informacion",
        subtipos:["Analisis","Busqueda"]
      },
      aplicacion:{
        nombre:"aplicacion",
        subtipos:["Entrenamiento"]
      },
      comunicativas:{
        nombre:"comunicativas",
        subtipos:["Asesoria","Asistencia","Discusion","Exposicion","Acuerdo","Conferencia"]
      },
      evaluativas:{
        nombre:"evaluativas",
        subtipos:["Escrita","Oral","Retroalimentacion"]
      },
      productivas:{
        nombre:"productivas",
        subtipos:["Productiva"]
      },
      experienciales:{
        nombre:"experienciales",
        subtipos:["experiencial"]
      }
    }
  };
  var imagenesSubTiposActividad={
    asimilativa:{
      formacion:"img/diagramIcons/subtiposActividad/Formacion.svg",
      lectura:"img/diagramIcons/subtiposActividad/Lectura.svg",
      observacion:"img/diagramIcons/subtiposActividad/Observacion.svg"
    },
    gestion_informacion:{
      analisis:"img/diagramIcons/subtiposActividad/Analisis.svg",
      busqueda:"img/diagramIcons/subtiposActividad/Busqueda.svg"
    },
    aplicacion:{
      entrenamiento:"img/diagramIcons/subtiposActividad/Entrenamiento.svg"
    },
    comunicativas:{
      asesoria:"img/diagramIcons/subtiposActividad/Asesoria.svg",
      asistencia:"img/diagramIcons/subtiposActividad/Asistencia.svg",
      discusion:"img/diagramIcons/subtiposActividad/Discusion.svg",
      exposicion:"img/diagramIcons/subtiposActividad/Exposicion.svg",
      acuerdo:"img/diagramIcons/subtiposActividad/Acuerdo.svg",
      conferencia:"img/diagramIcons/subtiposActividad/Conferencia.svg"
    },
    evaluativas:{
      escrita:"img/diagramIcons/subtiposActividad/Escrita.svg",
      oral:"img/diagramIcons/subtiposActividad/Oral.svg",
      retroalimentacion:"img/diagramIcons/subtiposActividad/Retroalimentacion.svg"
    },
    productivas:{
      productiva:"img/diagramIcons/subtiposActividad/Productiva.svg"
    },
    experienciales:{
      experiencial:"img/diagramIcons/subtiposActividad/Experiencial.svg"
    }
  }
  //variable gloal que permite concer el nodo seleccionado actualmente en el diagrama
  var nodoSeleccionado={};

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
    initNodeControlPointAutomatic();
    initNodeControlPointManual();
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
          $(go.Panel,"Auto",
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
                { row:0, column: 2, width: 23, height: 23, margin:new go.Margin(4,3,0,0),source: imagenesSubTiposActividad.gestion_informacion.busqueda },
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
            $(go.Picture,
              { width: 37, height: 25, source:"img/diagramIcons/Start.svg" }
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
            $(go.Picture,
              { width: 37, height: 25, source:"img/diagramIcons/End.svg" }
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

    function initNodeControlPointAutomatic(){
      myDiagram.nodeTemplateMap.add("ControlPointAutomatic",  // the default category
        $(go.Node, "Spot",nodeStyle(),
          $(go.Panel, "Spot",
            $(go.Picture,
              { width: 35, height: 35, source:"img/diagramIcons/ControlPointAutomatic.svg" }
            )
          ),
          makePort("T", go.Spot.Top, false, true),
          makePort("L", go.Spot.Left, true, false),
          makePort("R", go.Spot.Right, true, false),
          makePort("B", go.Spot.Bottom, true, true)
        )
      );
    }

    function initNodeControlPointManual(){
      myDiagram.nodeTemplateMap.add("ControlPointManual",  // the default category
        $(go.Node, "Spot",nodeStyle(),
          $(go.Panel, "Spot",
            $(go.Picture,
              { width: 35, height: 35, source:"img/diagramIcons/ControlPointManual.svg" }
            )
          ),
          makePort("T", go.Spot.Top, false, true),
          makePort("L", go.Spot.Left, true, false),
          makePort("R", go.Spot.Right, true, false),
          makePort("B", go.Spot.Bottom, true, true)
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
          makePort("BL",new go.Spot(0.1,1),true,false),
          makePort("BR",new go.Spot(0.9,1),true,false),
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
              nodoSeleccionado=part;
              var nombre= part.data.name;
              var InteraccionNodo = part.data.tipoInteraccion;

              document.getElementById("input-nombre").value=nombre;
              //OBTIENE LAS PLATILLAS SEGUN EL TIPO DE ACTIVIDAD
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
                case informacionGeneral.tiposInteraccion.facetoface:
                  selectTipoInteraccion.options.selectedIndex="1";
                  break;
                case informacionGeneral.tiposInteraccion.blended:
                  selectTipoInteraccion.options.selectedIndex="2";
                  break;
                case informacionGeneral.tiposInteraccion.web:
                  selectTipoInteraccion.options.selectedIndex="3";
                  break;
                default:
                  break;
              }

              selectActor=document.getElementById("select-actor");
              switch (part.data.Actor) {
                case informacionGeneral.tiposActores.strudent:
                  selectActor.options.selectedIndex="1";
                  break;
                case informacionGeneral.tiposActores.groups:
                  selectActor.options.selectedIndex="2";
                  break;
                case informacionGeneral.tiposActores.class:
                  selectActor.options.selectedIndex="3";
                  break;
                case informacionGeneral.tiposActores.teacher:
                  selectActor.options.selectedIndex="4";
                default:
                  break;
              }
              selectTipoActividad = document.getElementById("select-tipoActividad");
              var array=[];
              var stringTipoActividad="";

              switch (part.data.tipoActividad) {
                case informacionGeneral.tiposActividad.asimilativa.nombre:
                  selectTipoActividad.options.selectedIndex="1";
                  array=informacionGeneral.tiposActividad.asimilativa.subtipos;
                  stringTipoActividad=informacionGeneral.tiposActividad.asimilativa.nombre;
                  break;
                case informacionGeneral.tiposActividad.gestion_informacion.nombre:
                  selectTipoActividad.options.selectedIndex="2";
                  array=informacionGeneral.tiposActividad.gestion_informacion.subtipos;
                  stringTipoActividad=informacionGeneral.tiposActividad.gestion_informacion.nombre;
                  break;
                case informacionGeneral.tiposActividad.aplicacion.nombre:
                  selectTipoActividad.options.selectedIndex="3";
                  array=informacionGeneral.tiposActividad.aplicacion.subtipos;
                  stringTipoActividad=informacionGeneral.tiposActividad.aplicacion.nombre;
                  break;
                case informacionGeneral.tiposActividad.comunicativas.nombre:
                  selectTipoActividad.options.selectedIndex="4";
                  array=informacionGeneral.tiposActividad.comunicativas.subtipos;
                  stringTipoActividad=informacionGeneral.tiposActividad.comunicativas.nombre;
                  break;
                case informacionGeneral.tiposActividad.evaluativas.nombre:
                  selectTipoActividad.options.selectedIndex="5";
                  array=informacionGeneral.tiposActividad.evaluativas.subtipos;
                  stringTipoActividad=informacionGeneral.tiposActividad.evaluativas.nombre;
                  break;
                case informacionGeneral.tiposActividad.productivas.nombre:
                  selectTipoActividad.options.selectedIndex="6";
                  array=informacionGeneral.tiposActividad.productivas.subtipos;
                  stringTipoActividad=informacionGeneral.tiposActividad.productivas.nombre;
                  break;
                case informacionGeneral.tiposActividad.experienciales.nombre:
                  selectTipoActividad.options.selectedIndex="7";
                  array=informacionGeneral.tiposActividad.experienciales.subtipos;
                  stringTipoActividad=informacionGeneral.tiposActividad.experienciales.nombre;
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
        {"category":"Activity", "name":"Conceptos\nBásicos", tipoActividad:"asimilativas", subtipoActividad:"Formacion", "key":-2, "loc":"-12.984375000000014 -200.99999999999994", strokeActivity:"#F7C296", tipoInteraccion:"img/diagramIcons/W.svg",Actor:"img/diagramIcons/Individual AUX.svg",activityType:imagenesSubTiposActividad.asimilativa.formacion,fillActivity:$(go.Brush, "Linear", { 0: "white", 1: "#FBE9DA", start:go.Spot.Right })},
        {"category":"Activity", "name":"Busqueda", "key":-3, tipoActividad:"gestion_informacion", subtipoActividad:"Busqueda", "loc":"-12.984375000000014 -115", tipoInteraccion:"img/diagramIcons/W.svg"},
        {"category":"Activity", "name":"Taller", tipoActividad:"aplicacion", subtipoActividad:"Entrenamiento", "key":-4, "loc":"-85.98437499999997 30.999999999999993",  strokeActivity:"#A0C96C", tipoInteraccion:"img/diagramIcons/F.svg",Actor:"img/diagramIcons/Grupo.svg",activityType:imagenesSubTiposActividad.aplicacion.entrenamiento,fillActivity:$(go.Brush, "Linear", { 0: "white", 1: "#DBEACD", start:go.Spot.Right })},
        {"category":"Activity", "name":"Discusión\nsobre la tematica", tipoActividad:"comunicativas", subtipoActividad:"Discusion", "key":-5, "loc":"74.01562500000001 30.999999999999996", strokeActivity:"#A3BFE0", tipoInteraccion:"img/diagramIcons/F.svg",Actor:"img/diagramIcons/Grupo.svg",activityType:imagenesSubTiposActividad.comunicativas.discusion,fillActivity:$(go.Brush, "Linear", { 0: "white", 1: "#D4E0F2", start:go.Spot.Right })},
        {"category":"Activity", "name":"Evaluacion", tipoActividad:"evaluativas", subtipoActividad:"Escrita", "key":-6, "loc":"-5.984375000000007 144", strokeActivity:"#F19093", tipoInteraccion:"img/diagramIcons/W.svg",Actor:"img/diagramIcons/Individual AUX.svg",activityType:imagenesSubTiposActividad.evaluativas.escrita,fillActivity:$(go.Brush, "Linear", { 0: "white", 1: "#FBE1E2", start:go.Spot.Right })},
        {"category":"Merge", "key":-7, "loc":"-12.984375 -44.99999999999997"},
        {"category":"sincronozación", "key":-9, "loc":"-5.984375 84.99999999999999"},
        {"category":"Decision", "key":-8, "loc":"-5.984375 219.99999999999991"},
        {"category":"Activity", "name":" Asistir a\nAsesoria", tipoActividad:"comunicativas", subtipoActividad:"Asesoria", "key":-10, "loc":"138.01562499999994 267.9999999999999", strokeActivity:"#A3BFE0", tipoInteraccion:"img/diagramIcons/F.svg",Actor:"img/diagramIcons/Individual AUX.svg",activityType:imagenesSubTiposActividad.comunicativas.asesoria,fillActivity:$(go.Brush, "Linear", { 0: "white", 1: "#D4E0F2", start:go.Spot.Right })},
        {"category":"Notificacion", "key":-11, "loc":"-174.98437500000006 122.99999999999993"},
        {"category":"Espera", "key":-12, "loc":"138.01562499999997 338.00000000000006"},
        {"category":"Activity", "name":"Feedback de\nconceptos básicos", tipoActividad:"evaluativas", subtipoActividad:"Escrita", "key":-13, "loc":"-5.984375000000014 409.9999999999998",strokeActivity:"#F19093", tipoInteraccion:"img/diagramIcons/W.svg",Actor:"img/diagramIcons/Individual AUX.svg",activityType:imagenesSubTiposActividad.evaluativas.retroalimentacion,fillActivity:$(go.Brush, "Linear", { 0: "white", 1: "#FBE1E2", start:go.Spot.Right })},
        {"category":"End", "key":-14, "loc":"-5.984375 477.99999999999966"},
        {"category":"Start", "key":-1, "loc":"-12.546875 -264"}
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
        {"from":-8, "to":-10, "fromPort":"R", "toPort":"T", "visible":false},
        {"from":-10, "to":-12, "fromPort":"B", "toPort":"T"},
        {"from":-12, "to":-13, "fromPort":"B", "toPort":"T"},
        {"from":-8, "to":-13, "fromPort":"B", "toPort":"T", "visible":false},
        {"from":-13, "to":-14, "fromPort":"B", "toPort":"T"},
        {"from":-4, "to":-11, "fromPort":"L", "toPort":"T"},
        {"from":-1, "to":-2, "fromPort":"B", "toPort":"T"},
        {"from":-8, "to":-11, "fromPort":"L", "toPort":"B", "visible":true, "text":"Evaluación <3"}
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
            { category: "Activity", name:"activity"},
            { category: "Start"},
            { category: "End"},
            { category: "Decision"},
            { category: "Merge"},
            { category: "Split"},
            { category: "ControlPointManual"},
            { category: "ControlPointAutomatic"},
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
          valorTipoActivad=jquery('#select-tipoActividad').val();
          cargarSubtiposActividades(valorTipoActivad);
          updateNodeActivityTypeVisualmente(valorTipoActivad,nodoSeleccionado);
          //carga el primer subtipo  de actividad por defecto;
          selectSubtipoActividad=document.getElementById("select-subtipoActividad");
          selectSubtipoActividad.options.selectedIndex="1";
          valorSubtipoActividad=jquery('#select-subtipoActividad').val();
          updateNodeActivitySubtypeVisualmente(valorTipoActivad,valorSubtipoActividad,nodoSeleccionado)
        });
      };

      function updateNodeActivityTypeVisualmente(valueTipoActividad,nodo){

        var fillActivity="";
        var strokeActivity="";
        switch (valueTipoActividad) {
          case informacionGeneral.tiposActividad.asimilativa.nombre:
            fillActivity=$(go.Brush, "Linear", { 0: "white", 1: "#FBE9DA", start:go.Spot.Right });
            strokeActivity="#F7C296";
            break;
          case informacionGeneral.tiposActividad.gestion_informacion.nombre:
            fillActivity=$(go.Brush, "Linear", { 0: "white", 1: "#eee", start:go.Spot.Right });
            strokeActivity="#bbb";
            break;
          case informacionGeneral.tiposActividad.aplicacion.nombre:
            fillActivity=$(go.Brush, "Linear", { 0: "white", 1: "#DBEACD", start:go.Spot.Right });
            strokeActivity="#A0C96C";
            break;
          case informacionGeneral.tiposActividad.comunicativas.nombre:
            fillActivity=$(go.Brush, "Linear", { 0: "white", 1: "#D4E0F2", start:go.Spot.Right });
            strokeActivity="#A3BFE0";
            break;
          case informacionGeneral.tiposActividad.evaluativas.nombre:
            fillActivity=$(go.Brush, "Linear", { 0: "white", 1: "#FBE1E2", start:go.Spot.Right });
            strokeActivity="#F19093";
            break;
          case informacionGeneral.tiposActividad.productivas.nombre:
            fillActivity=$(go.Brush, "Linear", { 0: "white", 1: "#FCF8D2", start:go.Spot.Right });
            strokeActivity="#F2E66E";
            break;
          case informacionGeneral.tiposActividad.experienciales.nombre:
            fillActivity=$(go.Brush, "Linear", { 0: "white", 1: "#F3BCD7", start:go.Spot.Right });
            strokeActivity="#E37BAE";
            break;
          default:
            return;
          }

        var model = myDiagram.model;
        model.startTransaction("change aspecto del nodo segun tipo actividad");
        model.setDataProperty(nodo.data,"fillActivity",fillActivity);
        model.setDataProperty(nodo.data,"strokeActivity",strokeActivity);
        model.commitTransaction("change aspecto del nodo segun tipo actividad");
      };

      function cargarSubtiposActividades(valor){
        if(valor!==""){
          array=[];
          switch (valor) {
            case informacionGeneral.tiposActividad.asimilativa.nombre:
              array=informacionGeneral.tiposActividad.asimilativa.subtipos;
              break;
            case informacionGeneral.tiposActividad.gestion_informacion.nombre:
              array=informacionGeneral.tiposActividad.gestion_informacion.subtipos;
              break;
            case informacionGeneral.tiposActividad.aplicacion.nombre:
              array=informacionGeneral.tiposActividad.aplicacion.subtipos;
              break;
            case informacionGeneral.tiposActividad.comunicativas.nombre:
              array=informacionGeneral.tiposActividad.comunicativas.subtipos;
              break;
            case informacionGeneral.tiposActividad.evaluativas.nombre:
              array=informacionGeneral.tiposActividad.evaluativas.subtipos;
              break;
            case informacionGeneral.tiposActividad.productivas.nombre:
              array=informacionGeneral.tiposActividad.productivas.subtipos;
              break;
            case informacionGeneral.tiposActividad.experienciales.nombre:
              array=informacionGeneral.tiposActividad.experienciales.subtipos;
              break;
            default:
              break;
          }
          document.getElementById("select-subtipoActividad").options.length=0;

          // añadimos los nuevos valores al select2
          document.getElementById("select-subtipoActividad").options[0]=new Option("Selecciona una opcion", "");
          for(i=0;i<array.length;i++)
          {
            document.getElementById("select-subtipoActividad").options[document.getElementById("select-subtipoActividad").options.length]=new Option(array[i], array[i]);
          }

        }
      }

      activateChangeEventSelectActivitySubtype();
      function activateChangeEventSelectActivitySubtype(){
        jquery('#select-subtipoActividad').on('change',function(){
          var valorTipoActivad=jquery('#select-tipoActividad').val();
          var valorSubtipoActividad=jquery('#select-subtipoActividad').val();
          updateNodeActivitySubtypeVisualmente(valorTipoActivad,valorSubtipoActividad,nodoSeleccionado);
        });
      };

      function updateNodeActivitySubtypeVisualmente(valorTipoActivad,valorSubtipoActividad,nodo){

        var subtipoActividad="";
        var activityType="";
        switch (valorTipoActivad) {
          case informacionGeneral.tiposActividad.asimilativa.nombre:
            switch (valorSubtipoActividad) {
              case informacionGeneral.tiposActividad.asimilativa.subtipos[0]:
                subtipoActividad="Formacion";
                activityType=imagenesSubTiposActividad.asimilativa.formacion;
                break;
              case informacionGeneral.tiposActividad.asimilativa.subtipos[1]:
                subtipoActividad="Lectura";
                activityType=imagenesSubTiposActividad.asimilativa.lectura;
                break;
              case informacionGeneral.tiposActividad.asimilativa.subtipos[2]:
                subtipoActividad="Observacion";
                activityType=imagenesSubTiposActividad.asimilativa.observacion;
                break;
              default:
                return
            }
            break;
          case informacionGeneral.tiposActividad.gestion_informacion.nombre:
            switch (valorSubtipoActividad) {
              case informacionGeneral.tiposActividad.gestion_informacion.subtipos[0]:
                subtipoActividad="Analisis";
                activityType=imagenesSubTiposActividad.gestion_informacion.analisis;
                break;
              case informacionGeneral.tiposActividad.gestion_informacion.subtipos[1]:
                subtipoActividad="Busqueda";
                activityType=imagenesSubTiposActividad.gestion_informacion.busqueda;
                break;
              default:
                return
            }
            break;
          case informacionGeneral.tiposActividad.aplicacion.nombre:
            switch (valorSubtipoActividad) {
              case informacionGeneral.tiposActividad.aplicacion.subtipos[0]:
                subtipoActividad="Entrenamiento";
                activityType=imagenesSubTiposActividad.aplicacion.entrenamiento;
                break;
              default:
                return
            }
            break;
          case informacionGeneral.tiposActividad.comunicativas.nombre:
            switch (valorSubtipoActividad) {
              case informacionGeneral.tiposActividad.comunicativas.subtipos[0]:
                subtipoActividad="Asesoria";
                activityType=imagenesSubTiposActividad.comunicativas.asesoria;
                break;
              case informacionGeneral.tiposActividad.comunicativas.subtipos[1]:
                subtipoActividad="Asistencia";
                activityType=imagenesSubTiposActividad.comunicativas.asistencia;
                break;
              case informacionGeneral.tiposActividad.comunicativas.subtipos[2]:
                subtipoActividad="Discusion";
                activityType=imagenesSubTiposActividad.comunicativas.discusion;
                break;
              case informacionGeneral.tiposActividad.comunicativas.subtipos[3]:
                subtipoActividad="Exposicion";
                activityType=imagenesSubTiposActividad.comunicativas.exposicion;
                break;
              case informacionGeneral.tiposActividad.comunicativas.subtipos[4]:
                subtipoActividad="Acuerdo";
                activityType=imagenesSubTiposActividad.comunicativas.acuerdo;
                break;
              case informacionGeneral.tiposActividad.comunicativas.subtipos[5]:
                subtipoActividad="Conferencia";
                activityType=imagenesSubTiposActividad.comunicativas.conferencia;
                break;
              default:
                return
            }
            break;
          case informacionGeneral.tiposActividad.evaluativas.nombre:
            switch (valorSubtipoActividad) {
              case informacionGeneral.tiposActividad.evaluativas.subtipos[0]:
                subtipoActividad="Escrita";
                activityType=imagenesSubTiposActividad.evaluativas.escrita;
                break;
              case informacionGeneral.tiposActividad.evaluativas.subtipos[1]:
                subtipoActividad="Oral";
                activityType=imagenesSubTiposActividad.evaluativas.oral;
                break;
              case informacionGeneral.tiposActividad.evaluativas.subtipos[2]:
                subtipoActividad="Retroalimentacion";
                activityType=imagenesSubTiposActividad.evaluativas.retroalimentacion;
                break;
              default:
                return;
            }
            break;
          case informacionGeneral.tiposActividad.productivas.nombre:
            switch (valorSubtipoActividad) {
              case informacionGeneral.tiposActividad.productivas.subtipos[0]:
                subtipoActividad="Productiva";
                activityType=imagenesSubTiposActividad.productivas.productiva;
                break;
              default:
                return;
            }
            break;
          case informacionGeneral.tiposActividad.experienciales.nombre:
            switch (valorSubtipoActividad) {
              case informacionGeneral.tiposActividad.experienciales.subtipos[0]:
                subtipoActividad="Experiencial";
                activityType=imagenesSubTiposActividad.experienciales.experiencial;
                break;
              default:
                return;
            }
            break;
          default:
            return;
          }

        var model = myDiagram.model;
        model.startTransaction("change aspecto del nodo segun subtipo actividad");
        model.setDataProperty(nodo.data,"subtipoActividad",subtipoActividad);
        model.setDataProperty(nodo.data,"activityType",activityType);
        model.commitTransaction("change aspecto del nodo segun subtipo actividad");
      };

      activateChangeEventSelectActor();
      function activateChangeEventSelectActor(){
        jquery('#select-actor').on('change',function(){
          var valorActor=jquery('#select-actor').val();
          updateNodeActorVisualmente(valorActor,nodoSeleccionado);
        });
      };

      function updateNodeActorVisualmente(valorActor,nodo){
        var Actor="";
        switch (valorActor) {
          case "Student":
            Actor="img/diagramIcons/Individual AUX.svg";
            break;
          case "Groups":
            Actor="img/diagramIcons/Grupo.svg";
            break;
          case "Class":
            Actor="img/diagramIcons/CursoF.svg";
            break;
          case "Teacher":
            Actor="img/diagramIcons/Profesor.svg";
            break;
          default:
            return;
          }

        var model = myDiagram.model;
        model.startTransaction("change actor del nodo");
        model.setDataProperty(nodo.data,"Actor",Actor);
        model.commitTransaction("change actor del nodo");
      };

      activateChangeEventSelectInteractionType();
      function activateChangeEventSelectInteractionType(){
        jquery('#select-tipointeraccion').on('change',function(){
          var valorTipoInteraccion=jquery('#select-tipointeraccion').val();
          updateNodeInteractionTypeVisualmente(valorTipoInteraccion,nodoSeleccionado);
        });
      };

      function updateNodeInteractionTypeVisualmente(valorTipoInteraccion,nodo){
        var stringTipoInteraccion="";
        switch (valorTipoInteraccion) {
          case "FTF":
            stringTipoInteraccion="img/diagramIcons/F.svg";
            break;
          case "Blended":
            stringTipoInteraccion="img/diagramIcons/B.svg";
            break;
          case "Web":
            stringTipoInteraccion="img/diagramIcons/W.svg";
            break;
          default:
            return;
          }

        var model = myDiagram.model;
        model.startTransaction("change tipoInteraccion del nodo");
        model.setDataProperty(nodo.data,"tipoInteraccion",stringTipoInteraccion);
        model.commitTransaction("change tipoInteraccion del nodo");
      };

      activateChangeEventInputNameActivity();
      function activateChangeEventInputNameActivity(){
        jquery('#input-nombre').on('change',function(){
          updateNodeNameVisualmente(jquery(this).val(),nodoSeleccionado);
        });
      };

      function updateNodeNameVisualmente(newName,nodo){
        var model = myDiagram.model;
        model.startTransaction("change nombre del nodo");
        model.setDataProperty(nodo.data,"name",newName);
        model.commitTransaction("change nombre del nodo");
      };

});
