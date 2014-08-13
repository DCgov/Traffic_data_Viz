/**
 * Created by Kevin on 8/12/2014.
 */

// TREEMAP VISUALIZATION OBJECT
function treemap_viz(cgipath, targetdiv, sizeParams){
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
        $("#treemaphoverdetail").remove();
        $("#radiomode").remove();
        $("#radioshowname").remove();
    };

    // Get Corridor list
    var corrnamelist = {};
    $.getJSON(this.cgipath + "?method=getcorridor", function(data) {
        $.each(data, function(k, v) {
             corrnamelist[v['name']] = 0;
        });
    });

    this.corrnamelist = corrnamelist;

    var margin = {top: 10, right: 10, bottom: 10, left: 10}
    if(sizeParams != null){
        var width = sizeParams.width - margin.left - margin.right, height = sizeParams.height - margin.top - margin.bottom;
    }
    else{
        var width = 1200 - margin.left - margin.right, height = 600 - margin.top - margin.bottom;
    }

    var color = d3.scale.category20c();

    this.treemap = d3.layout.treemap()
        .size([width, height])
        .sticky(true)
        .value(function(d) { return d.volume; });

    // Plot Generation process
    this.generate = function(){
        loading_indicator_trigger();
        if(this.params == null){
            console.log("Call setParams first before calling generate function.");
        }

        $(this.targetdivhash).empty();

        var time_start = this.params.TimeStart;
        var time_end = this.params.TimeEnd;
        var corridor = this.params.Corridor;
        var acisa = this.params.ACISA;
        var dir = this.params.Direction;

        var dtop = $(this.targetdivhash).position().top;
        var dleft = $(this.targetdivhash).position().left;

        var node = null;
        var div = this.div;
        var treemap = this.treemap;
        var corrnamelist = this.corrnamelist;

        // Append Selections
        var selectiondiv = '<div id="radiomode">' +
            'Value: <label><input type="radio" class="treemapselections" name="mode" value="vol" checked> Volume</label>' +
            '<label><input type="radio" class="treemapselections" name="mode" value="spd"> Speed</label>' +
            '<label><input type="radio" class="treemapselections" name="mode" value="count"> Count</label></div>' +
            '<div id="radioshowname">' +
            'Show: <label><input type="radio" class="treemapselections" name="showname" value="acisa" checked> ACISA</label>' +
            '<label><input type="radio" class="treemapselections" name="showname" value="corridor"> Corridor</label></div>';

        $(selectiondiv).appendTo(this.targetdivhash);

        // Append SVG
        var div = d3.select(this.targetdivhash).append("div")
            .style("position", "relative")
            .style("width", (width + margin.left + margin.right) + "px")
            .style("height", (height + margin.top + margin.bottom) + "px")
            .style("left", margin.left + "px")
            .style("top", margin.top + "px");

        // Append Hover Detail Div
        var hoverDetailDiv = '<div id="treemaphoverdetail" style="visibility: hidden;background-color: #ffffff;border: 2px solid;border-radius: 5px;padding: 5px 5px 5px 5px;"></div>';
        $(hoverDetailDiv).appendTo(this.targetdivhash);

        // Position Function
        function position() {
            this.style("left", function(d) { return d.x + "px"; })
              .style("top", function(d) { return d.y + "px"; })
              .style("width", function(d) { return Math.max(0, d.dx - 1) + "px"; })
              .style("height", function(d) { return Math.max(0, d.dy - 1) + "px"; });
        }

        query = this.cgipath + "?method=query_by_time_region&target_plot=TMP&start_date=" + time_start + "&end_date=" + time_end + "&dir=" + dir;

        $("body").click(function(){
                $("#treemaphoverdetail").css("visibility","hidden");
        });

        d3.json(query, function (error, root) {
            node = div.datum(root).selectAll(".treemapnode")
              .data(treemap.nodes)
            .enter().append("div")
              .attr("class", "treemapnode")
              .call(position)
              .style("background", function(d) {
                        // color scheme
                        if(d.corridor && d.corridor in corrnamelist) {
                            return color(d.corridor.split("").reverse().join(""));
                        }
                        else{
                            var dirname = dir;
                            if(dirname == "all" || dirname == "WE" || dirname =="NS")
                                return d.children ? color(d.name) : null;
                            else
                                return color(d.name);
                        }
                    })
              .text(function(d) {
                        if (Math.max(0, d.dx - 1) > 25 && Math.max(0, d.dy - 1) > 10) {
                            return d.children ? null : d.name;
                        }
                        else
                            return null;
                    })
              .on("mouseover", function(d) {
                        //handle hover information
                        htmlstr = d.name + "<br>Vol: " + d.volume + "<br>Speed: " + d.speed;
                        if(d.corridor){
                            htmlstr += "<br>Corridor: " + d.corridor;
                        }
                        var divtop = (parseFloat(d.x) + dleft).toString() + "px";
                        var divleft = (parseFloat(d.y) + dtop).toString() + "px";
                        $("#treemaphoverdetail").html(htmlstr)
                           .css("visibility","visible")
                           .css("position","absolute")
                           .css("left", divtop)
                           .css("top", divleft);
                    });

            d3.selectAll(".treemapselections").on("change", function change() {

                var selectedmode = "";
                var selected = $("#radiomode input[type='radio']:checked");
                if (selected.length > 0) {
                    selectedmode = selected.val();
                }
                var selectedshowname ="";
                selected = $("#radioshowname input[type='radio']:checked");
                if (selected.length > 0) {
                    selectedshowname = selected.val();
                }

                var value;
                if (selectedmode === "vol"){ value = function(d) { return d.volume; } }
                else if(selectedmode === "spd") { value = function(d) { return d.speed; } }
                else if(selectedmode === "count"){ value = function() { return 1; }}

                var textfun;
                // text layout scheme
                if (selectedshowname === "acisa") { textfun = function(d) {
                        if (Math.max(0, d.dx - 1) > 25 && Math.max(0, d.dy - 1) > 10) {
                            return d.children ? null : d.name;
                        }
                        else
                            return null;
                    }}
                else if(selectedshowname === "corridor") { textfun = function(d) {
                        if (Math.max(0, d.dx - 1) > 25 && Math.max(0, d.dy - 1) > 10) {
                            if (d.corridor && d.corridor != "no") {
                                return d.corridor;
                            }
                            else if (d.corridor == "no") {
                                return d.children ? null : d.name;
                            }
                            else {
                                return null;
                            }
                        }
                        else{ return null;}
                    }
                }

                node
                .data(treemap.value(value).nodes)
                .transition()
                .duration(1500)
                .call(position)
                .text(textfun);

            });

            console.log("load finished.");
            loading_indicator_trigger();
        });
    }
}