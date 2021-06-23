const visualView = d3.select(".visualisation")
  .node()
  .parentNode
  .getBoundingClientRect();

// Initial set ups for map: margin: 90, width, height, aspect, rotate
// var margin = {top: 10, right: 30, bottom: 30, left: 60},
//     width = 460 - margin.left - margin.right,
//     height = 400 - margin.top - margin.bottom;
const margin = 90;
const wdth = visualView.width;
const hght = 500;
const aspect = wdth / (hght - margin);
const rotate = -9.9;


const lookUp = d3.zoom()
  .scaleExtent([1, 30])
  .translateExtent([[0,0],[wdth, hght]])
  .on('zoom', function () {
      d3.select('g').attr('transform', d3.event.transform)
    });

// make initial svg container with 
// given properties for Map
const svg = d3.select(".visualisation")
  .append("svg")
  .attr("width", wdth)
  .attr("height", hght)
  .attr("preserveAspectRatio", "xMinYMin meet")
  .attr("viewBox", `0 0 ${wdth} ${hght}`)
  .call(lookUp);

// For Line Chart create another svg
// var svg2 = d3.select(".myData")
//   .append("svg")
//     .attr("width", width + margin.left + margin.right)
//     .attr("height", height + margin.top + margin.bottom)
//   .append("g")
//     .attr("transform",
//           "translate(" + margin.left + "," + margin.top + ")");

const outer = svg.append("g");

const tooltip = d3.select('.visualisation').append('div')
  .attr('class', 'hidden tooltip');

const projection = d3.geoMercator()
  .rotate([rotate,0])
  .scale(hght / (1.4 * Math.PI))
  .translate([wdth / 2, (hght - margin) / 1.2]);

const path = d3.geoPath()
  .projection(projection);

const colorScale = d3.scaleSqrt(["#ddd", "#777" ,"#000"]);

const map = {};


// Each time metrics change data changes 
// If the case active then show active cases
// If it is the case of deaths then show death statistics
Promise.all([
    d3.json('./worldpandemic.topojson'),
    d3.json('./countries.json'),
]).then(function([shapes, data]) {
    var shapes = topojson.feature(shapes, "world");
    console.log("Shapes: ", shapes);
    console.log("Data: ", data);
    // Antacrtic is removed
    // No cases at all there so removed
    map.features = shapes.features.filter((d) => d.properties.ISO_A3 !== "ATA");
    map.data = data;
    map.metric = d3.select("#metrics").property("value");
    selectData();
    console.log("Data: ", data);
    colorScale.domain([0, 
      d3.median(map.features, d => d.properties.dataPoint),
      d3.max(map.features, d => d.properties.dataPoint)]);
    drawChart();
    functionDraw();
    d3.select("#metrics").on("change",change);

});


function selectData() {
  map.features.forEach((d) => {
    var init = map.data.filter(t => t.countryInfo.iso3 == d.properties.ISO_A3)[0];
    if(init) {
      d.properties.dataPoint = init[map.metric];
      d.properties.country = init.country;
    } 
    else {
      d.properties.dataPoint = 0;
      d.properties.country = "Unknown";
    }
  })
};

// Draw the line chart
// d3.csv("world_co2.csv", data => {
//   var dict = data[0];
//   console.log(data.Year);
//   var parseData = [];
//   Object.keys(dict).forEach(function(key){
//       if (key != "Year"){
//           entry = {"year":+key, "emission":+dict[key]/1000};
//           parseData.push(entry);
//           // console.log("Parsed data: ", parseData);
//       }
//   })
//   var x = d3.scaleLinear()
//     .domain(d3.extent(parseData, function(d) { return d.year; }))
//     .range([ 0, width ]);
// svg.append("g")
//     .attr("transform", "translate(0," + height + ")")
//     .call(d3.axisBottom(x));
//   var y = d3.scaleLinear()
//     .domain([0, d3.max(parseData, function(d) { return + d.emission; })])
//     .range([ height, 0 ]);
//   svg.append("g")
//     .call(d3.axisLeft(y));

//   svg.append("path")
//     .datum(parseData)
//     .attr("fill", "none")
//     .attr("stroke", "steelblue")
//     .attr("stroke-width", 2)
//     .attr("d", d3.line()
//       .x(function(d) { return x(d.year) })
//       .y(function(d) { return y(d.emission) })
//       )

// })

function drawChart() {
  outer.selectAll("path.country").remove();
  outer.selectAll("path.country")
    .data(map.features)
    .enter()
    .append("path")
    .attr("class","country")
    .attr('d', path)
    .style("fill", d => colorScale(d.properties.dataPoint))
    .on('mousemove', function (d) {
      tooltip.classed('hidden', false)
        .html("<h6>" + d.properties.country + ": " + d.properties.dataPoint + "</h6>")
        .attr('style', 'left:' + (d3.event.pageX + 15) + 'px; top:' + (d3.event.pageY + 20) + 'px');
    })
      .on('mouseout', function () {
        tooltip.classed('hidden', true);
      });
};

function functionDraw() {
  svg.select(".legendLinear").remove();
  svg.append("g")
    .attr("class", "legendLinear")
    .attr("transform", "translate(10," + (hght - margin) + ")");

  var shapeWidth = 40,
    cellCount = 5,
    shapePadding = 2,
    legendTitle = map.metric.replace("PerOneMillion", "")  + " per million population: ";

  var legendLinear = d3.legendColor()
    .title(legendTitle)
    .shape("rect")
    .shapeWidth(shapeWidth)
    .cells(cellCount)
    .labelFormat(d3.format(".3s"))
    .orient('horizontal')
    .shapePadding(shapePadding)
    .scale(colorScale);

  svg.select(".legendLinear")
    .append("rect")
    .attr("class", "legendBackground")
    .attr("x", -5)
    .attr("y", -22)
    .attr("opacity", 0.9)
    .attr("rx", 8)
    .attr("ry", 8)
    .attr("width", legendTitle.length*7.4)
    .attr("height", margin);

  svg.select(".legendLinear")
    .call(legendLinear);
};

function change() {
  map.metric = d3.select("#metrics").property("value")
  selectData();
  colorScale.domain([0, 
    d3.median(map.features, d => d.properties.dataPoint),
    d3.max(map.features, d => d.properties.dataPoint)]);
  drawChart();
  functionDraw();
}

d3.select(window)
  .on("resize", function() {
    var targetWidth = d3.select(".visualisation").node().parentNode.getBoundingClientRect();
    svg.attr("width", targetWidth);
    svg.attr("height", targetWidth / aspect);
    svg.attr("viewBox", `0 0 ${wdth} ${hght}`)
  });