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

  this.statusCode = null;
  this._toHtmlDeferred = $.Deferred();
  this.determineHttpStatus();
};

Bookmark.prototype = {
  toHtml: function(callback) {
    this._toHtmlDeferred.always(function() {
      callback(this._template());
    }.bind(this))
    return this._toHtmlDeferred;
  },

  determineHttpStatus: function() {
    this.statusDeferred = $.ajax({ url: this.url })
    .always(function(potentialStatusBearer1, textStatus, potentialStatusBearer2) {
      this.statusCode = (potentialStatusBearer1.status || potentialStatusBearer2.status);
      this._toHtmlDeferred.resolve();
    }.bind(this));
  },

  _template: function() {
    return [
      '<tr id=',
      this.id,
      '><td><a href="',
      this.url,
      '"> ',
      this.title,
      ' </a> </td><td name="status">',
      this.statusCode,
      '</td><td class="checkbox"><input type="checkbox" parentId="',
      this.parentId,
      '" status="',
      this.statusCode,
      '" name="selected" value="',
      this.id,
      '"></td></tr>'
    ].join('');
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
  chrome.bookmarks.getTree(function(r) {
    var arrayLength = r.length;
    window.bookmarksArray = [];
    console.log(arrayLength);
    for (var i=0; i < arrayLength; i++) {
      console.log(i);
      var c = new Container(r);
      new View("#bookmarks").treeWalk(c);
    }
  });
}

function Container(data) {
  noQuery.extend(this, data);
  this.raw = data;
  this.children = this._calculateChildren();
};

Container.prototype = {
  toHTML: function() {
    return [
      '<tr class="info" id="', this.id, '">',
        '<td colspan="3"> <b>', this.title, '</b></td>',
      '</tr>'
    ].join('');
  },

  bookmarks: function() {
    var accumulator;
    this._bookmarks(accumulator = []);
    return this._sanitizeBookmarks(accumulator);
  },

  bookmarksByAscendingDate: function() {
    return this.bookmarks().sort(function(a, b) {
      return b.dateAdded - a.dateAdded;
    });
  },

  _sanitizeBookmarks: function(bookmarks) {
    function isNotScriptlet(url) {
      return !url.match(/^(javascript|data|about):/);
    }

    return bookmarks.filter(function(bookmark) {
      return isNotScriptlet(bookmark.url);
    });
  },

  _bookmarks: function(memo) {
    this.children.forEach(function(node) {
      if (node instanceof Bookmark) {
        memo.push(node);
      } else if (node instanceof Container) {
        node._bookmarks(memo);
      }
    }.bind(this));
  },

  containers: function() {
    var accumulator;
    this._containers(accumulator = []);
    return this._sanitizeContainers(accumulator);
  },

  _sanitizeContainers: function(containers) {
    return containers.filter(function(container) {
      return (container.title != "");
    });
  },

  _containers: function(memo) {
    this.children.forEach(function(node) {
      if (node instanceof Container) {
        memo.push(node);
        node._containers(memo)
      }
    }.bind(this));
  },

  _calculateChildren: function() {
    if (this.raw instanceof(Array)) {
      return this.raw.map(function(childNode) {
        return new Container(childNode);
      }.bind(this));
    } else if (this.raw.children.length > 0) {
      return this.raw.children.map(function(child) {
        if (typeof(child.url) === "undefined") {
          return new Container(child);
        } else {
          return new Bookmark(child);
        }
      }.bind(this));
    }
    throw {
      message: "Expected Container to be initialized with children that were enumerable; they were not.",
      name: "UnclassifiedChildrenCollectionType"
    }
  }
};

function View(selector) {
  this.$selector = $(selector);
}

View.prototype = {
  treeWalk: function(obj) {
    obj.containers().forEach(function(container) {
      this.$selector.append(container.toHTML());
    }.bind(this));

    obj.bookmarksByAscendingDate().forEach(function(bookmark) {
      bookmark.toHtml(function(bookmarkHtml) {
        $('#'+bookmark.parentId).after(bookmarkHtml);
      });
    });
  }
}
