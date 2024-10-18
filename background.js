chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "lineSelected") {
      console.log("Received line selection:", request.lineText);
      
      saveBookmark(request.url, request.lineText, request.xpath);
      sendResponse({ status: "Bookmark saved" });
      
      return true;
    }
  });
  
  function saveBookmark(url, lineText, xpath) {
    chrome.storage.sync.get({ bookmarks: [] }, (result) => {
      const bookmarks = result.bookmarks;
  
      bookmarks.push({ url, lineText, xpath });
      chrome.storage.sync.set({ bookmarks }, () => {
        console.log("Bookmark saved:", { url, lineText, xpath });
      });
    });
  }
  