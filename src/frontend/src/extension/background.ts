// ChessMaster Free — Background Service Worker (Manifest V3)

const CHESS_COM_PATTERNS = [
  "https://www.chess.com/play/",
  "https://www.chess.com/game/",
];

function isChessGamePage(url: string): boolean {
  return CHESS_COM_PATTERNS.some((pattern) => url.startsWith(pattern));
}

// Log installation
chrome.runtime.onInstalled.addListener((details) => {
  console.log("[ChessMaster Free] Installed. Reason:", details.reason);
  if (details.reason === "install") {
    // Open chess.com on first install to show the user where to use it
    chrome.tabs.create({ url: "https://www.chess.com/play/computer" });
  }
});

// Watch tab updates — activate content script on chess.com game pages
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status !== "complete") return;
  const url = tab.url ?? "";
  if (!isChessGamePage(url)) return;

  // Notify content script that it should activate
  chrome.tabs.sendMessage(tabId, { type: "ACTIVATE", url }).catch(() => {
    // Content script may not yet be injected — inject it programmatically
    chrome.scripting
      .executeScript({
        target: { tabId },
        files: ["content.js"],
      })
      .catch((err) => {
        console.warn(
          "[ChessMaster Free] Failed to inject content script:",
          err,
        );
      });
  });
});

// Handle messages from content scripts or popup
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "GET_TAB_STATUS") {
    // Popup is asking whether the current tab is a chess game page
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const url = tabs[0]?.url ?? "";
      sendResponse({ active: isChessGamePage(url), url });
    });
    return true; // keep message channel open for async sendResponse
  }
});

export {};
