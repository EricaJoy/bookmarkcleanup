chrome.browserAction.onClicked.addListener(function(tab) {
  chrome.tabs.create({'url': chrome.extension.getURL('cleanup.html')}, function(tab) {
    // Tab opened.
  });
});
