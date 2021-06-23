var margin = {top: 10, right: 30, bottom: 30, left: 60},
    width = 460 - margin.left - margin.right,
    height = 400 - margin.top - margin.bottom;

var svg = d3.select(".myData")
  .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform",
          "translate(" + margin.left + "," + margin.top + ")");
d3.csv("world_co2.csv", data => {
    var dict = data[0];
    console.log(data.Year);
    var parseData = [];
    Object.keys(dict).forEach(function(key){
        if (key != "Year"){
            entry = {"year":+key, "emission":+dict[key]/1000};
            parseData.push(entry);
            // console.log("Parsed data: ", parseData);
        }
    })
    var x = d3.scaleLinear()
      .domain(d3.extent(parseData, function(d) { return d.year; }))
      .range([ 0, width ]);
  svg.append("g")
      .attr("transform", "translate(0," + height + ")")
      .call(d3.axisBottom(x));
    var y = d3.scaleLinear()
      .domain([0, d3.max(parseData, function(d) { return + d.emission; })])
      .range([ height, 0 ]);
    svg.append("g")
      .call(d3.axisLeft(y));

    svg.append("path")
      .datum(parseData)
      .attr("fill", "none")
      .attr("stroke", "steelblue")
      .attr("stroke-width", 2)
      .attr("d", d3.line()
        .x(function(d) { return x(d.year) })
        .y(function(d) { return y(d.emission) })
        )

})