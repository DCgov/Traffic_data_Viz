/**
 * Created by Kevin on 8/12/2014.
 */

//NZE PLOT VISUALIZATION
function nze_viz(cgipath, targetdiv, sizeParams){
    this.cgipath = cgipath;
    this.targetdiv = targetdiv;
    this.params = null;
    this.targetdivhash = "#" + targetdiv;

    // Set query parameters
    this.setParams = function(params){
        this.params = params;
    };

    // Clear all Appended Elements from the page
    this.removeAllElements = function(){
        $("#bubblehoverdetail").remove();
    };

    // Get Corridor list
    var corrnamelist = {};
    $.getJSON(this.cgipath + "?method=getcorridor", function(data) {
        $.each(data, function(k, v) {
             corrnamelist[v['name']] = 0;
        });
    });

    var margin = {top: 40, right: 20, bottom: 30, left: 100};
    if(sizeParams != null){
        var width = sizeParams.width - margin.left - margin.right,
        height = sizeParams.height- margin.top - margin.bottom;
    }
    else{
        var width = 800 - margin.left - margin.right,
        height = 400 - margin.top - margin.bottom;
    }

    // Get the data
    this.generate = function() {
        loading_indicator_trigger();
        var targetdivhash = this.targetdivhash;
        var parseDay_Time = d3.time.format("%Y-%m-%d %H:%M:%S").parse;
        var parseWeek_Year = d3.time.format("%Y-%m-%d").parse;

        var formatDay_Time = d3.time.format("%a %H:%M");
        var formatWeek_Year = d3.time.format("%d-%m-%Y");

        var x = d3.time.scale().range([0, width]);
        var y = d3.time.scale().range([0, height]);

        var xAxis = d3.svg.axis()
            .scale(x)
            .orient("bottom")
            .ticks(7)
            .tickFormat(d3.time.format("%A"));

        var yAxis = d3.svg.axis()
            .scale(y)
            .orient("left")
            .ticks(24);

        var date_start = this.params.DateStart;
        var date_end = this.params.DateEnd;
        var iscorridor;
        var coi;
        if ('Corridor' in this.params) {
            coi = this.params.Corridor;
            coiname = this.params.CorridorName;
            iscorridor = true;
        }
        else{
            coi = params.ACISA;
            coiname = this.params.ACISA;
            acisa = this.params.ACISA;
            iscorridor = false;
        }

        var dir = this.params.Direction;
        var querystr;

        if (iscorridor == true) {
            querystr = this.cgipath + "?method=query_by_corridor_group&target_plot=NZE&corridor_id=" + coi + "&start_date=" + date_start + "&end_date=" + date_end;
        }
        else {
            querystr = this.cgipath + "?method=query_by_acisa&target_plot=NZE&acisa=" + acisa + "&start_date=" + date_start + "&end_date=" + date_end;
        }


        // State the functions for the grid
        function make_x_axis() {
              return d3.svg.axis()
                  .scale(x)
                  .orient("bottom")
                  .ticks(7)
        }

        $(targetdivhash).empty();

        d3.csv(querystr, function (error, data) {
            dlist = {};
            nkeys = 0;
            data.forEach(function (d) {
                d.week_year = parseWeek_Year(d.week_year);
                d.day_time = parseDay_Time(d.day_time);
                d.value = +d.vol;
                if (!(d.lanedr in dlist)) {
                    dlist[d.lanedr] = [];
                    nkeys++;
                }
                dlist[d.lanedr].push(d);
            });

            // Set the domains
            x.domain([new Date(1900, 00, 07, 0, 0, 0), new Date(1900, 00, 13, 23, 59, 59)]);
            y.domain(d3.extent(data, function (d) {
                return d.week_year;
            }));
            // tickSize: Get or set the size of major, minor and end ticks

            for (var key in dlist) {
                var svg = d3.select(targetdivhash)
                    .append("svg")
                    .attr("width", width + margin.left + margin.right)
                    .attr("height", height + margin.top + margin.bottom)
                    .append("g")
                    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

                svg.append("g").classed("grid x_grid", true)
                    .attr("transform", "translate(0," + height + ")")
                    .style("stroke-dasharray", ("3, 3, 3"))
                    .call(make_x_axis()
                        .tickSize(-height, 0, 0)
                        .tickFormat("")
                )
                // Draw the Axes and the tick labels
                svg.append("g")
                    .attr("class", "x axis")
                    .attr("transform", "translate(0," + height + ")")
                    .call(xAxis)
                    .selectAll("text")
                    .attr("dx", 35)
                    .attr("dy", 5)
                    .style("text-anchor", "middle");

                svg.append("g")
                    .attr("class", "y axis")
                    .call(yAxis)
                    .selectAll("text")
                    .attr("dx", 2)
                    .attr("dy", 22)
                    .style("text-anchor", "end");

                // Tooltip stuff
                var div = d3.select(targetdivhash).append("div")
                    .attr("class", "tooltip")
                    .style("opacity", 1e-6);

                // draw the plotted circles
                svg.selectAll(".dot")
                    .data(dlist[key])
                    .enter().append("circle")
                    .attr("class", "dot")
                    .attr("r", function (d) {
                        if (iscorridor == true) {
                            return ((d.value / 500));
                        }
                        else {
                            return (d.value > 1000 ? 20 : (d.value / 50));
                        }
                    })
                    .style("opacity", 0.13)
                    .attr("cx", function (d) {
                        return x(d.day_time);
                    })
                    .attr("cy", function (d) {
                        return y(d.week_year);
                    })
                    // Tooltip stuff after this
                    .on("mouseover", function (d) {
                        div.transition()
                            .duration(200)
                            .style("opacity", .7);
                        div.html(
                                formatDay_Time(d.day_time) + "<br/>" +
                                formatWeek_Year(d.week_year) + "<br/> Volume:" +
                                d.value)
                            .style("left", (d3.event.pageX) + "px")
                            .style("top", (d3.event.pageY - 42) + "px");
                    })
                    .on("mouseout", function (d) {
                        div.transition()
                            .duration(500)
                            .style("opacity", 1e-6);
                    });

                // Add the title
                svg.append("text")
                    .attr("x", (width / 2))
                    .attr("y", 0 - (margin.top / 2))
                    .attr("text-anchor", "middle")
                    .style("font-size", "18px")
                    .text(coiname + " - Direction: " + key);
            }
            loading_indicator_trigger();
        });
    }
}