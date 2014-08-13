/**
 * Created by Kevin on 8/12/2014.
 */
/** This package requires jquery and d3.js libraries included in advance */

/* load other Javascript */
function loadScript(url, callback)
{
    var head = document.getElementsByTagName('head')[0];
    var script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = url;
    script.onreadystatechange = callback;
    script.onload = callback;
    head.appendChild(script);
}

function doNothing() {}

loadScript("js/loading_indicator.js", doNothing);
loadScript("js/viz_impl_bubble.js", doNothing);
loadScript("js/viz_impl_treemap.js", doNothing);
loadScript("js/viz_impl_nze.js", doNothing);
