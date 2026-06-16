type Buffer = Uint8Array & {
  readonly length: number;
  slice(start?: number, end?: number): Buffer;
  toString(encoding?: string): string;
  equals(other: Uint8Array): boolean;
};

declare const process: {
  pid: number;
  cwd(): string;
  exit(code?: number): never;
  env: Record<string, string | undefined>;
};

declare const console: {
  log(...data: unknown[]): void;
  warn(...data: unknown[]): void;
  error(...data: unknown[]): void;
};

declare function setTimeout(callback: () => void, ms: number): unknown;
declare function clearTimeout(timeoutId: unknown): void;
declare class AbortController {
  readonly signal: unknown;
  abort(): void;
}
declare function fetch(input: string, init?: { method?: string; headers?: Record<string, string>; body?: string; signal?: unknown }): Promise<{ ok: boolean; status: number }>;

declare const Buffer: {
  byteLength(input: string): number;
  from(input: string | Uint8Array, encoding?: string): Buffer;
  isBuffer(input: unknown): input is Buffer;
  concat(chunks: readonly Buffer[]): Buffer;
};

declare module 'node:crypto' {
  export function createHmac(algorithm: string, key: string): { update(data: string): { digest(encoding: 'hex' | 'base64url'): string } };
  export function randomBytes(size: number): { toString(encoding: 'hex' | 'base64url'): string };
  export function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean;
}

declare module 'node:fs' {
  export function createReadStream(path: string): { pipe(destination: unknown): void };
  export const promises: {
    mkdir(path: string, options?: { recursive?: boolean }): Promise<void>;
    readFile(path: string, encoding: 'utf8'): Promise<string>;
    writeFile(path: string, data: string | Uint8Array, options?: string | { flag?: string }): Promise<void>;
    rename(oldPath: string, newPath: string): Promise<void>;
    readdir(path: string): Promise<string[]>;
    unlink(path: string): Promise<void>;
    stat(path: string): Promise<{ isFile(): boolean }>;
  };
}

declare module 'node:http' {
  export interface IncomingMessage {
    method?: string;
    url?: string;
    headers: Record<string, string | undefined>;
    socket: { remoteAddress?: string };
    [Symbol.asyncIterator](): AsyncIterableIterator<Buffer | Uint8Array | string>;
  }
  export interface ServerResponse {
    headersSent: boolean;
    setHeader(name: string, value: string | number | readonly string[]): void;
    getHeader(name: string): string | number | string[] | undefined;
    writeHead(statusCode: number): void;
    end(data?: string): void;
  }
  export function createServer(handler: (request: IncomingMessage, response: ServerResponse) => void): { listen(port: number, callback?: () => void): void };
}

declare module 'node:path' {
  export const sep: string;
  export function extname(path: string): string;
  export function join(...paths: string[]): string;
  export function normalize(path: string): string;
  export function resolve(...paths: string[]): string;
}

declare module 'node:url' {
  export class URL {
    constructor(input: string, base?: string);
    pathname: string;
    searchParams: { get(name: string): string | null };
    origin: string;
  }
}

declare module 'node:vm' {
  export function runInNewContext(code: string, context: object, options?: { timeout?: number; filename?: string }): void;
}
