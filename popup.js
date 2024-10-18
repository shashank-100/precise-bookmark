let selectedLine = null;

document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('activateSelection').addEventListener('click', activateLineSelection);
  document.getElementById('saveBookmark').addEventListener('click', saveSelectedBookmark);
  displayBookmarks();
});

function activateLineSelection() {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    chrome.tabs.sendMessage(tabs[0].id, {action: "activateLineSelection"}, function(response) {
      if (chrome.runtime.lastError) {
        console.log(chrome.runtime.lastError.message);
        chrome.scripting.executeScript({
          target: {tabId: tabs[0].id},
          files: ['content.js']
        }, function() {
          chrome.tabs.sendMessage(tabs[0].id, {action: "activateLineSelection"});
        });
      }
    });
  });
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === "lineSelected") {
    selectedLine = request;
    document.getElementById('saveInfo').style.display = 'block';
  }
});

function saveSelectedBookmark() {
  if (selectedLine) {
    saveBookmark(selectedLine.url, selectedLine.lineText, selectedLine.xpath);
    selectedLine = null;
    document.getElementById('saveInfo').style.display = 'none';
  }
}

function saveBookmark(url, lineText, xpath) {
  chrome.storage.sync.get({bookmarks: []}, function(data) {
    data.bookmarks.push({url: url, lineText: lineText, xpath: xpath});
    chrome.storage.sync.set({bookmarks: data.bookmarks}, function() {
      document.getElementById('bookmarkInfo').textContent = "Bookmark saved: " + lineText;
      displayBookmarks();
    });
  });
}

function displayBookmarks() {
  chrome.storage.sync.get({bookmarks: []}, function(data) {
    const bookmarkList = document.getElementById('bookmarkList');
    bookmarkList.innerHTML = '';
    if (data.bookmarks.length === 0) {
      bookmarkList.textContent = 'No bookmarks saved yet.';
    } else {
      data.bookmarks.forEach(function(bookmark, index) {
        const bookmarkDiv = document.createElement('div');
        bookmarkDiv.className = 'bookmark-item';
        bookmarkDiv.innerHTML = `
          <div class="bookmark-text">${bookmark.lineText}</div>
          <div class="bookmark-url">${bookmark.url}</div>
        `;
        bookmarkList.appendChild(bookmarkDiv);
      });
    }
  });
}