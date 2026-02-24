var diagram_list;

// For parsing bibkeys
var bibkeys = [];
var titles = {};
var authors = {};
var years = {};


function filterkeys() {
  var input;
  input = document.getElementById('myInput').value;
  var bibkeys_filtered = bibkeys.filter(function (str) { return str.startsWith(input); });
  for(var i = 0; i < Math.min(bibkeys_filtered.length,5);i++){
    var dragbox = document.getElementById("drag"+(i+1));
    var key = bibkeys_filtered[i];
    dragbox.innerHTML =  key + "\n" + authors[key] + "\n" + years[key] + "\n" + titles[key];
  }
}


function get_diagram_svg(){
  var a = myDiagram.makeSvg({ scale: 1 });
  var svgData = a.outerHTML;
  var svgBlob = new Blob([svgData], {type:"image/svg+xml;charset=utf-8"});
  var svgUrl = URL.createObjectURL(svgBlob);
  var downloadLink = document.createElement("a");
  downloadLink.href = svgUrl;
  downloadLink.download = "citation_graph.svg";
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
}

function save_diagram() {
  var str = myDiagram.model.toJson();
  document.getElementById("mySavedModel").value = str;
  var diagram_use = document.getElementById("diagramName").value;

  localStorage.setItem("lastUsedDiagram", diagram_use);

  if(!diagram_list.includes(diagram_use)){
    diagram_list.push(diagram_use);
    localStorage.setItem("diagrams",JSON.stringify(diagram_list));
  }
  localStorage.setItem("diag_"+diagram_use, str);
}



function delete_diagram() {
  var diagram_use = document.getElementById("diagramName").value;
  // var str = myDiagram.model.toJson();
  // document.getElementById("mySavedModel").value = str;
  if (confirm("Are you sure you want to delete the diagram \"" + diagram_use + "\"? This is not reversible.")) {
    var i = diagram_list.findIndex(elem => elem == diagram_use);
    if (i >= 0){
      var last_diagram = localStorage.getItem("lastUsedDiagram");
      if(last_diagram == diagram_use){
        localStorage.removeItem("lastUsedDiagram");
      }
      diagram_list.splice(i,1);
      localStorage.setItem("diagrams",JSON.stringify(diagram_list));
      localStorage.removeItem("diag_" + diagram_use);
      refresh_saved_diagram_dropdown();
      document.getElementById("saved_diagrams").selectedIndex = -1;
      document.getElementById("diagramName").value = "unnamed";
    }
  }
}

function retrieve_diagram() {
  var diagram_use = document.getElementById("diagramName").value;
  localStorage.setItem("lastUsedDiagram", diagram_use);
  var str = localStorage.getItem("diag_"+diagram_use);
  document.getElementById("mySavedModel").value = str;
  myDiagram.model = go.Model.fromJson(str);
}

function download_graphs(){
  var diagrams = {};
  for(var i = 0; i < diagram_list.length; i++){
    var diag_name = diagram_list[i];
    var diag_data = localStorage.getItem("diag_"+diag_name);
    diagrams[diag_name] = diag_data;
  }
  var fileName = "CitationGraph.json";
  var content = JSON.stringify(diagrams);
  var a = document.createElement("a");
  var file = new Blob([content], {type: 'text/plain'});
  a.href = URL.createObjectURL(file);
  a.download = fileName;
  a.click();
}

function show_bibfile_upload(){
  var x = document.getElementById("bibfileUploadContainer");
  if (x.style.display === "none") {
    x.style.display = "block";
  } else {
    x.style.display = "none";
  }
}
function show_diagram_code(){
  var x = document.getElementById("mySavedModelContainer");
  if (x.style.display === "none") {
    x.style.display = "block";
  } else {
    x.style.display = "none";
  }
}

function upload_graphs(){
  var x = document.getElementById("uploadContainer");
  if (x.style.display === "none") {
    x.style.display = "block";
  } else {
    x.style.display = "none";
  }
}

function load_diagram_from_code() {
  var str = document.getElementById("mySavedModel").value;
  myDiagram.model = go.Model.fromJson(str);
}

function update_diagram_name(){
  document.getElementById("diagramName").value = document.getElementById("saved_diagrams").value;
  retrieve_diagram();
}


function removeOptions(selectElement) {
   var i, L = selectElement.options.length - 1;
   for(i = L; i >= 0; i--) {
      selectElement.remove(i);
   }
}

function refresh_saved_diagram_dropdown(){
  removeOptions(document.getElementById("saved_diagrams"));
  var saved_diagrams = document.getElementById("saved_diagrams");
  for (var i = 0; i < diagram_list.length; i++) {
    var option = document.createElement("option");
    option.text = diagram_list[i];
    option.value = diagram_list[i];
    saved_diagrams.add(option);
  }
}

var test_stuff;
function init() {

  // Check if diagrams have been initialized, if not, add the default one
  if(localStorage.getItem("diagrams") == null){
    localStorage.setItem("diagrams", JSON.stringify(["unnamed"]));
  }
  diagram_list = JSON.parse(
    localStorage.getItem("diagrams")
  );
  refresh_saved_diagram_dropdown();
  

  document.getElementById('CGjsonfile').onchange = function(){
    var file = this.files[0];
    var fr = new FileReader();
    // console.log(file);
    var fr = new FileReader();
    fr.onload = function(e) {
      var new_diagrams = JSON.parse(e.target.result);
      test_stuff = new_diagrams;
      var diagram_names = Object.keys(new_diagrams);
      localStorage.setItem("diagrams", JSON.stringify(diagram_names));
      for(var i = 0; i < diagram_names.length; i++){
        var diagram_name = diagram_names[i];
        var diagram_str = new_diagrams[diagram_name];
        localStorage.setItem("diag_" + diagram_name, (diagram_str));
        console.log(diagram_str);
      }
    };
    fr.readAsText(file);
    alert("Success!");
    var x = document.getElementById("uploadContainer");
    x.style.display = "none";
  }

  // Parse the bibfile upload for the bibkeys
  document.getElementById('bibfile').onchange = function(){
    var file = this.files[0];

    var reader = new FileReader();

    reader.onload = function(progressEvent){
      var lines = this.result.split('\n');
      var lastbibkey;
      for(var line = 0; line < lines.length; line++){
        var str = lines[line]
        var bibkeyRegExp = new RegExp(/@\w*{\w*,/i); // find the citekey of the form '@ARTICLE{citekey,....'
        var titleRegExp = new RegExp(/\btitle = {\b.*/i);
        var authorRegExp = new RegExp(/\bauthor = {\b.*/i);
        var yearRegExp = new RegExp(/\byear = {\b.*/i);
    
        if(bibkeyRegExp.test(str)){
          str = str.match(bibkeyRegExp)[0]
          var bibkey = str.replace(/@\w*{/,'').replace(/,/,'');
          bibkeys.push(bibkey);
          lastbibkey = bibkey;
        }

        if(titleRegExp.test(str)){
          str = str.match(titleRegExp)[0].replace(/\btitle = {\b/,'').replace(/},/,'');
          titles[lastbibkey] = str;
        }

        if(authorRegExp.test(str)){
          str = str.match(authorRegExp)[0].replace(/\bauthor = {\b/,'').replace(/},/,'');
          // console.log(str);
          str = str.replace(/\b and \b/g,"\n");
          authors[lastbibkey] = str;
        }

        if(yearRegExp.test(str)){
          str = str.match(yearRegExp)[0].match(/\d+/)[0] // "3"
            // .replace(/\byear = {\b/,'').replace(/},/,'');
          years[lastbibkey] = str;
        }
      }
      bibkeys.sort();
      var ta = document.getElementById("bibkeys"); // TextArea
      ta.value = "";
      for(var i = 0; i < bibkeys.length;i++){
        ta.value += bibkeys[i] + "\n";
      }
    }; // closes the "reader.onload = function(progressEvent){"
    reader.readAsText(file);
  }; //closes the "document.getElementById('bibfile').onchange = function(){"





  
  if (window.goSamples) goSamples();  // init for these samples -- you don't need to call this


















  // DRAGGING CODEBLOCK from  https://gojs.net/latest/samples/htmlDragDrop.html
  //
  var dragged = null; // A reference to the element currently being dragged

  // highlight stationary nodes during an external drag-and-drop into a Diagram
  function highlight(node) {  // may be null
    var oldskips = myDiagram.skipsUndoManager;
    myDiagram.skipsUndoManager = true;
    myDiagram.startTransaction("highlight");
    if (node !== null) {
      myDiagram.highlight(node);
    } else {
      myDiagram.clearHighlighteds();
    }
    myDiagram.commitTransaction("highlight");
    myDiagram.skipsUndoManager = oldskips;
  }

  // This event should only fire on the drag targets.
  // Instead of finding every drag target,
  // we can add the event to the document and disregard
  // all elements that are not of class "draggable"
  document.addEventListener("dragstart", function(event) {
    if (event.target.className !== "draggable") return;
    // Some data must be set to allow drag
    event.dataTransfer.setData("text", event.target.textContent);

    // store a reference to the dragged element and the offset of the mouse from the center of the element
    dragged = event.target;
    dragged.offsetX = event.offsetX - dragged.clientWidth / 2;
    dragged.offsetY = event.offsetY - dragged.clientHeight / 2;
    // Objects during drag will have a red border
    event.target.style.border = "2px solid red";
  }, false);

  // This event resets styles after a drag has completed (successfully or not)
  document.addEventListener("dragend", function(event) {
    // reset the border of the dragged element
    dragged.style.border = "";
    highlight(null);
  }, false);

  // Next, events intended for the drop target - the Diagram div

  var div = document.getElementById("myDiagramDiv");
  div.addEventListener("dragenter", function(event) {
    // Here you could also set effects on the Diagram,
    // such as changing the background color to indicate an acceptable drop zone

    // Requirement in some browsers, such as Internet Explorer
    event.preventDefault();
  }, false);

  div.addEventListener("dragover", function(event) {
    // We call preventDefault to allow a drop
    // But on divs that already contain an element,
    // we want to disallow dropping

    if (this === myDiagram.div) {
      var can = event.target;
      var pixelratio = 1;

      // if the target is not the canvas, we may have trouble, so just quit:
      if (!(can instanceof HTMLCanvasElement)) return;

      var bbox = can.getBoundingClientRect();
      var bbw = bbox.width;
      if (bbw === 0) bbw = 0.001;
      var bbh = bbox.height;
      if (bbh === 0) bbh = 0.001;
      var mx = event.clientX - bbox.left * ((can.width / pixelratio) / bbw);
      var my = event.clientY - bbox.top * ((can.height / pixelratio) / bbh);
      var point = myDiagram.transformViewToDoc(new go.Point(mx, my));
      var curnode = myDiagram.findPartAt(point, true);
      if (curnode instanceof go.Node) {
        highlight(curnode);
      } else {
        highlight(null);
      }
    }

    if (event.target.className === "dropzone") {
      // Disallow a drop by returning before a call to preventDefault:
      return;
    }

    // Allow a drop on everything else
    event.preventDefault();
  }, false);

  div.addEventListener("dragleave", function(event) {
    // reset background of potential drop target
    if (event.target.className == "dropzone") {
      event.target.style.background = "";
    }
    highlight(null);
  }, false);

  // handle the user option for removing dragged items from the Palette
  var remove = document.getElementById('remove');

  div.addEventListener("drop", function(event) {
    // prevent default action
    // (open as link for some elements in some browsers)
    event.preventDefault();

    // Dragging onto a Diagram
    if (this === myDiagram.div) {
      var can = event.target;
      var pixelratio = 1;

      // if the target is not the canvas, we may have trouble, so just quit:
      if (!(can instanceof HTMLCanvasElement)) return;

      var bbox = can.getBoundingClientRect();
      var bbw = bbox.width;
      if (bbw === 0) bbw = 0.001;
      var bbh = bbox.height;
      if (bbh === 0) bbh = 0.001;
      var mx = event.clientX - bbox.left * ((can.width / pixelratio) / bbw) - dragged.offsetX;
      var my = event.clientY - bbox.top * ((can.height / pixelratio) / bbh) - dragged.offsetY;
      var point = myDiagram.transformViewToDoc(new go.Point(mx, my));
      // console.log(Math.round(point['x'])+' '+Math.round(point['y']));

      myDiagram.startTransaction('new node');
      myDiagram.model.addNodeData({
        location: point['x']+' '+point['y'],
        // x: point['x'],
        // y: point['y'],
        // location: point,
        text: event.dataTransfer.getData('text'),
        color: "lightyellow"
      });
      myDiagram.commitTransaction('new node');

    }

    // If we were using drag data, we could get it here, ie:
    // var data = event.dataTransfer.getData('text');
  }, false);

  // END OF DRAGGING CODEBLOCK
















  var $ = go.GraphObject.make;  // for conciseness in defining templates

  myDiagram =
    $(go.Diagram, "myDiagramDiv",  // create a Diagram for the DIV HTML element
      {
        // allow double-click in background to create a new node
        "clickCreatingTool.archetypeNodeData": { text: "Node", color: "white" },

        // allow Ctrl-G to call groupSelection()
        "commandHandler.archetypeGroupData": { text: "Group", isGroup: true, color: "blue" },

        // enable undo & redo
        "undoManager.isEnabled": true
      });

  // Define the appearance and behavior for Nodes:

  // First, define the shared context menu for all Nodes, Links, and Groups.

  // To simplify this code we define a function for creating a context menu button:
  function makeButton(text, action, visiblePredicate) {
    return $("ContextMenuButton",
      $(go.TextBlock, text),
      { click: action },
      // don't bother with binding GraphObject.visible if there's no predicate
      visiblePredicate ? new go.Binding("visible", "", function(o, e) { return o.diagram ? visiblePredicate(o, e) : false; }).ofObject() : {});
  }


  function toggleColor(){
    myDiagram.startTransaction("Change Color");
    var node = myDiagram.selection.first();
    var curr_color = node.findObject("SHAPE").fill;
    // console.log(curr_color);
    if(curr_color === "lightyellow"){
      curr_color = "lightblue";
    }else if(curr_color === "lightblue"){
      curr_color = "white";
    }else{
      curr_color = "lightyellow";
    }
    node.findObject("SHAPE").fill = curr_color;
    myDiagram.commitTransaction("Change Color");
  }
  function changeTextSize(factor) {
    // Originally from
    // https://gojs.net/latest/samples/mindMap.html

    // var adorn = obj.part;
    // var adorn = e;
    // e.diagram.startTransaction("Change Text Size");
    myDiagram.startTransaction("Change Text Size");
    var node = myDiagram.selection.first();
    // var node = adorn.adornedPart;
    // var tb = node.findObject("TEXT");
    // // console.log(node);
    // tb.scale *= factor;
    node.findObject("TEXT").scale *= factor;
    myDiagram.commitTransaction("Change Text Size");
  }
  

  // a context menu is an Adornment with a bunch of buttons in them
  var partContextMenu =
    $("ContextMenu",
      makeButton("Properties",
        function(e, obj) {  // OBJ is this Button
          var contextmenu = obj.part;  // the Button is in the context menu Adornment
          var part = contextmenu.adornedPart;  // the adornedPart is the Part that the context menu adorns
          // now can do something with PART, or with its data, or with the Adornment (the context menu)
          if (part instanceof go.Link) alert(linkInfo(part.data));
          else if (part instanceof go.Group) alert(groupInfo(contextmenu));
          else alert(nodeInfo(part.data));
        }),
      makeButton("Bigger",
        function(e,obj) {changeTextSize(2);}),
      makeButton("Smaller",
        function(e,obj) {changeTextSize(1/2);}),
      makeButton("Cut",
        function(e, obj) { e.diagram.commandHandler.cutSelection(); },
        function(o) { return o.diagram.commandHandler.canCutSelection(); }),
      makeButton("Copy",
        function(e, obj) { e.diagram.commandHandler.copySelection(); },
        function(o) { return o.diagram.commandHandler.canCopySelection(); }),
      makeButton("Paste",
        function(e, obj) { e.diagram.commandHandler.pasteSelection(e.diagram.toolManager.contextMenuTool.mouseDownPoint); },
        function(o) { return o.diagram.commandHandler.canPasteSelection(o.diagram.toolManager.contextMenuTool.mouseDownPoint); }),
      makeButton("Delete",
        function(e, obj) { e.diagram.commandHandler.deleteSelection(); },
        function(o) { return o.diagram.commandHandler.canDeleteSelection(); }),
      makeButton("Undo",
        function(e, obj) { e.diagram.commandHandler.undo(); },
        function(o) { return o.diagram.commandHandler.canUndo(); }),
      makeButton("Redo",
        function(e, obj) { e.diagram.commandHandler.redo(); },
        function(o) { return o.diagram.commandHandler.canRedo(); }),
      makeButton("Group",
        function(e, obj) { e.diagram.commandHandler.groupSelection(); },
        function(o) { return o.diagram.commandHandler.canGroupSelection(); }),
      makeButton("Ungroup",
        function(e, obj) { e.diagram.commandHandler.ungroupSelection(); },
        function(o) { return o.diagram.commandHandler.canUngroupSelection(); })
    );

  function nodeInfo(d) {  // Tooltip info for a node data object
    var str = "Node " + d.key + ": " + d.text + "\n";
    if (d.group)
      str += "member of " + d.group;
    else
      str += "top-level node";
    return str;
  }

  // These nodes have text surrounded by a rounded rectangle
  // whose fill color is bound to the node data.
  // The user can drag a node by dragging its TextBlock label.
  // Dragging from the Shape will start drawing a new link.
  myDiagram.nodeTemplate =
    $(go.Node, "Auto",
      { locationSpot: go.Spot.Center },
      new go.Binding("location", "location", go.Point.parse).makeTwoWay(go.Point.stringify),
      // new go.Binding("location", "location", go.Point.parse),
      $(go.Shape, "RoundedRectangle",
        {
          name: "SHAPE",
          fill: "white", // the default fill, if there is no data bound value
          portId: "", cursor: "pointer",  // the Shape is the port, not the whole Node
          // allow all kinds of links from and to this port
          fromLinkable: true, fromLinkableSelfNode: false, fromLinkableDuplicates: true,
          toLinkable: true, toLinkableSelfNode: false, toLinkableDuplicates: true
        },
        new go.Binding("fill", "color")),
      $(go.TextBlock,
        {
          name: "TEXT", // This is to make the "changeTextSize" function work
          font: "bold 14px Palatino, serif",
          stroke: '#333',
          margin: 10,  // make some extra space for the shape around the text
          isMultiline: true,  // don't allow newlines in text
          editable: true  // allow in-place editing by user
        },
        new go.Binding("text", "text").makeTwoWay(),  // the label shows the node data's text
        new go.Binding("scale", "scale").makeTwoWay()),
      { // this tooltip Adornment is shared by all nodes
        toolTip:
          $("ToolTip",
            $(go.TextBlock, { margin: 4 },  // the tooltip shows the result of calling nodeInfo(data)
              new go.Binding("text", "", nodeInfo))
          ),
        // this context menu Adornment is shared by all nodes
        contextMenu: partContextMenu
      }
    );

  // Define the appearance and behavior for Links:

  function linkInfo(d) {  // Tooltip info for a link data object
    return "Link:\nfrom " + d.from + " to " + d.to;
  }

  // The link shape and arrowhead have their stroke brush data bound to the "color" property
  myDiagram.linkTemplate =
    $(go.Link,
      { toShortLength: 3, relinkableFrom: true, relinkableTo: true },  // allow the user to relink existing links
      $(go.Shape,
        { strokeWidth: 2 },
        new go.Binding("stroke", "color")),
      $(go.Shape,
        { toArrow: "Standard", stroke: null },
        new go.Binding("fill", "color")),
      { // this tooltip Adornment is shared by all links
        toolTip:
          $("ToolTip",
            $(go.TextBlock, { margin: 4 },  // the tooltip shows the result of calling linkInfo(data)
              new go.Binding("text", "", linkInfo))
          ),
        // the same context menu Adornment is shared by all links
        contextMenu: partContextMenu
      }
    );

  // Define the appearance and behavior for Groups:

  function groupInfo(adornment) {  // takes the tooltip or context menu, not a group node data object
    var g = adornment.adornedPart;  // get the Group that the tooltip adorns
    var mems = g.memberParts.count;
    var links = 0;
    g.memberParts.each(function(part) {
      if (part instanceof go.Link) links++;
    });
    return "Group " + g.data.key + ": " + g.data.text + "\n" + mems + " members including " + links + " links";
  }

  // Groups consist of a title in the color given by the group node data
  // above a translucent gray rectangle surrounding the member parts
  myDiagram.groupTemplate =
    $(go.Group, "Vertical",
      {
        selectionObjectName: "PANEL",  // selection handle goes around shape, not label
        ungroupable: true  // enable Ctrl-Shift-G to ungroup a selected Group
      },
      //$(go.TextBlock, // DISABLE TEXT FOR GROUPS
      //  {
      //    //alignment: go.Spot.Right,
      //    font: "bold 19px sans-serif",
      //    isMultiline: false,  // don't allow newlines in text
      //    editable: true  // allow in-place editing by user
      //  },
      //  new go.Binding("text", "text").makeTwoWay(),
      //  new go.Binding("stroke", "color")),
      $(go.Panel, "Auto",
        { name: "PANEL" },
        $(go.Shape, "Rectangle",  // the rectangular shape around the members
          {
            fill: "rgba(128,128,128,0.2)", stroke: "gray", strokeWidth: 3,
            portId: "", cursor: "pointer",  // the Shape is the port, not the whole Node
            // allow all kinds of links from and to this port
            fromLinkable: true, fromLinkableSelfNode: true, fromLinkableDuplicates: true,
            toLinkable: true, toLinkableSelfNode: true, toLinkableDuplicates: true
          }),
        $(go.Placeholder, { margin: 10, background: "transparent" })  // represents where the members are
      ),
      { // this tooltip Adornment is shared by all groups
        toolTip:
          $("ToolTip",
            $(go.TextBlock, { margin: 4 },
              // bind to tooltip, not to Group.data, to allow access to Group properties
              new go.Binding("text", "", groupInfo).ofObject())
          ),
        // the same context menu Adornment is shared by all groups
        contextMenu: partContextMenu
      }
    );

  // Define the behavior for the Diagram background:

  function diagramInfo(model) {  // Tooltip info for the diagram's model
    return "Model:\n" + model.nodeDataArray.length + " nodes, " + model.linkDataArray.length + " links";
  }

  // provide a tooltip for the background of the Diagram, when not over any Part
  myDiagram.toolTip =
    $("ToolTip",
      $(go.TextBlock, { margin: 4 },
        new go.Binding("text", "", diagramInfo))
    );

  // provide a context menu for the background of the Diagram, when not over any Part
  myDiagram.contextMenu =
    $("ContextMenu",
      makeButton("Paste",
        function(e, obj) { e.diagram.commandHandler.pasteSelection(e.diagram.toolManager.contextMenuTool.mouseDownPoint); },
        function(o) { return o.diagram.commandHandler.canPasteSelection(o.diagram.toolManager.contextMenuTool.mouseDownPoint); }),
      makeButton("Undo",
        function(e, obj) { e.diagram.commandHandler.undo(); },
        function(o) { return o.diagram.commandHandler.canUndo(); }),
      makeButton("Redo",
        function(e, obj) { e.diagram.commandHandler.redo(); },
        function(o) { return o.diagram.commandHandler.canRedo(); })
    );

  // Create the Diagram's Model:
  var nodeDataArray = [ ];
  var linkDataArray = [ ];
  myDiagram.model = new go.GraphLinksModel(nodeDataArray, linkDataArray);


myDiagram.commandHandler.doKeyDown = function() {
  var e = myDiagram.lastInput;
  var cmd = myDiagram.commandHandler;
  if (e.key === "K") {  // could also check for e.control or e.shift
    if(myDiagram.selection.first()!=null){
      changeTextSize(2);
    }
  }else if (e.key === "J") {  // could also check for e.control or e.shift
    if(myDiagram.selection.first()!=null){
      changeTextSize(1/2);
    }
  }else if (e.key === "H") {
    if(myDiagram.selection.first()!=null){
      toggleColor();
    }
  }else{
    // call base method with no arguments
    go.CommandHandler.prototype.doKeyDown.call(cmd);
  }
};
  




  var last_diagram = localStorage.getItem("lastUsedDiagram");
  if(last_diagram){ // if this variable has been set
    document.getElementById("diagramName").value = last_diagram;
    retrieve_diagram();
  }
  document.getElementById("saved_diagrams").selectedIndex = -1;

  // autosave every minute
  setInterval(function() {
    if(document.getElementById("autosave").checked){
      save_diagram();
    }
  }, 60 * 1000); // 60 * 1000 milsec



}
