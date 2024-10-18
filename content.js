let isSelectionActive = false;

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  try {
    if (request.action === "activateLineSelection") {
      if (!isSelectionActive) {
        isSelectionActive = true;
        document.body.style.cursor = 'crosshair';
        document.addEventListener('click', handleLineClick);
        document.addEventListener('keydown', handleEscapeKey);
        sendResponse({ status: "Line selection activated" });
      } else {
        sendResponse({ status: "Line selection was already active" });
      }
    } else if (request.action === "deactivateLineSelection") {
      deactivateLineSelection();
      sendResponse({ status: "Line selection deactivated" });
    }
  } catch (error) {
    console.error("Error in content script:", error);
    sendResponse({ status: "Error", message: error.message });
  }
  return true;
});

function handleEscapeKey(event) {
  if (event.key === "Escape") {
    deactivateLineSelection();
    chrome.runtime.sendMessage({ action: "selectionCancelled" });
  }
}

function deactivateLineSelection() {
  isSelectionActive = false;
  document.body.style.cursor = 'default';
  document.removeEventListener('click', handleLineClick);
  document.removeEventListener('keydown', handleEscapeKey);
}

function handleLineClick(event) {
  if (!isSelectionActive) return;

  event.preventDefault();
  event.stopPropagation();

  const clickedElement = event.target.closest('p, h1, h2, h3, li');
  if (!clickedElement) return;

  const lineText = clickedElement.textContent.trim();
  const xpath = getXPath(clickedElement);

  highlightElement(clickedElement);
  
  // Store the line information
  chrome.storage.local.set({
    lastBookmarked: {
      url: window.location.href,
      lineText: lineText,
      xpath: xpath
    }
  });

  chrome.runtime.sendMessage({
    action: "lineSelected",
    url: window.location.href,
    lineText: lineText,
    xpath: xpath
  });

  deactivateLineSelection();
}

function getXPath(element) {
  if (element.id !== '') {
    return 'id("' + element.id + '")';
  }
  if (element === document.body) {
    return element.tagName;
  }

  let ix = 0;
  const siblings = element.parentNode.childNodes;
  for (let i = 0; i < siblings.length; i++) {
    const sibling = siblings[i];
    if (sibling === element) {
      return getXPath(element.parentNode) + '/' + element.tagName + '[' + (ix + 1) + ']';
    }
    if (sibling.nodeType === 1 && sibling.tagName === element.tagName) {
      ix++;
    }
  }
  return '';
}

function highlightElement(element) {
  if (!element.classList.contains('bookmark-highlight')) {
    element.classList.add('bookmark-highlight');
    setTimeout(() => {
      element.classList.remove('bookmark-highlight');
    }, 3000);
  }
}

// CSS styling for the highlight
const style = document.createElement('style');
style.textContent = `
  .bookmark-highlight {
    background-color: yellow;
    transition: background-color 0.3s ease;
  }
`;
document.head.appendChild(style);

// Function to retrieve an element by XPath
function getElementByXPath(xpath) {
  return document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
}

// Function to scroll to the element smoothly
function scrollToElement(element) {
  if (element) {
    element.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
      inline: 'nearest'
    });
  }
}

// Check for bookmarked line and scroll to it
function checkAndScrollToBookmark() {
  chrome.storage.local.get('lastBookmarked', (data) => {
    if (data.lastBookmarked && data.lastBookmarked.url === window.location.href) {
      const xpath = data.lastBookmarked.xpath;
      const element = getElementByXPath(xpath);
      if (element) {
        highlightElement(element);
        scrollToElement(element);
      }
    }
  });
}

// Run on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', checkAndScrollToBookmark);
} else {
  checkAndScrollToBookmark();
}

// Also run after a short delay to account for dynamic content
setTimeout(checkAndScrollToBookmark, 2000);