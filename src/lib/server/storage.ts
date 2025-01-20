import { env } from "$env/dynamic/private";

interface FileSystem {
  readJSON: <T>(filename: string, defaultValue: T) => T;
  writeJSON: (filename: string, data: any) => void;
}

class RealFileSystem implements FileSystem {
  private fs: any;
  private path: any;
  private configDir: string;

  constructor(fs: any, path: any) {
    this.fs = fs;
    this.path = path;
    this.configDir = this.path.join(process.cwd(), "config");
    if (!this.fs.existsSync(this.configDir)) {
      this.fs.mkdirSync(this.configDir, { recursive: true });
    }
  }

  readJSON<T>(filename: string, defaultValue: T): T {
    const filepath = this.path.join(this.configDir, filename);
    try {
      return JSON.parse(this.fs.readFileSync(filepath, "utf-8"));
    } catch {
      return defaultValue;
    }
  }

  writeJSON(filename: string, data: any): void {
    const filepath = this.path.join(this.configDir, filename);
    this.fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
  }
}

class DummyFileSystem implements FileSystem {
  readJSON<T>(_filename: string, defaultValue: T): T {
    return defaultValue;
  }
  writeJSON(_filename: string, _data: any): void {}
}

let fileSystem: FileSystem = new DummyFileSystem();

if (env.BILIARCHIVER_ENABLE_BLACKLIST === "true") {
  const initFileSystem = async () => {
    const [fs, path] = await Promise.all([import("fs"), import("path")]);
    fileSystem = new RealFileSystem(fs, path);
  };
  initFileSystem().catch(console.error);
}

export function loadJSON<T>(filename: string, defaultValue: T): T {
  return fileSystem.readJSON(filename, defaultValue);
}

export function saveJSON(filename: string, data: any): void {
  fileSystem.writeJSON(filename, data);
}
