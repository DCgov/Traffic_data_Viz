/**
 * Created by Kevin on 8/2/2014.
 */

var over = null;
function loading_indicator_trigger() {
    // add the overlay with loading image to the page
    if(over == null) {
        over = '<div id="overlay">' +
                '<img id="loading" src="http://developme.files.wordpress.com/2010/02/icon_loading_75x75.gif">' +
                '</div>';
        $(over).appendTo('body');
    }
    else{
        $('#overlay').remove();
        over = null;
    }
}


