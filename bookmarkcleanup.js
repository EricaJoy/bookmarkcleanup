noQuery = {
  extend: function(recipient, source) {
    for (var key in source) {
      if(source.hasOwnProperty(key)){
        recipient[key] = source[key];
      }
    }
  }
}

function Bookmark(data) {
  noQuery.extend(this, data);
};

Bookmark.prototype = {
  toHtml: function(code) {
    return [
      '<tr id=',
      this.id,
      '><td><a href="',
      this.url,
      '"> ',
      this.title,
      ' </a> </td><td name="status">',
      code,
      '</td><td class="checkbox"><input type="checkbox" parentId="',
      this.parentId,
      '" status="',
      code,
      '" name="selected" value="',
      this.id,
      '"></td></tr>'
    ].join('');
  },

  determineHttpStatus: function() {
    return $.ajax({ url: this.url })
    .always(function(potentialStatusBearer1, textStatus, potentialStatusBearer2) {
      this.status = (potentialStatusBearer1.status || potentialStatusBearer2.status);
    }.bind(this));
  }
};

// Get all the bookmarks
$(document).ready(function(){

    getBookmarks();

    $( "#threehun" ).click(function() {
        var val = $("#threehun a").text();
        switch(val){
            case "Deselect 300's":
                $( "#threehun a" ).text("Select 300's")
                $("form input:checkbox[status^=3]").prop("checked", false);
                break;
            case "Select 300's":
                $( "#threehun a" ).text("Deselect 300's")
                $("form input:checkbox[status^=3]").prop("checked", true); 
                break;
        }            
    });


    $( "#fourhun" ).click(function() {
        var val = $("#fourhun a").text();
        switch(val){
            case "Deselect 400's":
                $( "#fourhun a" ).text("Select 400's")
                $("form input:checkbox[status^=4]").prop("checked", false);
                break;
            case "Select 400's":
                $( "#fourhun a" ).text("Deselect 400's")
                $("form input:checkbox[status^=4]").prop("checked", true); 
                break;
        }            
    });

    $( "#fivehun" ).click(function() {
        var val = $("#fivehun a").text();
        switch(val){
            case "Deselect 500's":
                $( "#fivehun a" ).text("Select 500's")
                $("form input:checkbox[status^=5]").prop("checked", false);
                break;
            case "Select 500's":
                $( "#fivehun a" ).text("Deselect 500's")
                $("form input:checkbox[status^=5]").prop("checked", true); 
                break;
        }            
    });

    $( "#generics" ).click(function() {
        var val = $("#generics a").text();
        switch(val){
            case "Deselect Generic Errors":
                $( "#generics a" ).text("Select Generic Errors")
                $("form input:checkbox[status^=0]").prop("checked", false);
                break;
            case "Select Generic Errors":
                $( "#generics a" ).text("Deselect Generic Errors")
                $("form input:checkbox[status^=0]").prop("checked", true); 
                break;
        }            
    });


    $( "#clean").click(function() {
    console.log("clean click")
    var checkedLength = $( "input:checked" ).length
    if (checkedLength < 1) {
        $( "#delwarning" ).text("You haven't selected any bookmarks to delete.")
        $( "#dialog" ).dialog({ buttons: [ { text: "Close", click: function() { $( this ).dialog( "close" ); } } ] });
    }
    else {
        $( "#delwarning" ).text("This will delete "+checkedLength+" bookmarks. Are you sure you want to do this?")
        $( "#dialog" ).dialog({ buttons: [
            { text: "I'm sure.", click: function() {
                $( this ).dialog( "close" );
                for (var i=0; i < checkedLength; i++) {
                    var badBookmark = $( "input:checked" )[i].value;
                    chrome.bookmarks.remove(String(badBookmark))
                    $( '#'+badBookmark ).remove();
                };

            }},
            { text: "Nope, get me out of here.", click: function() { $( this ).dialog( "close" );}}


            ]});   
    };
    

    });



});

function getBookmarks(){

  if ( typeof(chrome.bookmarks) === "undefined" ) return [];
    chrome.bookmarks.getTree(function(r)
    {   var arrayLength = r.length;
        // console.log(arrayLength);
        for (var i=0; i < arrayLength; i++) {
        treeWalk(r[i]);
    };

    });
}


function treeWalk(obj) {
    if (obj.children) {
        if (obj.title.length > 0){
            $("#bookmarks").append('<tr class="info" id="'+obj.id+'"><td colspan="3"> <b>'+obj.title+'</b></td></tr>');}
            
            if (typeof bookmarksArray === "undefined") {
                // Make an empty array to hold the bookmarks
                bookmarksArray = []
            }
            else {
                //Do some stuff with the current bookmarksArray
                console.log (bookmarksArray)
                    for (var i=0; i < bookmarksArray.length; i++) {
                      var bookmark = bookmarksArray[i];
                      bookmark.determineHttpStatus()
                        .always(function(template) {
                          $('#'+bookmark.parentId).after(bookmark.toHtml());
                        });
                    }
                // Empty out the bookmarksArray array
                bookmarksArray = []
            }
            
            // for each child, do the tree walk
            for (var i=0; i < obj.children.length; i++) {
                treeWalk(obj.children[i]);
                // console.log(urls)

            }

        
    }
    if (obj['url']) {
        // Test to make sure its not a "special" bookmark.
        if (obj.id && (obj.url.indexOf('javascript:') < 0) && (obj.url.indexOf('data:') < 0) && (obj.url.indexOf('about:') < 0)) {
        // Beginning the code for async
        bookmarksArray.push(new Bookmark(obj))
 
            }
        }

    }
