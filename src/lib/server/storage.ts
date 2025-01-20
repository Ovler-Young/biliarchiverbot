import { env } from "$env/dynamic/private";

interface StorageImplementation {
  initialize(): Promise<void>;
  loadJSON<T>(filename: string, defaultValue: T): Promise<T>;
  saveJSON<T>(filename: string, data: T): Promise<void>;
}

class NodeStorage implements StorageImplementation {
  private CONFIG_DIR: string;

  constructor() {
    this.CONFIG_DIR = "";
  }

  async initialize(): Promise<void> {
    const { join } = await import("path");
    const { mkdirSync, existsSync } = await import("fs");

    this.CONFIG_DIR = join(process.cwd(), "config");

    if (!existsSync(this.CONFIG_DIR)) {
      mkdirSync(this.CONFIG_DIR, { recursive: true });
    }
  }

  async loadJSON<T>(filename: string, defaultValue: T): Promise<T> {
    try {
      const { join } = await import("path");
      const { readFileSync } = await import("fs");
      const filepath = join(this.CONFIG_DIR, filename);
      return JSON.parse(readFileSync(filepath, "utf-8"));
    } catch {
      return defaultValue;
    }
  }

  async saveJSON<T>(filename: string, data: T): Promise<void> {
    try {
      const { join } = await import("path");
      const { writeFileSync } = await import("fs");
      const filepath = join(this.CONFIG_DIR, filename);
      writeFileSync(filepath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error("Failed to save:", error);
      throw error;
    }
  }
}

class ReadonlyEnv implements StorageImplementation {
  private data: Record<string, any> = {};

  constructor() {
    if (env.ADMIN_USERS) {
      this.data["admins.json"] = JSON.parse(env.ADMIN_USERS);
    }
    if (env.BLACKLIST) {
      this.data["blacklist.json"] = JSON.parse(env.BLACKLIST);
    }
  }

  async initialize(): Promise<void> {
    return;
  }

  async loadJSON<T>(_filename: string, defaultValue: T): Promise<T> {
    return this.data[_filename] ?? defaultValue;
  }

  async saveJSON<T>(_filename: string, _data: T): Promise<void> {
    return;
  }
}

const storage = env.ENABLE_STORAGE ? new NodeStorage() : new ReadonlyEnv();

if (env.ENABLE_STORAGE) {
  storage.initialize().catch(console.error);
}

export const { loadJSON, saveJSON } = storage;
