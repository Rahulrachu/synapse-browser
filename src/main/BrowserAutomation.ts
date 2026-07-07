import { WebContents, nativeImage } from 'electron';
import BrowserManager from './BrowserManager';

export interface AutomationResult {
  success: boolean;
  message?: string;
  data?: any;
}

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

  async getPageSource(tabId?: string): Promise<AutomationResult> {
    const code = `document.documentElement.outerHTML`;
    return this.executeJavaScript(code, tabId);
  }

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

  async scroll(x: number, y: number, tabId?: string): Promise<AutomationResult> {
    const code = `window.scrollTo(${x}, ${y})`;
    return this.executeJavaScript(code, tabId);
  }

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
