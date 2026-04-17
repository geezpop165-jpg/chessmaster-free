// Minimal Chrome Extension API type declarations for Manifest V3
// These cover only the APIs used in ChessMaster Free content/background scripts.

interface ChromeRuntimeStatic {
  getURL(path: string): string;
  lastError?: { message?: string } | undefined;
  onInstalled: ChromeEvent<(details: { reason: string }) => void>;
  onMessage: ChromeEvent<
    (
      message: Record<string, unknown>,
      sender: Record<string, unknown>,
      sendResponse: (response: unknown) => void,
    ) => boolean | undefined
  >;
  sendMessage(message: Record<string, unknown>): Promise<unknown>;
  sendMessage(
    message: Record<string, unknown>,
    callback: (response: unknown) => void,
  ): void;
}

interface ChromeTab {
  id?: number;
  url?: string;
}

interface ChromeTabsStatic {
  create(options: { url: string }): Promise<ChromeTab>;
  query(
    queryInfo: { active: boolean; currentWindow: boolean },
    callback: (tabs: ChromeTab[]) => void,
  ): void;
  sendMessage(
    tabId: number,
    message: Record<string, unknown>,
  ): Promise<unknown>;
  onUpdated: ChromeEvent<
    (tabId: number, changeInfo: { status?: string }, tab: ChromeTab) => void
  >;
}

interface ChromeScriptingStatic {
  executeScript(options: {
    target: { tabId: number };
    files: string[];
  }): Promise<void>;
}

interface ChromeEvent<T> {
  addListener(callback: T): void;
  removeListener(callback: T): void;
}

declare const chrome: {
  runtime: ChromeRuntimeStatic;
  tabs: ChromeTabsStatic;
  scripting: ChromeScriptingStatic;
};
