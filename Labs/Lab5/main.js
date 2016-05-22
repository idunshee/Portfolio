var keyArray = ["Pop82C","Pop90C","Pop99C","Pop07Est","Pop13Est"]; //array of property keys
var expressed = keyArray[0]; //initial attribute
var key = "ID_2";
var counties;


//begin script when window loads
window.onload = initialize();

//the first function called once the html is loaded
function initialize(){
  setMap();
};


function setMap(){

  var map = new L.map('map').setView([14.641528, -61.024174], 9)

  .addLayer(new L.TileLayer("http://stamen-tiles-{s}.a.ssl.fastly.net/watercolor/{z}/{x}/{y}.png"));

  var svg = d3.select(map.getPanes().overlayPane).append("svg"),
  g = svg.append("g").attr("class", "leaflet-zoom-hide");


  d3.json("MartPop.json", function(error, jsonData) {
    if (error) throw error;

    //add Iowa counties geometry to map
    var transform = d3.geo.transform({point: projectPoint}),
    path = d3.geo.path().projection(transform);

    var recolorMap = colorScale(jsonData.features);

    counties = g.selectAll("path")
    .data(jsonData.features)
    .enter().append("path").attr("class", "counties") //assign class for styling
    .attr("id", function(d) {
      return d.properties[key]})
    .attr("d", path) //project data as geometry in svg
    .style("fill", function(d) { //color enumeration units
      return choropleth(d, recolorMap);
    });
    // .on("mouseover", highlight)
    // .on("mouseout", dehighlight)
    // .append("desc") //append the current color
    // .text(function(d) {
    //    return choropleth(d, recolorMap);
    //  });

    map.on("viewreset", reset);
    reset();

    createDropdown(jsonData); //create the dropdown menu

    // Reposition the SVG to cover the features.
    function reset() {

      var bounds = path.bounds(jsonData),
      topLeft = bounds[0],
      bottomRight = bounds[1];

      console.log(bounds);

      svg.attr("width", bottomRight[0] - topLeft[0])
      .attr("height", bottomRight[1] - topLeft[1])
      .style("left", topLeft[0] + "px")
      .style("top", topLeft[1] + "px");

      g.attr("transform", "translate(" + -topLeft[0] + "," + -topLeft[1] + ")");

      counties.attr("d", path);
    }

    // Use Leaflet to implement a D3 geometric transformation.
    function projectPoint(x, y) {
      var point = map.latLngToLayerPoint(new L.LatLng(y, x));
      this.stream.point(point.x, point.y);
    }

  });
}

function createDropdown(jsonData){
  //add a select element for the dropdown menu
  var dropdown = d3.select("body")
  .append("div")
  .attr("class","dropdown") //for positioning menu with css
  .html("<h3>Select Variable:</h3>")
  .append("select")
  .on("change", function(){ changeAttribute(this.value, jsonData) }); //changes expressed attribute

  //create each option element within the dropdown
  dropdown.selectAll("options")
  .data(keyArray)
  .enter()
  .append("option")
  .attr("value", function(d){ return d })
  .text(function(d) {
    d = d[0].toUpperCase() + d.substring(1,3) + " " + d.substring(3);
    return d
  });
};

function colorScale(features){

  //create quantile classes with color scale
  var color = d3.scale.quantile() //designate quantile scale generator
  .range([
  "#D4B9DA",
  "#C994C7",
  "#DF65B0",
  "#DD1C77",
  "#980043"
  ]);

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

  //recolor the map
  d3.selectAll(".counties") //select every region
  .style("fill", function(d) { //color enumeration units
    return choropleth(d, colorScale(jsonData.features)); //->
  })
  .select("desc") //replace the color text in each region's desc element
  .text(function(d) {
    return choropleth(d, colorScale(jsonData.features)); //->
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
  console.log(props[key])
  d3.select("#"+props[key]) //select the current region in the DOM
  .style("fill", "#000"); //set the enumeration unit fill to black

  var labelAttribute = "<h1>"+props[expressed]+
  "</h1><br><b>"+expressed+"</b>"; //label content
  var labelName = props.name //html string for name to go in child div

  //create info label div
  var infolabel = d3.select("body")
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
  var region = d3.select("#"+props[key]); //select the current region
  var fillcolor = region.select("desc").text(); //access original color from desc
  region.style("fill", fillcolor); //reset enumeration unit to orginal color

  d3.select("#"+props[key]+"label").remove(); //remove info label
};
