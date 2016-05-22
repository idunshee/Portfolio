//set the colors and the id field
var initialColors = [
  "#D4B9DA",
  "#C994C7",
  "#DF65B0",
  "#DD1C77",
  "#980043"
];
var key = "NAME_2";
//var key might also be "FID" if this one doesn't work


var attNames = [];
var pcpdata = [];
var expressed; //initial attribute
var regions;

//begin script when window loads
window.onload = initialize();

//the first function called once the html is loaded
function initialize(){
  setMap();
};


function setMap(){

  var map = new L.map('map').setView([14.641528, -61.024174], 9)
  .addLayer(new L.TileLayer("http://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png"));

  var svg = d3.select(map.getPanes().overlayPane).append("svg"),
  g = svg.append("g").attr("class", "leaflet-zoom-hide");

  d3.json("MartPopCut_PctC.json", function(error, jsonData) {
    if (error) throw error;


    var cnt = 0;
    //create an attribute array (pcpdata) an populate the array using the attributes in json
    //to plug into the parallel coordinates
    jsonData.features.forEach(function(d){
      //attribute names are derived from properties of the first json object
      // so that the dropdown list could be populated
      if(cnt == 0){
        var att = d3.entries(d.properties);
        for ( var a in att) {
          if(att[a].key != key){
            attNames.push(att[a].key);
          }
        }
      }
      cnt++;
      pcpdata.push(d.properties);
    });

    expressed = attNames[0];

    var recolorMap = colorScale(jsonData.features);

    //add Iowa regions geometry to map
    var transform = d3.geo.transform({point: projectPoint}),
    path = d3.geo.path().projection(transform);

    regions = g.selectAll(".regions")
    .data(jsonData.features)
    .enter().append("path").attr("class", "regions") //assign class for styling
    .attr("id", function(d) {
      //id must begin with a letter
      return "id" + d.properties[key] })
      .attr("d", path) //project data as geometry in svg
      .style("fill", function(d) { //color enumeration units
        return choropleth(d, recolorMap);
      })

    //THE CHALLENGE
    //function highlightPCPlines () {
    //END OF THE CHALLENGE

      .on("mouseover", highlight)
      .on("mouseout", dehighlight);
      //.on("mousemove", moveLabel)
       //.append("desc"); //append the current color
       //.text(function(d) {
         //return choropleth(d, recolorMap);
       //});

      map.on("viewreset", reset);
      reset();

      createDropdown(jsonData); //create the dropdown menu

      // Reposition the SVG to cover the features.
      function reset() {
        var bounds = path.bounds(jsonData),
        topLeft = bounds[0],
        bottomRight = bounds[1];

        svg.attr("width", bottomRight[0] - topLeft[0])
        .attr("height", bottomRight[1] - topLeft[1])
        .style("left", topLeft[0] + "px")
        .style("top", topLeft[1] + "px");

        g.attr("transform", "translate(" + -topLeft[0] + "," + -topLeft[1] + ")");

        regions.attr("d", path);
      }

      // Use Leaflet to implement a D3 geometric transformation.
      function projectPoint(x, y) {
        var point = map.latLngToLayerPoint(new L.LatLng(y, x));
        this.stream.point(point.x, point.y);
      }

      //visualize pcp
      var format = d3.format(".4n"), scale = d3.scale.linear().domain(
        [ -10, 20, 1000 ]).range([ 0, 800, 1000 ]);


        var pcp = d3.parcoords()("#pcp").data(pcpdata).color(function(d) {
          //if value exists, assign it a color; otherwise assign gray
          if (d[expressed]) {
            return recolorMap(d[expressed]); //recolorMap holds the colorScale generator
          } else {
            return "#ccc";
          };
        }).render().brushable().on("brush", function(items) {
          var selected = items.map(function(d) {
            return d[key];
          });
          regions.style("opacity", 0.2).filter(function(d) {
            return selected.indexOf(d.properties[key]) > -1;
          }).style("opacity", 1);
        });

      });

    }

    function createDropdown(jsonData){
      //add a select element for the dropdown menu
      var dropdown = d3.select("#legend")
      .append("div")
      .html("<h3>Select Variable:</h3>")
      .append("select")
      .on("change", function(){ changeAttribute(this.value, jsonData) }); //changes expressed attribute

      //create each option element within the dropdown
      dropdown.selectAll("options")
      .data(attNames)
      .enter()
      .append("option")
      .attr("value", function(d){ return d })
      .text(function(d) {
        d = d[0].toUpperCase() + d.substring(1,3) + d.substring(3);
        return d;
      });
    };

    function colorScale(features){

      //create quantile classes with color scale
      var color = d3.scale.quantile() //designate quantile scale generator
      .range(initialColors);

      //build array of all currently expressed values for input domain
      var domainArray = [];

      for (var a=0; a<features.length; a++){
        domainArray.push(Number(features[a].properties[expressed]));
      }

      //pass array of expressed values as domain
      color.domain(domainArray);

      return color;	 //return the color scale generator
    };

    function choropleth(d, recolorMap){
      //get data value
      var value = d.properties[expressed];
      //if value exists, assign it a color; otherwise assign gray
      if (value) {
        return recolorMap(value); //recolorMap holds the colorScale generator
      } else {
        return "#ccc";
      };
    };

    function changeAttribute(attribute, jsonData){
      //change the expressed attribute
      expressed = attribute;
      var recolorMap = colorScale(jsonData.features);

      //recolor the map
      d3.selectAll(".regions")//select every region
      .style("fill", function(d) { //color enumeration units
        return choropleth(d, recolorMap); //->
      }).style("opacity", 1)
      .select("desc") //replace the color text in each region's desc element
      .text(function(d) {
        return choropleth(d, recolorMap); //->
      });

      //remove the previous pcp so that they are not drawn on top of each other
      d3.select("#pcp").selectAll("*").remove();
      var pcp = d3.parcoords()("#pcp").data(pcpdata).color(function(d) {
        //if value exists, assign it a color; otherwise assign gray
        if (d[expressed]) {
          return recolorMap(d[expressed]); //recolorMap holds the colorScale generator
        } else {
          return "#ccc";
        };
      }).render().brushable().on("brush", function(items) {
        var selected = items.map(function(d) {
          return d[key];
        });
        regions.style("opacity", 0.2).filter(function(d) {
          return selected.indexOf(d.properties[key]) > -1;
        }).style("opacity", 1);
      });

    };

    function format(value){

      //format the value's display according to the attribute
      if (expressed != "Population"){
        value = "$"+roundRight(value);
      } else {
        value = roundRight(value);
      };

      return value;
    };

    function roundRight(number){

      if (number>=100){
        var num = Math.round(number);
        return num.toLocaleString();
      } else if (number<100 && number>=10){
        return number.toPrecision(4);
      } else if (number<10 && number>=1){
        return number.toPrecision(3);
      } else if (number<1){
        return number.toPrecision(2);
      };
    };

    function highlight(data){

      var props = data.properties; //json properties
       //d3.selectAll("#id"+props[key]) //select the current region in the DOM
       //.style("fill", "#000"); //set the enumeration unit fill to black

      var labelAttribute = "<h1>"+props[expressed]+
      "</h1><br><b>"+expressed+"</b>"; //label content
      var labelName = props[key] //html string for name to go in child div

      // d3.select("#info-label").selectAll("*").remove();
      //create info label div
      var infolabel = d3.select("#info-label")
      .append("div") //create the label div
      .attr("class", "infolabel")
      .attr("id", props[key]+"label") //for styling label
      .html(labelAttribute) //add text
      .append("div") //add child div for feature name
      .attr("class", "labelname") //for styling name
      .html(labelName); //add feature name to label
    };

    function dehighlight(data){

      var props = data.properties; //json properties
      //var region = d3.selectAll("#id"+props[key]); //select the current region
       //var fillcolor = region.select("desc").text(); //access original color from desc
       //region.style("fill", fillcolor); //reset enumeration unit to orginal color

      d3.select("#id"+props[key]+"label").remove(); //remove info label
      d3.select("#info-label").selectAll("*").remove();
    };

    function moveLabel() {

      var x = d3.event.clientX+10; //horizontal label coordinate based mouse position stored in d3.event
      var y = d3.event.clientY-75; //vertical label coordinate
      d3.select(".infolabel") //select the label div for moving
      .style("margin-left", x+"px") //reposition label horizontal
      .style("margin-top", y+"px"); //reposition label vertical
    };
