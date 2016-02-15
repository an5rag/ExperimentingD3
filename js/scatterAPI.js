/**
 * Created by an5ra on 2/14/2016.
 */

var xStart, yStart, xEnd, yEnd;
function drawScatter(options) {
    var container, brushable, data, xlabel, ylabel, title, brush;

    //Find an element to render the chart
    if ($(options['renderTo']) != undefined) {
        container = $(options['renderTo']);
    }
    else {
        console.log("Tried to render chart to an unknown or missing element!");
        return;
    }

    if ('brush' in options) {
        brushable = options['brush'];
    }
    else
        brushable = false;

    if ('data' in options) {
        data = options['data'];
    }
    else
        data = {};

    title = options['title'];
    xlabel = options['x-label'];
    ylabel = options['y-label'];

    // finding actual dimensions of div
    var heightOfDiv = container.innerHeight();
    //console.log(innerHeight);
    var widthOfDiv = container.innerWidth();
    //console.log(innerWidth);

    // finding relative point radius
    var radius = 4;

    // Setting margins as percentages
    var topMargin = heightOfDiv * 0.14;
    var bottomMargin = heightOfDiv * 0.1;
    var rightMargin = widthOfDiv * 0.08;
    var leftMargin = widthOfDiv * 0.09;

    var margin = {
            top: Math.ceil(topMargin),
            right: Math.ceil(rightMargin),
            bottom: Math.ceil(bottomMargin),
            left: Math.ceil(leftMargin)
        },
        width = widthOfDiv - margin.left - margin.right,
        height = heightOfDiv - margin.top - margin.bottom;


    //function to get x Value from data
    var xVals = function (d) {
        return d['x'];
    }

    //function to get y Value from data
    var yVals = function (d) {
        return d['y'];
    }

    //setting y-scale to fit in the svg window
    var yScale = d3.scale.linear()
        .domain([0, d3.max(data, yVals)])
        .range([height, 0]);

    //setting x-scale to fit in the svg window
    var xScale = d3.scale.linear()
        .domain([0, d3.max(data, xVals)])
        .range([0, width]);

    // AXES:
    // to change tick-sizes: .ticksize(inner, outer) where inner are the normal ticks and outer are the end ticks
    // here we are keeping the inner ticks to the default value of 6 and the outer to negative extremes to form a box

    var xAxis = d3.svg.axis()
        .scale(xScale)
        .orient("bottom")
        .tickSize(6, -height);


    var yAxis = d3.svg.axis()
        .scale(yScale)
        .orient("left")
        .tickSize(6, -width);


    // declaring brush
    var brush = d3.svg.brush()
        .x(d3.scale.identity().domain([0, width]))
        .y(d3.scale.identity().domain([0, height]))
        .on("brush", brushed);


    var svg = d3.select(options['renderTo'])
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g") //group that will house the plot
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")"); //to center the g in the svg

    // ------------------ HEX BIN PROPERTIES --------------------------------------

    var points = new Array(data.length)

    // converting to array of points
    for (var i = 0; i < data.length; i++) {
        var point = [xScale(data[i]['x']), yScale(data[i]['y'])]
        points[i] = point;
    }

    /*
     Clip-path is made to clip anything that goes out of the svg
     */
    svg.append("clipPath")
        .attr("id", "clip")
        .append("rect")
        .attr("class", "mesh")
        .attr("width", width)
        .attr("height", height);


    var hexColor = d3.scale.linear()
        .domain([0, 20])
        .range(["white", "darkblue"])
        .interpolate(d3.interpolateLab);

    var hexColorRed = d3.scale.linear()
        .domain([0, 20])
        .range(["white", "maroon"])
        .interpolate(d3.interpolateLab);

    var hexbin = d3.hexbin()
        .size([width, height])
        .radius(20);


    if(points.length>10000)
        drawHexbin();
    else
        drawScatterPlot();
    // ------------------- DRAWING PLOTS FUNCTIONS -------------------------------------

    /**
     * DRAWING A HEXBIN PLOT
     */
    function drawHexbin() {
        var hexbinPlot = svg.append("g")
            .attr("clip-path", "url(#clip)")
            .selectAll(".hexagon")
            .data(hexbin(points)) // returns an array of bins
            .enter().append("path") // enter returns all fictitious elements according to number of data points
            .attr("class", "hexagon") // the class hexagon is a custom class made to incorporate stroke and fill
            .attr("d", hexbin.hexagon())
            .attr("transform", function (d) {
                return "translate(" + d.x + "," + d.y + ")"; // Each bin (or d) returned by hexbin(points) is an array containing the bin’s points
            })
            ;

        //load the points animatedly
        //reference url for ease: https://github.com/mbostock/d3/wiki/Transitions#d3_ease

        hexbinPlot.transition()
            .style("fill", function (d) {
                return hexColor(d.length);
            })
            .duration(900)
            .ease('sin');
    }

    /**
     * DRAWING A SCATTERPLOT
     */
    function drawScatterPlot() {
        var scatterPlot = svg.append('g')
            .attr("clip-path", "url(#clip)")
            .selectAll('circle').data(data)
            .enter().append('circle')
            .style('fill', "darkblue")
            .attr('r', 0)
            .attr('cx', function (d) {
                return xScale(d['x'])
            })
            .attr('cy', function (d) {
                return yScale(d['y'])
            })
            ;

        //load the points animatedly
        //reference url for ease: https://github.com/mbostock/d3/wiki/Transitions#d3_ease
        //load the points animatedly
        scatterPlot.transition()
            .attr('r', 4)
            .duration(1000)
            .ease('elastic')

    }


    // adding the axes
    svg.append("g")
        .attr("class", "y axis")
        .call(yAxis);

    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);

    // adding the axes labels
    svg.append("text")
        .attr("text-anchor", "middle")  // this makes it easy to centre the text as the transform is applied to the anchor
        .attr("transform", "translate(" + (-leftMargin / 2) + "," + (height / 2) + ")rotate(-90)")  // text is drawn off the screen top left, move down and out and rotate
        .text(ylabel);

    svg.append("text")
        .attr("text-anchor", "middle")  // this makes it easy to centre the text as the transform is applied to the anchor
        .attr("transform", "translate(" + (width / 2) + "," + (height + 6 + (bottomMargin / 2)) + ")")  // centre below axis
        .text(xlabel);

    // title
    svg.append("text")
        .attr("class", "chart-title")
        .attr("text-anchor", "middle")  // this makes it easy to centre the text as the transform is applied to the anchor
        .attr("transform", "translate(" + (width / 2) + "," + ( -20 + ")"))  // text is drawn off the screen top left, move down and out and rotate
        .text(title);

    // adding the brush
    if (brushable)
        svg.append("g")
            .attr("class", "brush")
            .call(brush)
            .call(brush.event);

    function brushed() {
        var extent = brush.extent();
        xStart = xScale.invert(extent[0][0]);
        yStart = yScale.invert(extent[0][1]);
        xEnd = xScale.invert(extent[1][0]);
        yEnd = yScale.invert(extent[1][1]);
        xStart = Math.round(xStart * 100) / 100;
        xEnd = Math.round(xEnd * 100) / 100;
        yStart = Math.round(yStart * 100) / 100;
        yEnd = Math.round(yEnd * 100) / 100;


        $("#brush-region").text(("(" + xStart + ", " + yStart + ") to (" + xEnd + ", " + yEnd + ")"));
    }

}

function drawRandomChart() {

    var options = {
        'renderTo': "#main-chart",
        'data': [{'x': 4, 'y': 5}, {'x': 3, 'y': 5}, {'x': 4, 'y': 2}, {'x': 4, 'y': 7}],
        'x-label': "x-axis",
        'y-label': "y-axis",
        'brush': true,
        'title': "My Epic Chart"
    };
    drawScatter(options);

}

function drawUserChart(xlab, ylab, title, brush, minX, maxX, minY, maxY, height, width, numberOfPoints) {

    var points = [];
    var i = 0;
    //console.log("number of points" + numberOfPoints);
    while (i < numberOfPoints) {
        var x = Math.floor(Math.random() * (maxX - minX)) + minX;
        var y = Math.floor(Math.random() * (maxY - minY)) + minY;
        var obj = {'x': x, 'y': y};
        //console.log(obj);
        points.push(obj);

        i++;
    }
    //console.log("points are:" + points);
    var options = {
        'renderTo': "#main-chart",
        'data': points,
        'x-label': xlab,
        'y-label': ylab,
        'title': title,
        'brush': brush
    };
    //console.log(options);

    $("#main-chart").html("");
    drawScatter(options);

}

