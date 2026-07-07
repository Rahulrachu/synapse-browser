import { WebContents, nativeImage } from 'electron';
import BrowserManager from './BrowserManager';

export interface AutomationResult {
  success: boolean;
  message?: string;
  data?: any;
}

/**
 * Provides methods for automating browser interactions within a specific tab.
 * It leverages Electron's `WebContents` to perform actions like navigation, JavaScript execution, 
 * element clicking, text typing, screenshot capture, and cookie management.
 */
class BrowserAutomation {
  /**
   * Get the WebContents of the specified tab or the active tab
   */
  private getWebContents(tabId?: string): WebContents | null {
    const id = tabId || BrowserManager.getActiveTab()?.id;
    if (!id) return null;
    
    const view = BrowserManager.getWebContents(id);
    return view ? view.webContents : null;
  }

  /**
   * Navigates the specified browser tab to a given URL.
   * @param url The URL to navigate to.
   * @param tabId Optional. The ID of the tab to navigate. If not provided, the active tab is used.
   * @returns An `AutomationResult` indicating success or failure, with an error message if applicable.
   */
  async navigate(url: string, tabId?: string): Promise<AutomationResult> {
    try {
      const wc = this.getWebContents(tabId);
      if (!wc) return { success: false, message: 'Tab not found' };
      
      await wc.loadURL(url);
      return { success: true };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  /**
   * Executes JavaScript code within the specified browser tab.
   * @param code The JavaScript code to execute.
   * @param tabId Optional. The ID of the tab to execute the JavaScript in. If not provided, the active tab is used.
   * @returns An `AutomationResult` containing the result of the JavaScript execution or an error message.
   */
  async executeJavaScript(code: string, tabId?: string): Promise<AutomationResult> {
    try {
      const wc = this.getWebContents(tabId);
      if (!wc) return { success: false, message: 'Tab not found' };
      
      const result = await wc.executeJavaScript(code);
      return { success: true, data: result };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  /**
   * Clicks an HTML element identified by a CSS selector within the specified browser tab.
   * @param selector The CSS selector of the element to click.
   * @param tabId Optional. The ID of the tab. If not provided, the active tab is used.
   * @returns An `AutomationResult` indicating success or failure.
   */
  async clickElement(selector: string, tabId?: string): Promise<AutomationResult> {
    const code = `
      (function() {
        const el = document.querySelector('${selector}');
        if (el) {
          el.click();
          return true;
        }
        return false;
      })()
    `;
    const result = await this.executeJavaScript(code, tabId);
    if (result.success && result.data === true) {
      return { success: true };
    }
    return { success: false, message: 'Element not found or could not be clicked' };
  }

  /**
   * Types text into an input element identified by a CSS selector within the specified browser tab.
   * Dispatches `input` and `change` events after typing.
   * @param selector The CSS selector of the input element.
   * @param text The text to type into the element.
   * @param tabId Optional. The ID of the tab. If not provided, the active tab is used.
   * @returns An `AutomationResult` indicating success or failure.
   */
  async typeText(selector: string, text: string, tabId?: string): Promise<AutomationResult> {
    const code = `
      (function() {
        const el = document.querySelector('${selector}');
        if (el) {
          el.value = '${text}';
          el.dispatchEvent(new Event('input', { bubbles: true }));
          el.dispatchEvent(new Event('change', { bubbles: true }));
          return true;
        }
        return false;
      })()
    `;
    const result = await this.executeJavaScript(code, tabId);
    if (result.success && result.data === true) {
      return { success: true };
    }
    return { success: false, message: 'Element not found or could not type text' };
  }

  /**
   * Retrieves the full HTML source of the current page in the specified browser tab.
   * @param tabId Optional. The ID of the tab. If not provided, the active tab is used.
   * @returns An `AutomationResult` containing the page source or an error message.
   */
  async getPageSource(tabId?: string): Promise<AutomationResult> {
    const code = `document.documentElement.outerHTML`;
    return this.executeJavaScript(code, tabId);
  }

  /**
   * Captures a screenshot of the current page in the specified browser tab.
   * @param tabId Optional. The ID of the tab. If not provided, the active tab is used.
   * @returns An `AutomationResult` containing the screenshot as a Data URL (base64) or an error message.
   */
  async takeScreenshot(tabId?: string): Promise<AutomationResult> {
    try {
      const wc = this.getWebContents(tabId);
      if (!wc) return { success: false, message: 'Tab not found' };
      
      const image = await wc.capturePage();
      return { success: true, data: image.toDataURL() };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  /**
   * Scrolls the page in the specified browser tab to the given coordinates.
   * @param x The x-coordinate to scroll to.
   * @param y The y-coordinate to scroll to.
   * @param tabId Optional. The ID of the tab. If not provided, the active tab is used.
   * @returns An `AutomationResult` indicating success or failure.
   */
  async scroll(x: number, y: number, tabId?: string): Promise<AutomationResult> {
    const code = `window.scrollTo(${x}, ${y})`;
    return this.executeJavaScript(code, tabId);
  }

  /**
   * Retrieves all cookies for the current session in the specified browser tab.
   * @param tabId Optional. The ID of the tab. If not provided, the active tab is used.
   * @returns An `AutomationResult` containing an array of cookie objects or an error message.
   */
  async getCookies(tabId?: string): Promise<AutomationResult> {
    try {
      const wc = this.getWebContents(tabId);
      if (!wc) return { success: false, message: 'Tab not found' };
      
      const cookies = await wc.session.cookies.get({});
      return { success: true, data: cookies };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }
}

export default new BrowserAutomation();
