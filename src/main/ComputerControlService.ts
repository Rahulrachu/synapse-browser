import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface MouseAction {
  type: 'move' | 'click' | 'double-click' | 'drag';
  x: number;
  y: number;
  button?: 'left' | 'right' | 'middle';
  duration?: number;
}

export interface KeyboardAction {
  type: 'press' | 'release' | 'type';
  key?: string;
  text?: string;
  modifiers?: ('ctrl' | 'shift' | 'alt' | 'meta')[];
}

export interface ScreenshotOptions {
  format?: 'png' | 'jpg';
  quality?: number;
  region?: { x: number; y: number; width: number; height: number };
}

export interface WindowInfo {
  id: string;
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  focused: boolean;
}

/**
 * Provides a comprehensive set of functionalities for controlling the computer system.
 * This includes mouse and keyboard automation, clipboard management, window manipulation,
 * file system operations, terminal command execution, VS Code integration, browser automation,
 * screenshot capture, OCR, screen recording, and system information retrieval.
 * It primarily uses `xdotool`, `xclip`, `wmctrl`, `xdg-open`, `tesseract`, and `ffmpeg` for its operations.
 */
export class ComputerControlService {
  private clipboardContent: string = '';
  private screenshotPath: string;

  constructor(screenshotPath: string) {
    this.screenshotPath = screenshotPath;
    this.ensureScreenshotDirectory();
  }

  private ensureScreenshotDirectory(): void {
    if (!fs.existsSync(this.screenshotPath)) {
      fs.mkdirSync(this.screenshotPath, { recursive: true });
    }
  }

  /**
   * Performs a mouse action such as move, click, double-click, or drag.
   * Utilizes `xdotool` for simulating mouse events.
   * @param action The `MouseAction` object describing the action to perform.
   * @returns A promise that resolves when the action is completed.
   */
  async performMouseAction(action: MouseAction): Promise<void> {
    // Use xdotool for Linux systems
    const commands: Record<string, string> = {
      move: `xdotool mousemove ${action.x} ${action.y}`,
      click: `xdotool mousemove ${action.x} ${action.y} click 1`,
      'double-click': `xdotool mousemove ${action.x} ${action.y} click 1 click 1`,
      drag: `xdotool mousemove ${action.x} ${action.y} mousedown 1 sleep ${(action.duration || 500) / 1000} mouseup 1`,
    };

    const command = commands[action.type];
    if (command) {
      await execAsync(command);
    }
  }

  /**
   * Performs a keyboard action such as pressing a key, releasing a key, or typing text.
   * Utilizes `xdotool` for simulating keyboard events.
   * @param action The `KeyboardAction` object describing the action to perform.
   * @returns A promise that resolves when the action is completed.
   */
  async performKeyboardAction(action: KeyboardAction): Promise<void> {
    if (action.type === 'type' && action.text) {
      // Use xdotool to type text
      const escapedText = action.text.replace(/'/g, "'\\''");
      await execAsync(`xdotool type '${escapedText}'`);
    } else if (action.type === 'press' && action.key) {
      const modifierPrefix = action.modifiers
        ? action.modifiers.map((m) => `${m}+`).join('')
        : '';
      await execAsync(`xdotool key ${modifierPrefix}${action.key}`);
    }
  }

  /**
   * Retrieves the current content of the clipboard.
   * Utilizes `xclip` for clipboard access.
   * @returns A promise that resolves to the clipboard content as a string.
   */
  async getClipboard(): Promise<string> {
    try {
      const { stdout } = await execAsync('xclip -selection clipboard -o');
      this.clipboardContent = stdout;
      return stdout;
    } catch {
      return this.clipboardContent;
    }
  }

  /**
   * Sets the content of the clipboard.
   * Utilizes `xclip` for clipboard access.
   * @param content The string content to set in the clipboard.
   * @returns A promise that resolves when the clipboard content is set.
   */
  async setClipboard(content: string): Promise<void> {
    const escapedContent = content.replace(/'/g, "'\\''");
    await execAsync(`echo '${escapedContent}' | xclip -selection clipboard`);
    this.clipboardContent = content;
  }

  /**
   * Retrieves information about the currently active window.
   * Utilizes `xdotool` for window information.
   * @returns A promise that resolves to a `WindowInfo` object or `null` if no active window is found.
   */
  async getActiveWindow(): Promise<WindowInfo | null> {
    try {
      const { stdout } = await execAsync('xdotool getactivewindow getwindowname %@');
      const windowId = stdout.trim();

      // Get window geometry
      const { stdout: geometry } = await execAsync(`xdotool getwindowgeometry ${windowId}`);

      // Parse geometry output
      const posMatch = geometry.match(/Position: (\d+),(\d+)/);
      const sizeMatch = geometry.match(/Geometry: (\d+)x(\d+)/);

      return {
        id: windowId,
        title: '',
        x: posMatch ? parseInt(posMatch[1]) : 0,
        y: posMatch ? parseInt(posMatch[2]) : 0,
        width: sizeMatch ? parseInt(sizeMatch[1]) : 0,
        height: sizeMatch ? parseInt(sizeMatch[2]) : 0,
        focused: true,
      };
    } catch {
      return null;
    }
  }

  /**
   * Lists all open windows with their basic information.
   * Utilizes `wmctrl` for listing windows.
   * @returns A promise that resolves to an array of `WindowInfo` objects.
   */
  async listWindows(): Promise<WindowInfo[]> {
    try {
      const { stdout } = await execAsync('wmctrl -l');
      const windows: WindowInfo[] = [];

      stdout.split('\n').forEach((line) => {
        if (line.trim()) {
          const parts = line.split(/\s+/);
          windows.push({
            id: parts[0],
            title: parts.slice(4).join(' '),
            x: 0,
            y: 0,
            width: 0,
            height: 0,
            focused: false,
          });
        }
      });

      return windows;
    } catch {
      return [];
    }
  }

  /**
   * Focuses a specific window by its ID.
   * Utilizes `xdotool` for focusing windows.
   * @param windowId The ID of the window to focus.
   * @returns A promise that resolves when the window is focused.
   */
  async focusWindow(windowId: string): Promise<void> {
    await execAsync(`xdotool windowactivate ${windowId}`);
  }

  /**
   * Moves a specific window to the given coordinates.
   * Utilizes `xdotool` for moving windows.
   * @param windowId The ID of the window to move.
   * @param x The new X-coordinate for the window.
   * @param y The new Y-coordinate for the window.
   * @returns A promise that resolves when the window is moved.
   */
  async moveWindow(windowId: string, x: number, y: number): Promise<void> {
    await execAsync(`xdotool windowmove ${windowId} ${x} ${y}`);
  }

  /**
   * Resizes a specific window to the given dimensions.
   * Utilizes `xdotool` for resizing windows.
   * @param windowId The ID of the window to resize.
   * @param width The new width for the window.
   * @param height The new height for the window.
   * @returns A promise that resolves when the window is resized.
   */
  async resizeWindow(windowId: string, width: number, height: number): Promise<void> {
    await execAsync(`xdotool windowsize ${windowId} ${width} ${height}`);
  }

  /**
   * Opens the file manager at a specified path or the user's home directory.
   * Utilizes `xdg-open` for opening the file manager.
   * @param path Optional. The path to open in the file manager. Defaults to the user's home directory.
   * @returns A promise that resolves when the file manager is opened.
   */
  async openFileManager(path?: string): Promise<void> {
    const targetPath = path || process.env.HOME || '/home/ubuntu';
    await execAsync(`xdg-open "${targetPath}"`);
  }

  /**
   * Lists files and directories in a given path.
   * Utilizes `ls -la` for listing files.
   * @param dirPath The path of the directory to list.
   * @returns A promise that resolves to an array of strings, each representing a file or directory entry.
   */
  async listFiles(dirPath: string): Promise<string[]> {
    try {
      const { stdout } = await execAsync(`ls -la "${dirPath}"`);
      return stdout.split('\n').filter((line) => line.trim());
    } catch {
      return [];
    }
  }

  /**
   * Executes a command in the terminal.
   * @param command The command string to execute.
   * @returns A promise that resolves to an object containing `stdout` and `stderr`.
   */
  async executeTerminalCommand(command: string): Promise<{ stdout: string; stderr: string }> {
    try {
      const { stdout, stderr } = await execAsync(command);
      return { stdout, stderr };
    } catch (err) {
      const error = err as any;
      return { stdout: error.stdout || '', stderr: error.stderr || error.message };
    }
  }

  /**
   * Opens a new terminal window.
   * @returns A promise that resolves when the terminal is opened.
   */
  async openTerminal(): Promise<void> {
    await execAsync('x-terminal-emulator &');
  }

  /**
   * Opens a file or directory in VS Code.
   * @param filePath The path to the file or directory to open.
   * @returns A promise that resolves when VS Code is opened.
   */
  async openInVSCode(filePath: string): Promise<void> {
    await execAsync(`code "${filePath}"`);
  }

  /**
   * Executes a VS Code command.
   * @param command The VS Code command string to execute.
   * @returns A promise that resolves when the command is executed.
   */
  async executeVSCodeCommand(command: string): Promise<void> {
    await execAsync(`code --command "${command}"`);
  }

  /**
   * Navigates the default browser to a specified URL.
   * Utilizes `xdg-open` for opening URLs in the default browser.
   * @param url The URL to navigate to.
   * @returns A promise that resolves when the browser is opened and navigated.
   */
  async navigateBrowser(url: string): Promise<void> {
    // This would integrate with the existing browser automation
    await execAsync(`xdg-open "${url}"`);
  }

  /**
   * Captures a screenshot of the entire screen or a specified region.
   * Utilizes `import` (ImageMagick) for screenshot capture.
   * @param options Optional. `ScreenshotOptions` to specify format, quality, and region.
   * @returns A promise that resolves to the path of the saved screenshot file.
   */
  async captureScreenshot(options?: ScreenshotOptions): Promise<string> {
    const timestamp = Date.now();
    const filename = `screenshot-${timestamp}.png`;
    const filepath = path.join(this.screenshotPath, filename);

    try {
      if (options?.region) {
        const { x, y, width, height } = options.region;
        await execAsync(
          `import -window root -crop ${width}x${height}+${x}+${y} "${filepath}"`
        );
      } else {
        await execAsync(`import -window root "${filepath}"`);
      }

      return filepath;
    } catch (err) {
      console.error('Screenshot capture failed:', err);
      throw err;
    }
  }

  /**
   * Performs Optical Character Recognition (OCR) on a given image file.
   * Utilizes `tesseract` for OCR.
   * @param imagePath The path to the image file.
   * @returns A promise that resolves to the extracted text content from the image.
   */
  async performOCR(imagePath: string): Promise<string> {
    try {
      const { stdout } = await execAsync(`tesseract "${imagePath}" stdout`);
      return stdout;
    } catch (err) {
      console.error('OCR failed:', err);
      return '';
    }
  }

  /**
   * Starts recording the screen to a specified output path.
   * Utilizes `ffmpeg` for screen recording.
   * @param outputPath The path to save the screen recording file.
   * @returns A promise that resolves when the recording starts.
   */
  async startScreenRecording(outputPath: string): Promise<void> {
    // Use ffmpeg for screen recording
    await execAsync(
      `ffmpeg -f x11grab -s 1920x1080 -i :0 -c:v libx264 -preset fast "${outputPath}" &`
    );
  }

  /**
   * Stops the ongoing screen recording.
   * Utilizes `killall ffmpeg` to terminate the recording process.
   * @returns A promise that resolves when the recording is stopped.
   */
  async stopScreenRecording(): Promise<void> {
    await execAsync('killall ffmpeg');
  }

  /**
   * Retrieves various system information such as OS, memory, and CPU cores.
   * Utilizes `uname`, `free`, and `nproc` commands.
   * @returns A promise that resolves to an object containing system information.
   */
  async getSystemInfo(): Promise<Record<string, any>> {
    try {
      const { stdout: osInfo } = await execAsync('uname -a');
      const { stdout: memInfo } = await execAsync('free -h');
      const { stdout: cpuInfo } = await execAsync('nproc');

      return {
        os: osInfo.trim(),
        memory: memInfo.trim(),
        cpuCores: cpuInfo.trim(),
      };
    } catch {
      return {};
    }
  }

  /**
   * Retrieves information about connected displays.
   * Utilizes `xrandr` for display information.
   * @returns A promise that resolves to an object containing display information.
   */
  async getDisplayInfo(): Promise<Record<string, any>> {
    try {
      const { stdout } = await execAsync('xrandr');
      return { displays: stdout };
    } catch {
      return {};
    }
  }
}
