noQuery = {
  extend: function(recipient, source) {
    for (var key in source) {
      if(source.hasOwnProperty(key)){
        recipient[key] = source[key];
      }
    }
  },

  checkboxes: function() {
    var inputs = Array.prototype.slice.call(document.querySelectorAll("form input"));

    return  checkboxes = inputs.filter(function(input) {
        return input.attributes['type'].value === "checkbox";
      });
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
  this._initializeControls();
}

View.prototype = {
  draw: function(obj) {
    obj.containers().forEach(function(container) {
      this.$selector.append(container.toHTML());
    }.bind(this));

    obj.bookmarksByAscendingDate().forEach(function(bookmark) {
      bookmark.toHtml(function(bookmarkHtml) {
        $('#'+bookmark.parentId).after(bookmarkHtml);
      });
    });
  },

  _initializeSelectionControls: function() {
    var links = [
      { selector: "threehun", text: "300s", inputsSelector: function() { return noQuery.checkboxes().filter(function(cb){ return cb.attributes['status'].value.match(/^3/) }) }},
      { selector: "fourhun", text: "400s", inputsSelector: function() { return noQuery.checkboxes().filter(function(cb){ return cb.attributes['status'].value.match(/^4/) }) }},
      { selector: "fivehun", text: "500s", inputsSelector: function() { return noQuery.checkboxes().filter(function(cb){ return cb.attributes['status'].value.match(/^5/) }) }},
      { selector: "generics", text: "Generic Errors", inputsSelector: function() { return noQuery.checkboxes().filter(function(cb){ return cb.attributes['status'].value.match(/^0/) }) }}
    ];

    links.forEach(function(clickBehaviorSpecifier) {
      document
        .getElementById(clickBehaviorSpecifier.selector)
        .addEventListener('click', function(e) {
          var targetNode = e.currentTarget,
            untoggled = !targetNode.getAttribute('data-toggled');
        if (untoggled) {
          targetNode.setAttribute('data-toggled', true);
          targetNode.childNodes[0].innerHTML = "Deselect " + clickBehaviorSpecifier.text;
          clickBehaviorSpecifier.inputsSelector().forEach(function(cb) {
            cb.setAttribute('checked', true);
            cb.checked = true;
          });
        } else {
          targetNode.removeAttribute('data-toggled');
          targetNode.childNodes[0].innerHTML = "Select " + clickBehaviorSpecifier.text;
          clickBehaviorSpecifier.inputsSelector().forEach(function(cb) {
            cb.checked = false;
          });
        }
      });
    });
  },

  _initializeDeletionControls: function() {
    $( "#clean").click(function() {
      var checkedLength = $( "input:checked" ).length
      if (checkedLength < 1) {
        $( "#delwarning" ).text("You haven't selected any bookmarks to delete.")
        $( "#dialog" ).dialog({
          buttons: [{
            text: "Close",
            click: function() {
              $( this ).dialog( "close" );
            }
          }
          ]
        });
      }
      else {
        $( "#delwarning" )
          .text("This will delete " +
                checkedLength +
                " bookmarks. Are you sure you want to do this?")
        $( "#dialog" ).dialog({
          buttons: [
            {
              text: "I'm sure.",
              click: function() {
                $( this ).dialog( "close" );
                for (var i=0; i < checkedLength; i++) {
                  var badBookmark = $( "input:checked" )[i].value;
                  chrome.bookmarks.remove(String(badBookmark))
                  $('#'+badBookmark).remove();
                };
              }
          },
          {
            text: "Nope, get me out of here.",
            click: function() {
              $( this ).dialog( "close" );
            }
          }]
        });
      };
    });
  },

  _initializeControls: function() {
    this._initializeSelectionControls();
    this._initializeDeletionControls();
  }
}

// Get all the bookmarks
$(document).ready(function(){
  if ( typeof(chrome.bookmarks) === "undefined" ) return [];
  chrome.bookmarks.getTree(function(r) {
    new View("#bookmarks").draw(new Container(r));
  });
});

