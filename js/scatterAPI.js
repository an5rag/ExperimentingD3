/**
 * Created by an5ra on 2/14/2016.
 */

var scatter;
var getBrushPoints;
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
    if ($(options['title']) != undefined) {
        title = options['title'];
    }
    else {
        title = "Untitled Graph"
    }
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
    // ZOOM VARIABLE
    var zoom = d3.behavior.zoom()
        .scaleExtent([1, 10])
        .on("zoom", zoomed);

///////////////////////////////////////////////////////// BRUSH PROPERTIES

    //keep track of existing brushes
    var brushes = [];


    /**
     * Function to handle a new brush
     */
    var newBrush = function () {
        console.log("newBrush() called!");

        var brush = d3.svg.brush()
            .x(d3.scale.identity().domain([0, width]))
            .y(d3.scale.identity().domain([0, height]))
            .on("brush", brushed)
            .on("brushend", brushend); //Keep track of what brushes is surrounding

        brushes.push(brush);
        console.log("Starting extent:" + brush.extent())

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

        function brushend() {
            //console.log(brushes[brushes.length-1].extent())
            //if(true)
            //{
            //    var lastBrushExtent = brushes[brushes.length-1].extent();
            //    var xStartTemp = xScale.invert(lastBrushExtent[0][0]);
            //    var xEndTemp = xScale.invert(lastBrushExtent[1][0]);
            //    xEndTemp = Math.round(xEndTemp * 100) / 100;
            //
            //    if (xStartTemp - xEndTemp != 0)
            //        newBrush();
            //}

        }

    }

    //// declaring brush
    //var brush = d3.svg.brush()
    //    .x(d3.scale.identity().domain([0, width]))
    //    .y(d3.scale.identity().domain([0, height]))
    //    .on("brush", brushed);


    var svg = d3.select(options['renderTo'])
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g") //group that will house the plot
        .attr("id", "main-area")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")") //to center the g in the svg
    //.call(zoom);
        ;
    //////////////////////////////////////////////////////GRID LINES
    svg.append("g")
        .attr("class", "x axis")
        .selectAll("line")
        .data(d3.range(0, width, 10))
        .enter().append("line")
        .attr("x1", function (d) {
            return d;
        })
        .attr("y1", 0)
        .attr("x2", function (d) {
            return d;
        })
        .attr("y2", height);

    svg.append("g")
        .attr("class", "y axis")
        .selectAll("line")
        .data(d3.range(0, height, 10))
        .enter().append("line")
        .attr("x1", 0)
        .attr("y1", function (d) {
            return d;
        })
        .attr("x2", width)
        .attr("y2", function (d) {
            return d;
        });
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


    var hexColor = d3.scale.log()
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

    /////////////////////////////////////////////////////////// adding the brush
    //if (brushable)
    //newBrush();
    //getBrushPoints = function () {
    //    return [xStart,  yStart, xEnd, yEnd];
    //}
    function zoomed() {
        svg.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
    }

    //clickPolyPoints(d3.select("#main-chart"));
    //svg.on("mouseleave", function () {
    //    console.log("Mouse out!");
    //})
    //svg.on("mouseenter", function () {
    //    console.log("Mouse in!");
    //})
}

function drawPolygon() {
    drawPolygonFlag = true;
    clickPolyPoints(d3.select("#main-chart"));


}

var Polypoints;
var currentPolygon;
var polygonpointsSet = [];
var drawPolygonFlag = false;
var polygonStack=[];

/**
 * Function to help draw polygons on d3 chart
 * @param svg
 */
function clickPolyPoints(svg) {
    var polygon = svg.append('polygon').classed("userPolygon", true);
    polypoints = []
    currentPolygon = polygon;
    //currentPolypoints = polypoints;
    if (drawPolygonFlag) {
        svg.on("click", function () {
            polypoints.push(d3.mouse(this)[0] + ',' + d3.mouse(this)[1]);
            console.log(polypoints.join(" "));
            updatePolygon(polygon, polypoints);
        });
        svg.on("mousemove", function () {
                var tempPolypoints = polypoints.slice();
                tempPolypoints.push(d3.mouse(this)[0] + ',' + d3.mouse(this)[1]);
                updatePolygon(polygon, tempPolypoints);

            }
        );
        svg.on("contextmenu", function (data, index) {
            //handle right click

            //stop showing browser menu
            d3.event.preventDefault();
            polypoints = [];

            updatePolygon(polygon, polypoints);
        });
        svg.on("mouseout", function () {
            updatePolygon(polygon, polypoints);
        })
        svg.on("dblclick",function(){
            //console.log("Double click! + ",this);
            svg.on("click", null);
            svg.on("mousemove",null);
            svg.on("contextmenu",null);
            svg.on("mouseout",null);
            highlightPolygon();
        })
    }

}

function highlightPolygon(){
    d3.selectAll(".userPolygon")
        .on("mouseover",function(){
            console.log("On a polygon!");
            d3.select(this).classed("highlightPolygon",true);
            d3.select(this).on("contextmenu",function(){
                d3.select(this).remove();
            })
        })
        .on("mouseleave", function () {
            d3.select(this).classed("highlightPolygon",false);
        })
}

function undoPolyPoints() {
    if (clickPolyPoints.length > 0) {
        polypoints = polypoints.slice(0, polypoints.length - 1);
        updatePolygon(currentPolygon, polypoints);
    }
}
function changePolygonColorRed(){
    currentPolygon.classed("polygonRedify",true);
}
function changePolygonColorGreen(){
    currentPolygon.classed("polygonRedify",false);
}

function changePolygonColor(color) {
    currentPolygon.attr("style", "fill: " + color);
}
function updatePolygon(polygon, polypoints) {
    polygon.attr('points', "");
    polygon.attr('points', polypoints);
    //console.log(polygon.attr('points'));
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
    scatter = drawScatter(options);

}

function drawUserChart(xlab, ylab, title, brush, minX, maxX, minY, maxY, height, width, numberOfPoints) {
    console.log(xlab == '')
    xlab = xlab != '' ? xlab : 'X-Axis';
    ylab = ylab != '' ? ylab : 'Y-Axis';
    var untitledGraph = "Untitled"
    title = title != '' ? title : untitledGraph;
    //brush =  brush == '' ? brush : True;
    minX = isNaN(minX) ? 0 : minX;
    minY = isNaN(minY) ? 50 : minY;
    maxX = isNaN(maxX) ? 100 : maxX;
    maxY = isNaN(maxY) ? 150 : maxY;
    numberOfPoints = isNaN(numberOfPoints) || numberOfPoints == '' ? 200 : numberOfPoints;
    //alert(numberOfPoints);
    var points = [];
    var i = 0;
    console.log("number of points: " + numberOfPoints);
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

