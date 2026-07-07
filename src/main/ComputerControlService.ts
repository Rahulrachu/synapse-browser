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
   * Performs mouse automation
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
   * Performs keyboard automation
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
   * Manages clipboard operations
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

  async setClipboard(content: string): Promise<void> {
    const escapedContent = content.replace(/'/g, "'\\''");
    await execAsync(`echo '${escapedContent}' | xclip -selection clipboard`);
    this.clipboardContent = content;
  }

  /**
   * Manages windows
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

  async focusWindow(windowId: string): Promise<void> {
    await execAsync(`xdotool windowactivate ${windowId}`);
  }

  async moveWindow(windowId: string, x: number, y: number): Promise<void> {
    await execAsync(`xdotool windowmove ${windowId} ${x} ${y}`);
  }

  async resizeWindow(windowId: string, width: number, height: number): Promise<void> {
    await execAsync(`xdotool windowsize ${windowId} ${width} ${height}`);
  }

  /**
   * File manager operations
   */
  async openFileManager(path?: string): Promise<void> {
    const targetPath = path || process.env.HOME || '/home/ubuntu';
    await execAsync(`xdg-open "${targetPath}"`);
  }

  async listFiles(dirPath: string): Promise<string[]> {
    try {
      const { stdout } = await execAsync(`ls -la "${dirPath}"`);
      return stdout.split('\n').filter((line) => line.trim());
    } catch {
      return [];
    }
  }

  /**
   * Terminal automation
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

  async openTerminal(): Promise<void> {
    await execAsync('x-terminal-emulator &');
  }

  /**
   * VS Code integration
   */
  async openInVSCode(filePath: string): Promise<void> {
    await execAsync(`code "${filePath}"`);
  }

  async executeVSCodeCommand(command: string): Promise<void> {
    await execAsync(`code --command "${command}"`);
  }

  /**
   * Browser automation (enhanced)
   */
  async navigateBrowser(url: string): Promise<void> {
    // This would integrate with the existing browser automation
    await execAsync(`xdg-open "${url}"`);
  }

  /**
   * Screenshot capture
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
   * OCR (Optical Character Recognition)
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
   * Screen recording
   */
  async startScreenRecording(outputPath: string): Promise<void> {
    // Use ffmpeg for screen recording
    await execAsync(
      `ffmpeg -f x11grab -s 1920x1080 -i :0 -c:v libx264 -preset fast "${outputPath}" &`
    );
  }

  async stopScreenRecording(): Promise<void> {
    await execAsync('killall ffmpeg');
  }

  /**
   * System information
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
   * Display management
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
