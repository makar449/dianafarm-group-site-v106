import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { createReadStream, promises as fsPromises } from 'node:fs';
import { createServer, IncomingMessage, ServerResponse } from 'node:http';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { URL } from 'node:url';
import vm from 'node:vm';

const { mkdir, readFile, writeFile, rename, stat, readdir, unlink } = fsPromises;

type JsonPrimitive = string | number | boolean | null;
type JsonValue = JsonPrimitive | JsonObject | JsonValue[];
interface JsonObject { [key: string]: JsonValue; }

interface RuntimeConfig {
  readonly env: 'production' | 'development' | 'test';
  readonly port: number;
  readonly publicOrigin: string;
  readonly adminPassword: string;
  readonly sessionSecret: string;
  readonly storageDir: string;
  readonly publicDir: string;
  readonly maxJsonBytes: number;
  readonly maxMediaBytes: number;
  readonly leadWebhookUrl: string;
  readonly corsOrigin: string;
  readonly cookieSecure: boolean;
}

interface SessionRecord {
  readonly id: string;
  readonly csrfToken: string;
  readonly createdAt: number;
  readonly expiresAt: number;
  readonly ip: string;
  readonly userAgent: string;
}

interface RateBucket {
  count: number;
  resetAt: number;
}

interface LeadRecord extends JsonObject {
  id: string;
  createdAt: string;
  type: string;
  status: string;
  lang: string;
  page: string;
  data: JsonObject;
  deliveryStatus: string;
  deliveryAttempts: number;
  lastDeliveryAt: string;
  nextRetryAt: string;
  deliveryError: string;
}

interface ReviewRecord extends JsonObject {
  id: string;
  createdAt: string;
  status: string;
  visible: boolean;
  rating: number;
  author: string;
  country: string;
  service: string;
  text: JsonObject;
}

interface MediaRecord extends JsonObject {
  id: string;
  createdAt: string;
  path: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
}

interface UniversalEditsRecord extends JsonObject {
  version: string;
  updatedAt: string;
  content: JsonObject;
  design: JsonObject;
}

class HttpError extends Error {
  public readonly status: number;
  public readonly code: string;

  public constructor(status: number, code: string, message: string) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.code = code;
  }
}

const APP_VERSION = 'v300-real-admin-sync';
const sessions = new Map<string, SessionRecord>();
const rateBuckets = new Map<string, RateBucket>();
const ONE_HOUR_MS = 60 * 60 * 1000;
const SESSION_TTL_MS = 8 * ONE_HOUR_MS;
const PUBLIC_CONTENT_TYPES: Readonly<Record<string, string>> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml; charset=utf-8',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.pdf': 'application/pdf',
  '.woff2': 'font/woff2'
};
const ALLOWED_MEDIA_TYPES: Readonly<Record<string, string>> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'application/pdf': 'pdf'
};
const CONTENT_DIRECTORY_NAMES = new Set<string>([
  'version',
  'updatedAt',
  'settings',
  'sitePages',
  'homeBlocks',
  'services',
  'realEstate',
  'cars',
  'parkings',
  'b2bOffers',
  'promotions',
  'blogArticles',
  'blogTopics',
  'reviews',
  'socialLinks',
  'seo'
]);

async function main(): Promise<void> {
  await loadEnvFiles(process.cwd());
  const config = readRuntimeConfig();
  await ensureDirectory(config.storageDir);
  await ensureDirectory(join(config.storageDir, 'content'));
  await ensureDirectory(join(config.storageDir, 'leads'));
  await ensureDirectory(join(config.storageDir, 'versions'));
  await ensureDirectory(join(config.storageDir, 'audit'));
  await ensureDirectory(join(config.publicDir, 'uploads'));
  await initializeContentStore(config);
  await loadPersistentSessions(config);
  windowlessRetryLeadWebhooks(config).catch((error: unknown) => console.warn('[dianafarm] initial webhook retry failed', error));
  const retryTimer = setInterval(() => { windowlessRetryLeadWebhooks(config).catch((error: unknown) => console.warn('[dianafarm] scheduled webhook retry failed', error)); }, 5 * 60 * 1000);
  if (typeof (retryTimer as unknown as { unref?: () => void }).unref === 'function') (retryTimer as unknown as { unref: () => void }).unref();

  const server = createServer((request, response) => {
    handleRequest(config, request, response).catch((error: unknown) => {
      respondError(response, error);
    });
  });

  server.listen(config.port, () => {
    console.log(`[dianafarm] production server listening on http://localhost:${config.port}`);
    console.log(`[dianafarm] public dir: ${config.publicDir}`);
    console.log(`[dianafarm] storage dir: ${config.storageDir}`);
  });
}

async function loadEnvFiles(rootDir: string): Promise<void> {
  const files = ['.env.production.local', '.env.local', '.env'];
  for (const file of files) {
    const path = join(rootDir, file);
    const content = await readFile(path, 'utf8').catch(() => '');
    if (!content) continue;
    for (const rawLine of content.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#')) continue;
      const equalIndex = line.indexOf('=');
      if (equalIndex <= 0) continue;
      const key = line.slice(0, equalIndex).trim();
      const rawValue = line.slice(equalIndex + 1).trim();
      const value = rawValue.replace(/^['"]|['"]$/g, '');
      if (!process.env[key]) process.env[key] = value;
    }
  }
}

function readRuntimeConfig(): RuntimeConfig {
  const env = readStringEnv('DFG_NODE_ENV', 'production');
  const normalizedEnv = env === 'development' || env === 'test' ? env : 'production';
  const port = readIntegerEnv('DFG_PORT', 8080, 1, 65535);
  const publicOrigin = readStringEnv('DFG_PUBLIC_ORIGIN', `http://localhost:${port}`);
  const adminPassword = readRequiredEnv('DFG_ADMIN_PASSWORD');
  const sessionSecret = readRequiredEnv('DFG_SESSION_SECRET');
  const storageDir = resolve(readStringEnv('DFG_STORAGE_DIR', './data'));
  const publicDir = resolve(readStringEnv('DFG_PUBLIC_DIR', process.cwd()));
  const maxJsonBytes = readIntegerEnv('DFG_MAX_JSON_BYTES', 5 * 1024 * 1024, 1024, 20 * 1024 * 1024);
  const maxMediaBytes = readIntegerEnv('DFG_MAX_MEDIA_BYTES', 8 * 1024 * 1024, 1024, 25 * 1024 * 1024);
  const leadWebhookUrl = readStringEnv('DFG_LEAD_WEBHOOK_URL', '');
  const corsOrigin = readStringEnv('DFG_CORS_ORIGIN', '');

  if (adminPassword.length < 16) {
    throw new Error('DFG_ADMIN_PASSWORD must be at least 16 characters long. Do not use the old frontend password.');
  }
  if (sessionSecret.length < 48) {
    throw new Error('DFG_SESSION_SECRET must be at least 48 characters long. Use a random 64+ character value.');
  }
  if (/replace|dianafarm2026|password/i.test(adminPassword)) {
    throw new Error('DFG_ADMIN_PASSWORD is insecure. Replace it with a private production password.');
  }
  if (/replace|secret|password/i.test(sessionSecret)) {
    throw new Error('DFG_SESSION_SECRET is insecure. Replace it with a random production secret.');
  }

  return {
    env: normalizedEnv,
    port,
    publicOrigin,
    adminPassword,
    sessionSecret,
    storageDir,
    publicDir,
    maxJsonBytes,
    maxMediaBytes,
    leadWebhookUrl,
    corsOrigin,
    cookieSecure: publicOrigin.startsWith('https://')
  };
}

function readRequiredEnv(key: string): string {
  const value = process.env[key];
  if (!value || !value.trim()) throw new Error(`${key} is required`);
  return value.trim();
}

function readStringEnv(key: string, fallback: string): string {
  const value = process.env[key];
  return value && value.trim() ? value.trim() : fallback;
}

function readIntegerEnv(key: string, fallback: number, min: number, max: number): number {
  const value = process.env[key];
  const parsed = value ? Number.parseInt(value, 10) : fallback;
  if (!Number.isFinite(parsed) || parsed < min || parsed > max) return fallback;
  return parsed;
}

async function handleRequest(config: RuntimeConfig, request: IncomingMessage, response: ServerResponse): Promise<void> {
  const method = request.method || 'GET';
  const requestUrl = new URL(request.url || '/', config.publicOrigin);
  const pathname = decodeURIComponent(requestUrl.pathname);
  setSecurityHeaders(response, config);

  if (method === 'OPTIONS') {
    response.writeHead(204);
    response.end();
    return;
  }

  if (pathname === '/api/health' && method === 'GET') {
    respondJson(response, 200, { ok: true, version: APP_VERSION, time: new Date().toISOString() });
    return;
  }

  if (pathname === '/api/site-data' && method === 'GET') {
    const siteData = await readSiteData(config);
    respondJson(response, 200, sanitizePublicSiteData(siteData));
    return;
  }

  if (pathname === '/api/universal-edits' && method === 'GET') {
    respondJson(response, 200, await readUniversalEdits(config));
    return;
  }

  if (pathname === '/api/reviews' && method === 'GET') {
    const status = requestUrl.searchParams.get('status') || 'approved';
    const reviews = await readReviews(config, status);
    respondJson(response, 200, reviews);
    return;
  }

  if (pathname === '/api/leads' && method === 'POST') {
    applyRateLimit(`lead:${clientIp(request)}`, 8, 10 * 60 * 1000);
    const body = await readJsonBody(request, config.maxJsonBytes);
    let lead = normalizeLead(body, request);
    lead = await deliverLeadWebhook(config, lead);
    await saveLead(config, lead);
    respondJson(response, 201, { ok: true, id: lead.id, deliveryStatus: lead.deliveryStatus, deliveryAttempts: lead.deliveryAttempts });
    return;
  }

  if (pathname === '/api/admin/login' && method === 'POST') {
    applyRateLimit(`login:${clientIp(request)}`, 6, 15 * 60 * 1000);
    const body = await readJsonBody(request, 4096);
    if (!isJsonObject(body)) throw new HttpError(400, 'INVALID_LOGIN_PAYLOAD', 'Login payload must be an object.');
    const password = getString(body, 'password', 256);
    if (!safeEqualText(password, config.adminPassword)) throw new HttpError(401, 'INVALID_CREDENTIALS', 'Неверный пароль администратора.');
    const session = createSession(request);
    sessions.set(session.id, session);
    await savePersistentSessions(config);
    await appendAudit(config, 'admin.login', { ip: session.ip, userAgent: session.userAgent });
    setCookie(response, 'dfg_session', signSessionId(config, session.id), {
      httpOnly: true,
      secure: config.cookieSecure,
      sameSite: 'Lax',
      path: '/',
      maxAge: Math.floor(SESSION_TTL_MS / 1000)
    });
    setCookie(response, 'dfg_csrf', session.csrfToken, {
      httpOnly: false,
      secure: config.cookieSecure,
      sameSite: 'Lax',
      path: '/',
      maxAge: Math.floor(SESSION_TTL_MS / 1000)
    });
    respondJson(response, 200, { ok: true, csrfToken: session.csrfToken, expiresAt: session.expiresAt });
    return;
  }

  if (pathname === '/api/admin/session' && method === 'GET') {
    const session = requireSession(config, request);
    respondJson(response, 200, { ok: true, csrfToken: session.csrfToken, expiresAt: session.expiresAt });
    return;
  }

  if (pathname === '/api/admin/logout' && method === 'POST') {
    const session = requireSession(config, request);
    requireCsrf(request, session);
    sessions.delete(session.id);
    await savePersistentSessions(config);
    await appendAudit(config, 'admin.logout', { sessionId: session.id });
    clearCookie(response, 'dfg_session', config.cookieSecure);
    clearCookie(response, 'dfg_csrf', config.cookieSecure);
    respondJson(response, 200, { ok: true });
    return;
  }

  if (pathname === '/api/admin/site-data' && method === 'GET') {
    requireSession(config, request);
    respondJson(response, 200, await readSiteData(config));
    return;
  }

  if (pathname === '/api/admin/site-data' && method === 'PUT') {
    const session = requireSession(config, request);
    requireCsrf(request, session);
    const body = await readJsonBody(request, config.maxJsonBytes);
    const siteData = normalizeSiteData(body);
    const versionId = await writeSiteData(config, siteData);
    await appendAudit(config, 'site-data.publish', { versionId, updatedAt: siteData.updatedAt || new Date().toISOString() });
    respondJson(response, 200, { ok: true, versionId, updatedAt: siteData.updatedAt || new Date().toISOString() });
    return;
  }

  if (pathname === '/api/admin/leads' && method === 'GET') {
    requireSession(config, request);
    respondJson(response, 200, await readLeads(config));
    return;
  }

  if (pathname.startsWith('/api/admin/leads/') && method === 'PATCH') {
    const session = requireSession(config, request);
    requireCsrf(request, session);
    const id = pathname.slice('/api/admin/leads/'.length);
    const body = await readJsonBody(request, 4096);
    if (!isJsonObject(body)) throw new HttpError(400, 'INVALID_STATUS_PAYLOAD', 'Status payload must be an object.');
    const status = getString(body, 'status', 40);
    await updateLeadStatus(config, id, status);
    respondJson(response, 200, { ok: true });
    return;
  }

  if (pathname.startsWith('/api/admin/leads/') && method === 'DELETE') {
    const session = requireSession(config, request);
    requireCsrf(request, session);
    const id = pathname.slice('/api/admin/leads/'.length);
    await deleteLead(config, id);
    respondJson(response, 200, { ok: true });
    return;
  }

  if (pathname === '/api/admin/reviews' && method === 'GET') {
    requireSession(config, request);
    respondJson(response, 200, await readReviews(config, 'all'));
    return;
  }

  if (pathname === '/api/admin/reviews' && method === 'PUT') {
    const session = requireSession(config, request);
    requireCsrf(request, session);
    const body = await readJsonBody(request, config.maxJsonBytes);
    const review = normalizeReview(body);
    await upsertReview(config, review);
    respondJson(response, 200, { ok: true, id: review.id });
    return;
  }

  if (pathname.startsWith('/api/admin/reviews/') && method === 'DELETE') {
    const session = requireSession(config, request);
    requireCsrf(request, session);
    const id = pathname.slice('/api/admin/reviews/'.length);
    await deleteReview(config, id);
    respondJson(response, 200, { ok: true });
    return;
  }

  if (pathname === '/api/admin/universal-edits' && method === 'GET') {
    requireSession(config, request);
    respondJson(response, 200, await readUniversalEdits(config));
    return;
  }

  if (pathname === '/api/admin/universal-edits' && method === 'PUT') {
    const session = requireSession(config, request);
    requireCsrf(request, session);
    const body = await readJsonBody(request, config.maxJsonBytes);
    const edits = normalizeUniversalEdits(body);
    const versionId = await writeUniversalEdits(config, edits);
    await appendAudit(config, 'universal-edits.publish', { versionId, updatedAt: edits.updatedAt });
    respondJson(response, 200, { ok: true, versionId, updatedAt: edits.updatedAt });
    return;
  }

  if (pathname === '/api/admin/audit-log' && method === 'GET') {
    requireSession(config, request);
    respondJson(response, 200, await readAudit(config));
    return;
  }

  if (pathname === '/api/admin/content-versions' && method === 'GET') {
    requireSession(config, request);
    respondJson(response, 200, await listContentVersions(config));
    return;
  }

  if (pathname.startsWith('/api/admin/content-versions/') && pathname.endsWith('/rollback') && method === 'POST') {
    const session = requireSession(config, request);
    requireCsrf(request, session);
    const versionId = safeFileToken(pathname.slice('/api/admin/content-versions/'.length, -'/rollback'.length));
    await rollbackContentVersion(config, versionId);
    await appendAudit(config, 'site-data.rollback', { versionId });
    respondJson(response, 200, { ok: true, versionId });
    return;
  }

  if (pathname === '/api/admin/media' && method === 'POST') {
    const session = requireSession(config, request);
    requireCsrf(request, session);
    const body = await readJsonBody(request, config.maxJsonBytes + config.maxMediaBytes);
    const media = await saveMedia(config, body);
    await appendAudit(config, 'media.upload', { id: media.id, path: media.path, sizeBytes: media.sizeBytes, mimeType: media.mimeType });
    respondJson(response, 201, media);
    return;
  }

  await serveStatic(config, request, response, pathname);
}

function setSecurityHeaders(response: ServerResponse, config: RuntimeConfig): void {
  if (config.corsOrigin) {
    response.setHeader('Access-Control-Allow-Origin', config.corsOrigin);
    response.setHeader('Access-Control-Allow-Credentials', 'true');
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-CSRF-Token');
    response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  }
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.setHeader('X-Frame-Options', 'SAMEORIGIN');
  response.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  response.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
  const extraConnect = [config.leadWebhookUrl ? new URL(config.leadWebhookUrl).origin : '', config.corsOrigin].filter(Boolean).join(' ');
  const connectSrc = extraConnect ? ` 'self' ${extraConnect}` : " 'self'";
  response.setHeader('Content-Security-Policy', `default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data:; connect-src${connectSrc}; frame-ancestors 'self'; base-uri 'self'; form-action 'self'`);
}

async function serveStatic(config: RuntimeConfig, request: IncomingMessage, response: ServerResponse, pathname: string): Promise<void> {
  if ((request.method || 'GET') !== 'GET' && (request.method || 'GET') !== 'HEAD') throw new HttpError(405, 'METHOD_NOT_ALLOWED', 'Method not allowed.');
  const safePathname = pathname === '/' ? '/index.html' : pathname;
  const resolvedPath = resolve(config.publicDir, `.${safePathname}`);
  if (!isPathInside(resolvedPath, config.publicDir)) throw new HttpError(403, 'FORBIDDEN', 'Forbidden.');
  if (isDeniedStaticPath(resolvedPath, config.publicDir)) throw new HttpError(404, 'NOT_FOUND', 'Not found.');
  const fileStat = await stat(resolvedPath).catch(() => null);
  if (!fileStat || !fileStat.isFile()) throw new HttpError(404, 'NOT_FOUND', 'Not found.');
  const extension = extname(resolvedPath).toLowerCase();
  response.setHeader('Content-Type', PUBLIC_CONTENT_TYPES[extension] || 'application/octet-stream');
  if (resolvedPath.includes(`${sep}assets${sep}`) || resolvedPath.includes(`${sep}uploads${sep}`)) {
    response.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  } else {
    response.setHeader('Cache-Control', 'no-cache, must-revalidate');
  }
  if (shouldRewritePublicOrigin(resolvedPath, extension)) {
    const text = await readFile(resolvedPath, 'utf8');
    const rewritten = rewritePublicOrigin(text, config);
    response.setHeader('Content-Length', Buffer.byteLength(rewritten));
    response.writeHead(200);
    if ((request.method || 'GET') === 'HEAD') {
      response.end();
      return;
    }
    response.end(rewritten);
    return;
  }
  response.writeHead(200);
  if ((request.method || 'GET') === 'HEAD') {
    response.end();
    return;
  }
  createReadStream(resolvedPath).pipe(response);
}

function shouldRewritePublicOrigin(resolvedPath: string, extension: string): boolean {
  if (resolvedPath.includes(`${sep}assets${sep}`) || resolvedPath.includes(`${sep}uploads${sep}`)) return false;
  return extension === '.html' || extension === '.xml' || extension === '.txt';
}

function rewritePublicOrigin(content: string, config: RuntimeConfig): string {
  const origin = config.publicOrigin.replace(/\/$/, '');
  return content
    .replace(/__DFG_PUBLIC_ORIGIN__/g, origin);
}

function isDeniedStaticPath(resolvedPath: string, publicDir: string): boolean {
  const relative = resolvedPath.slice(publicDir.length + 1).replace(/\\/g, '/');
  if (!relative) return true;
  if (relative.startsWith('.')) return true;
  return relative.startsWith('server/') ||
    relative.startsWith('data/') ||
    relative.startsWith('content/') ||
    relative.startsWith('tools/') ||
    relative.startsWith('sql/') ||
    relative.startsWith('dist/') ||
    relative === 'package.json' ||
    relative === 'package-lock.json' ||
    relative === 'tsconfig.json' ||
    relative.endsWith('.md') ||
    relative.includes('/.') ||
    relative.startsWith('.env');
}

function isPathInside(child: string, parent: string): boolean {
  const normalizedChild = normalize(child);
  const normalizedParent = normalize(parent);
  return normalizedChild === normalizedParent || normalizedChild.startsWith(`${normalizedParent}${sep}`);
}

async function initializeContentStore(config: RuntimeConfig): Promise<void> {
  const contentDir = join(config.storageDir, 'content');
  const existing = await readdir(contentDir).catch(() => [] as string[]);
  if (existing.some((file) => file.endsWith('.json'))) return;
  const defaultData = await loadDefaultData(config.publicDir);
  await writeSiteData(config, defaultData);
}

async function loadDefaultData(publicDir: string): Promise<JsonObject> {
  const dataJsPath = join(publicDir, 'assets', 'js', 'data.js');
  const source = await readFile(dataJsPath, 'utf8');
  const context: { window: Record<string, unknown> } = { window: {} };
  vm.runInNewContext(source, context, { timeout: 1500, filename: 'data.js' });
  const candidate = context.window.DFG_DEFAULT_DATA;
  if (!isJsonObject(candidate)) throw new Error('assets/js/data.js does not expose window.DFG_DEFAULT_DATA as an object.');
  return removeFrontendSecrets(candidate);
}

async function readSiteData(config: RuntimeConfig): Promise<JsonObject> {
  const contentDir = join(config.storageDir, 'content');
  const files = await readdir(contentDir).catch(() => [] as string[]);
  const result: JsonObject = {};
  for (const file of files.filter((entry) => entry.endsWith('.json')).sort()) {
    const key = file.slice(0, -'.json'.length);
    const value = await readJsonFile(join(contentDir, file), null);
    if (isJsonValue(value)) result[key] = value;
  }
  return removeFrontendSecrets(result);
}

async function writeSiteData(config: RuntimeConfig, siteData: JsonObject): Promise<string> {
  const contentDir = join(config.storageDir, 'content');
  await ensureDirectory(contentDir);
  const sanitized = removeFrontendSecrets({ ...siteData, version: APP_VERSION, updatedAt: new Date().toISOString() });
  const versionId = await saveContentVersion(config, 'site-data', sanitized);
  const existing = await readdir(contentDir).catch(() => [] as string[]);
  const nextKeys = new Set(Object.keys(sanitized));
  for (const key of Object.keys(sanitized)) {
    const safeKey = safeFileToken(CONTENT_DIRECTORY_NAMES.has(key) ? key : key);
    await writeJsonFile(join(contentDir, `${safeKey}.json`), sanitized[key] as JsonValue);
  }
  for (const file of existing.filter((entry) => entry.endsWith('.json'))) {
    const key = file.slice(0, -'.json'.length);
    if (!nextKeys.has(key)) await unlink(join(contentDir, file)).catch(() => undefined);
  }
  return versionId;
}

function normalizeSiteData(value: unknown): JsonObject {
  if (!isJsonObject(value)) throw new HttpError(400, 'INVALID_SITE_DATA', 'Site data must be a JSON object.');
  const sanitized = sanitizeJson(value, 12, 300000) as JsonObject;
  return removeFrontendSecrets(sanitized);
}

function sanitizePublicSiteData(siteData: JsonObject): JsonObject {
  const sanitized = removeFrontendSecrets(siteData);
  const settings = isJsonObject(sanitized.settings) ? { ...sanitized.settings } : {};
  delete settings.integrations;
  sanitized.settings = settings;
  return sanitized;
}

function removeFrontendSecrets(siteData: JsonObject): JsonObject {
  const copy = deepCloneJsonObject(siteData);
  if (isJsonObject(copy.settings)) {
    delete copy.settings.adminPassword;
    if (isJsonObject(copy.settings.integrations)) {
      delete copy.settings.integrations.leadWebhookUrl;
      delete copy.settings.integrations.notificationEmail;
    }
  }
  return copy;
}


async function readUniversalEdits(config: RuntimeConfig): Promise<UniversalEditsRecord> {
  const value = await readJsonFile(join(config.storageDir, 'universal-edits.json'), null);
  if (isUniversalEditsRecord(value)) return value;
  return {
    version: APP_VERSION,
    updatedAt: new Date(0).toISOString(),
    content: {},
    design: {}
  };
}

async function writeUniversalEdits(config: RuntimeConfig, edits: UniversalEditsRecord): Promise<string> {
  const versionId = await saveContentVersion(config, 'universal-edits', edits);
  await writeJsonFile(join(config.storageDir, 'universal-edits.json'), edits);
  return versionId;
}

function normalizeUniversalEdits(value: unknown): UniversalEditsRecord {
  if (!isJsonObject(value)) throw new HttpError(400, 'INVALID_UNIVERSAL_EDITS', 'Universal edits payload must be an object.');
  const contentRaw = isJsonObject(value.content) ? value.content : {};
  const designRaw = isJsonObject(value.design) ? value.design : {};
  const content = sanitizeJson(contentRaw, 8, 12000);
  const design = sanitizeJson(designRaw, 4, 2000);
  if (!isJsonObject(content) || !isJsonObject(design)) throw new HttpError(400, 'INVALID_UNIVERSAL_EDITS_SHAPE', 'Universal edits must contain content/design objects.');
  return {
    version: APP_VERSION,
    updatedAt: new Date().toISOString(),
    content,
    design
  };
}

function isUniversalEditsRecord(value: unknown): value is UniversalEditsRecord {
  return isJsonObject(value) &&
    typeof value.version === 'string' &&
    typeof value.updatedAt === 'string' &&
    isJsonObject(value.content) &&
    isJsonObject(value.design);
}

async function readLeads(config: RuntimeConfig): Promise<LeadRecord[]> {
  const filePath = join(config.storageDir, 'leads', 'leads.json');
  const value = await readJsonFile(filePath, []);
  if (!Array.isArray(value)) return [];
  return value.filter(isLeadRecord).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

async function saveLead(config: RuntimeConfig, lead: LeadRecord): Promise<void> {
  const leads = await readLeads(config);
  const deduped = leads.filter((entry) => entry.id !== lead.id);
  deduped.unshift(lead);
  await writeJsonFile(join(config.storageDir, 'leads', 'leads.json'), deduped.slice(0, 2000));
}

async function updateLeadStatus(config: RuntimeConfig, id: string, status: string): Promise<void> {
  const allowed = new Set(['new', 'in_progress', 'done', 'archived', 'spam']);
  if (!allowed.has(status)) throw new HttpError(400, 'INVALID_STATUS', 'Invalid lead status.');
  const leads = await readLeads(config);
  const index = leads.findIndex((lead) => lead.id === id);
  if (index < 0) throw new HttpError(404, 'LEAD_NOT_FOUND', 'Lead not found.');
  const current = leads[index];
  if (!current) throw new HttpError(404, 'LEAD_NOT_FOUND', 'Lead not found.');
  leads[index] = { ...current, status };
  await writeJsonFile(join(config.storageDir, 'leads', 'leads.json'), leads);
}

async function deleteLead(config: RuntimeConfig, id: string): Promise<void> {
  const leads = await readLeads(config);
  await writeJsonFile(join(config.storageDir, 'leads', 'leads.json'), leads.filter((lead) => lead.id !== id));
}

function normalizeLead(value: unknown, request: IncomingMessage): LeadRecord {
  if (!isJsonObject(value)) throw new HttpError(400, 'INVALID_LEAD', 'Lead payload must be an object.');
  const data = isJsonObject(value.data) ? sanitizeJson(value.data, 5, 10000) : {};
  if (!isJsonObject(data)) throw new HttpError(400, 'INVALID_LEAD_DATA', 'Lead data must be an object.');
  validateLeadContacts(data);
  return {
    id: safeId(getString(value, 'id', 120) || `lead-${Date.now()}-${randomBytes(6).toString('hex')}`),
    createdAt: new Date().toISOString(),
    type: normalizeText(getString(value, 'type', 80) || 'consultation', 80),
    status: 'new',
    lang: normalizeText(getString(value, 'lang', 12) || 'ru', 12),
    page: normalizeText(getString(value, 'page', 600) || request.headers.referer || '', 600),
    data,
    deliveryStatus: 'server_saved',
    deliveryAttempts: 0,
    lastDeliveryAt: '',
    nextRetryAt: '',
    deliveryError: ''
  };
}

function validateLeadContacts(data: JsonObject): void {
  const name = firstStringField(data, ['name', 'fullName', 'clientName', 'Имя']);
  const phone = firstStringField(data, ['phone', 'tel', 'telephone', 'Телефон']);
  const email = firstStringField(data, ['email', 'mail', 'E-mail']);
  if (name && name.length < 2) throw new HttpError(400, 'INVALID_NAME', 'Name is too short.');
  if (phone) {
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 7 || digits.length > 18) throw new HttpError(400, 'INVALID_PHONE', 'Phone is invalid.');
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new HttpError(400, 'INVALID_EMAIL', 'Email is invalid.');
}

function firstStringField(data: JsonObject, keys: string[]): string {
  for (const key of keys) {
    const value = data[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
}

async function deliverLeadWebhook(config: RuntimeConfig, lead: LeadRecord): Promise<LeadRecord> {
  if (!config.leadWebhookUrl) return { ...lead, deliveryStatus: 'server_saved', deliveryError: '', nextRetryAt: '' };
  const attempts = Number.isFinite(lead.deliveryAttempts) ? lead.deliveryAttempts + 1 : 1;
  const now = new Date().toISOString();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 6000);
  try {
    const response = await fetch(config.leadWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ source: 'DIANAFARM GROUP production backend', lead: { ...lead, deliveryAttempts: attempts } }),
      signal: controller.signal
    });
    if (!response.ok) throw new Error(`Webhook rejected lead with HTTP ${response.status}`);
    return { ...lead, deliveryStatus: 'webhook_sent', deliveryAttempts: attempts, lastDeliveryAt: now, nextRetryAt: '', deliveryError: '' };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Webhook delivery failed';
    const retryDelayMs = Math.min(60 * 60 * 1000, Math.max(60 * 1000, attempts * attempts * 60 * 1000));
    return { ...lead, deliveryStatus: 'webhook_failed', deliveryAttempts: attempts, lastDeliveryAt: now, nextRetryAt: new Date(Date.now() + retryDelayMs).toISOString(), deliveryError: normalizeText(message, 500) };
  } finally {
    clearTimeout(timer);
  }
}

async function windowlessRetryLeadWebhooks(config: RuntimeConfig): Promise<void> {
  if (!config.leadWebhookUrl) return;
  const leads = await readLeads(config);
  let changed = false;
  const now = Date.now();
  const next: LeadRecord[] = [];
  for (const lead of leads) {
    if (lead.deliveryStatus === 'webhook_failed' && (!lead.nextRetryAt || Date.parse(lead.nextRetryAt) <= now) && lead.deliveryAttempts < 10) {
      const delivered = await deliverLeadWebhook(config, lead);
      next.push(delivered);
      changed = true;
    } else {
      next.push(lead);
    }
  }
  if (changed) await writeJsonFile(join(config.storageDir, 'leads', 'leads.json'), next);
}

async function readReviews(config: RuntimeConfig, status: string): Promise<ReviewRecord[]> {
  const siteData = await readSiteData(config);
  const reviews = Array.isArray(siteData.reviews) ? siteData.reviews.filter(isReviewRecord) : [];
  if (status === 'all') return reviews.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return reviews.filter((review) => review.status === status && review.visible !== false).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

async function upsertReview(config: RuntimeConfig, review: ReviewRecord): Promise<void> {
  const siteData = await readSiteData(config);
  const reviews = Array.isArray(siteData.reviews) ? siteData.reviews.filter(isReviewRecord) : [];
  const index = reviews.findIndex((entry) => entry.id === review.id);
  if (index >= 0) reviews[index] = review;
  else reviews.unshift(review);
  siteData.reviews = reviews;
  await writeSiteData(config, siteData);
}

async function deleteReview(config: RuntimeConfig, id: string): Promise<void> {
  const siteData = await readSiteData(config);
  const reviews = Array.isArray(siteData.reviews) ? siteData.reviews.filter(isReviewRecord) : [];
  siteData.reviews = reviews.filter((review) => review.id !== id);
  await writeSiteData(config, siteData);
}

function normalizeReview(value: unknown): ReviewRecord {
  if (!isJsonObject(value)) throw new HttpError(400, 'INVALID_REVIEW', 'Review payload must be an object.');
  const status = getString(value, 'status', 40) || 'pending';
  if (!new Set(['pending', 'approved', 'rejected']).has(status)) throw new HttpError(400, 'INVALID_REVIEW_STATUS', 'Invalid review status.');
  const textValue = value.text;
  return {
    id: safeId(getString(value, 'id', 120) || `review-${Date.now()}-${randomBytes(5).toString('hex')}`),
    createdAt: getIsoDate(value, 'createdAt') || new Date().toISOString(),
    status,
    visible: getBoolean(value, 'visible', false),
    rating: clampInteger(getNumber(value, 'rating', 5), 1, 5),
    author: normalizeText(getString(value, 'author', 160), 160),
    country: normalizeText(getString(value, 'country', 160), 160),
    service: normalizeText(getString(value, 'service', 220), 220),
    text: isJsonObject(textValue) ? sanitizeJson(textValue, 3, 4000) as JsonObject : {}
  };
}

async function saveMedia(config: RuntimeConfig, value: unknown): Promise<MediaRecord> {
  if (!isJsonObject(value)) throw new HttpError(400, 'INVALID_MEDIA', 'Media payload must be an object.');
  const originalName = normalizeText(getString(value, 'fileName', 180) || 'upload', 180);
  const mimeType = normalizeText(getString(value, 'mimeType', 80), 80);
  const base64 = getString(value, 'base64', Math.ceil(config.maxMediaBytes * 1.4) + 128);
  const extension = ALLOWED_MEDIA_TYPES[mimeType];
  if (!extension) throw new HttpError(400, 'UNSUPPORTED_MEDIA_TYPE', 'Only JPEG, PNG, WebP and PDF uploads are allowed.');
  const binary = Buffer.from(base64.replace(/^data:[^;]+;base64,/, ''), 'base64');
  if (!binary.length || binary.length > config.maxMediaBytes) throw new HttpError(413, 'MEDIA_TOO_LARGE', 'Media file is too large.');
  assertMagicBytes(binary, mimeType);
  const now = new Date();
  const directory = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
  const id = `media-${Date.now()}-${randomBytes(8).toString('hex')}`;
  const fileName = `${id}.${extension}`;
  const uploadDir = join(config.publicDir, 'uploads', directory);
  await ensureDirectory(uploadDir);
  const outputPath = join(uploadDir, fileName);
  await writeFile(outputPath, binary, { flag: 'wx' });
  const record: MediaRecord = {
    id,
    createdAt: now.toISOString(),
    path: `/uploads/${directory}/${fileName}`,
    originalName,
    mimeType,
    sizeBytes: binary.length
  };
  const mediaIndexPath = join(config.storageDir, 'media.json');
  const current = await readJsonFile(mediaIndexPath, []);
  const records = Array.isArray(current) ? current.filter(isMediaRecord) : [];
  records.unshift(record);
  await writeJsonFile(mediaIndexPath, records.slice(0, 5000));
  return record;
}

function assertMagicBytes(buffer: Buffer, mimeType: string): void {
  if (mimeType === 'image/png' && !(buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47)) {
    throw new HttpError(400, 'INVALID_PNG', 'Invalid PNG file.');
  }
  if (mimeType === 'image/jpeg' && !(buffer[0] === 0xff && buffer[1] === 0xd8)) {
    throw new HttpError(400, 'INVALID_JPEG', 'Invalid JPEG file.');
  }
  if (mimeType === 'image/webp' && !(Buffer.from(buffer.slice(0, 4)).toString('ascii') === 'RIFF' && Buffer.from(buffer.slice(8, 12)).toString('ascii') === 'WEBP')) {
    throw new HttpError(400, 'INVALID_WEBP', 'Invalid WebP file.');
  }
  if (mimeType === 'application/pdf' && Buffer.from(buffer.slice(0, 4)).toString('ascii') !== '%PDF') {
    throw new HttpError(400, 'INVALID_PDF', 'Invalid PDF file.');
  }
}

async function readJsonBody(request: IncomingMessage, limitBytes: number): Promise<unknown> {
  const chunks: Buffer[] = [];
  let total = 0;
  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    total += buffer.length;
    if (total > limitBytes) throw new HttpError(413, 'PAYLOAD_TOO_LARGE', 'Payload too large.');
    chunks.push(buffer);
  }
  const raw = Buffer.concat(chunks).toString('utf8');
  if (!raw.trim()) return {};
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    throw new HttpError(400, 'INVALID_JSON', 'Invalid JSON payload.');
  }
}

async function readJsonFile(path: string, fallback: JsonValue | null): Promise<unknown> {
  const content = await readFile(path, 'utf8').catch(() => '');
  if (!content) return fallback;
  try {
    return JSON.parse(content) as unknown;
  } catch {
    return fallback;
  }
}

async function writeJsonFile(path: string, value: JsonValue | JsonValue[]): Promise<void> {
  await ensureDirectory(path.split(sep).slice(0, -1).join(sep));
  const tmp = `${path}.${process.pid}.${Date.now()}.tmp`;
  await writeFile(tmp, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
  await rename(tmp, path);
}


async function loadPersistentSessions(config: RuntimeConfig): Promise<void> {
  const value = await readJsonFile(join(config.storageDir, 'sessions.json'), []);
  if (!Array.isArray(value)) return;
  const now = Date.now();
  for (const entry of value) {
    if (isSessionRecord(entry) && entry.expiresAt > now) sessions.set(entry.id, entry);
  }
}

async function savePersistentSessions(config: RuntimeConfig): Promise<void> {
  const now = Date.now();
  const active = Array.from(sessions.values()).filter((session) => session.expiresAt > now);
  await writeJsonFile(join(config.storageDir, 'sessions.json'), active as unknown as JsonValue[]);
}

function isSessionRecord(value: unknown): value is SessionRecord {
  return isJsonObject(value) &&
    typeof value.id === 'string' &&
    typeof value.csrfToken === 'string' &&
    typeof value.createdAt === 'number' &&
    typeof value.expiresAt === 'number' &&
    typeof value.ip === 'string' &&
    typeof value.userAgent === 'string';
}

async function appendAudit(config: RuntimeConfig, action: string, details: JsonObject): Promise<void> {
  const filePath = join(config.storageDir, 'audit', 'audit-log.json');
  const current = await readJsonFile(filePath, []);
  const records = Array.isArray(current) ? current.filter(isJsonObject) : [];
  records.unshift({ id: `audit-${Date.now()}-${randomBytes(4).toString('hex')}`, action, details: sanitizeJson(details, 4, 1200), createdAt: new Date().toISOString(), version: APP_VERSION });
  await writeJsonFile(filePath, records.slice(0, 2000) as JsonValue[]);
}

async function readAudit(config: RuntimeConfig): Promise<JsonObject[]> {
  const current = await readJsonFile(join(config.storageDir, 'audit', 'audit-log.json'), []);
  return Array.isArray(current) ? current.filter(isJsonObject).slice(0, 200) : [];
}

async function saveContentVersion(config: RuntimeConfig, kind: string, payload: JsonObject): Promise<string> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const versionId = `${safeFileToken(kind)}-${timestamp}-${randomBytes(3).toString('hex')}`;
  await writeJsonFile(join(config.storageDir, 'versions', `${versionId}.json`), { versionId, kind, createdAt: new Date().toISOString(), payload });
  return versionId;
}

async function listContentVersions(config: RuntimeConfig): Promise<JsonObject[]> {
  const directory = join(config.storageDir, 'versions');
  const files = await readdir(directory).catch(() => [] as string[]);
  const rows: JsonObject[] = [];
  for (const file of files.filter((entry) => entry.endsWith('.json')).sort().reverse().slice(0, 80)) {
    const value = await readJsonFile(join(directory, file), null);
    if (isJsonObject(value)) {
      rows.push({ versionId: String(value.versionId || file.replace(/\.json$/, '')), kind: String(value.kind || ''), createdAt: String(value.createdAt || '') });
    }
  }
  return rows;
}

async function rollbackContentVersion(config: RuntimeConfig, versionId: string): Promise<void> {
  const value = await readJsonFile(join(config.storageDir, 'versions', `${safeFileToken(versionId)}.json`), null);
  if (!isJsonObject(value) || !isJsonObject(value.payload)) throw new HttpError(404, 'VERSION_NOT_FOUND', 'Version not found.');
  const kind = String(value.kind || '');
  if (kind === 'site-data') {
    await writeSiteData(config, value.payload);
    return;
  }
  if (kind === 'universal-edits') {
    const edits = normalizeUniversalEdits(value.payload);
    await writeUniversalEdits(config, edits);
    return;
  }
  throw new HttpError(400, 'UNSUPPORTED_VERSION_KIND', 'Unsupported version kind.');
}

async function ensureDirectory(path: string): Promise<void> {
  await mkdir(path, { recursive: true });
}

function requireSession(config: RuntimeConfig, request: IncomingMessage): SessionRecord {
  const cookies = parseCookies(request.headers.cookie || '');
  const rawSession = cookies.dfg_session || '';
  const sessionId = verifySessionId(config, rawSession);
  if (!sessionId) throw new HttpError(401, 'AUTH_REQUIRED', 'Admin session required.');
  const session = sessions.get(sessionId);
  if (!session || session.expiresAt < Date.now()) {
    if (session) sessions.delete(session.id);
    throw new HttpError(401, 'SESSION_EXPIRED', 'Admin session expired.');
  }
  return session;
}

function createSession(request: IncomingMessage): SessionRecord {
  return {
    id: randomBytes(32).toString('hex'),
    csrfToken: randomBytes(32).toString('hex'),
    createdAt: Date.now(),
    expiresAt: Date.now() + SESSION_TTL_MS,
    ip: clientIp(request),
    userAgent: String(request.headers['user-agent'] || '').slice(0, 300)
  };
}

function signSessionId(config: RuntimeConfig, sessionId: string): string {
  const signature = createHmac('sha256', config.sessionSecret).update(sessionId).digest('base64url');
  return `${sessionId}.${signature}`;
}

function verifySessionId(config: RuntimeConfig, signed: string): string {
  const [sessionId, signature] = signed.split('.');
  if (!sessionId || !signature || !/^[a-f0-9]{64}$/.test(sessionId)) return '';
  const expected = createHmac('sha256', config.sessionSecret).update(sessionId).digest('base64url');
  return safeEqualText(signature, expected) ? sessionId : '';
}

function requireCsrf(request: IncomingMessage, session: SessionRecord): void {
  const headerValue = String(request.headers['x-csrf-token'] || '');
  const cookies = parseCookies(request.headers.cookie || '');
  const cookieValue = cookies.dfg_csrf || '';
  if (!safeEqualText(headerValue, session.csrfToken) || !safeEqualText(cookieValue, session.csrfToken)) {
    throw new HttpError(403, 'CSRF_INVALID', 'CSRF token is invalid.');
  }
}

function setCookie(response: ServerResponse, name: string, value: string, options: { readonly httpOnly: boolean; readonly secure: boolean; readonly sameSite: 'Lax' | 'Strict'; readonly path: string; readonly maxAge: number; }): void {
  const parts = [`${name}=${encodeURIComponent(value)}`, `Max-Age=${options.maxAge}`, `Path=${options.path}`, `SameSite=${options.sameSite}`];
  if (options.httpOnly) parts.push('HttpOnly');
  if (options.secure) parts.push('Secure');
  appendSetCookie(response, parts.join('; '));
}

function clearCookie(response: ServerResponse, name: string, secure: boolean): void {
  const parts = [`${name}=`, 'Max-Age=0', 'Path=/', 'SameSite=Lax'];
  if (secure) parts.push('Secure');
  appendSetCookie(response, parts.join('; '));
}

function appendSetCookie(response: ServerResponse, cookie: string): void {
  const existing = response.getHeader('Set-Cookie');
  if (!existing) {
    response.setHeader('Set-Cookie', cookie);
    return;
  }
  const next = Array.isArray(existing) ? [...existing, cookie] : [String(existing), cookie];
  response.setHeader('Set-Cookie', next);
}

function parseCookies(header: string): Record<string, string> {
  const output: Record<string, string> = {};
  for (const part of header.split(';')) {
    const [rawName, ...rawValue] = part.trim().split('=');
    if (!rawName) continue;
    output[rawName] = decodeURIComponent(rawValue.join('=') || '');
  }
  return output;
}

function applyRateLimit(key: string, maxCount: number, windowMs: number): void {
  const now = Date.now();
  const current = rateBuckets.get(key);
  if (!current || current.resetAt <= now) {
    rateBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }
  current.count += 1;
  if (current.count > maxCount) throw new HttpError(429, 'RATE_LIMITED', 'Too many requests.');
}

function clientIp(request: IncomingMessage): string {
  const forwarded = String(request.headers['x-forwarded-for'] || '').split(',')[0]?.trim();
  return forwarded || request.socket.remoteAddress || 'unknown';
}

function respondJson(response: ServerResponse, statusCode: number, payload: JsonValue | JsonValue[] | { readonly [key: string]: unknown }): void {
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.writeHead(statusCode);
  response.end(JSON.stringify(payload));
}

function respondError(response: ServerResponse, error: unknown): void {
  const httpError = error instanceof HttpError ? error : new HttpError(500, 'INTERNAL_ERROR', 'Internal server error.');
  if (!(error instanceof HttpError)) console.error('[dianafarm] internal error', error);
  if (!response.headersSent) {
    response.setHeader('Content-Type', 'application/json; charset=utf-8');
    response.writeHead(httpError.status);
  }
  response.end(JSON.stringify({ ok: false, code: httpError.code, message: httpError.message }));
}

function safeEqualText(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

function getString(object: JsonObject, key: string, maxLength: number): string {
  const value = object[key];
  return typeof value === 'string' ? normalizeText(value, maxLength) : '';
}

function getNumber(object: JsonObject, key: string, fallback: number): number {
  const value = object[key];
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function getBoolean(object: JsonObject, key: string, fallback: boolean): boolean {
  const value = object[key];
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return value === 'true';
  return fallback;
}

function getIsoDate(object: JsonObject, key: string): string {
  const value = getString(object, key, 80);
  if (!value) return '';
  const time = Date.parse(value);
  return Number.isFinite(time) ? new Date(time).toISOString() : '';
}

function normalizeText(value: string, maxLength: number): string {
  return value.replace(/[\u0000-\u001F\u007F]/g, ' ').replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '').trim().slice(0, maxLength);
}

function safeId(value: string): string {
  const cleaned = value.trim().replace(/[^a-zA-Z0-9а-яА-ЯёЁ_-]/g, '-').replace(/-+/g, '-').slice(0, 120);
  return cleaned || `id-${Date.now()}-${randomBytes(4).toString('hex')}`;
}

function safeFileToken(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]/g, '-').replace(/-+/g, '-').slice(0, 80) || 'content';
}

function clampInteger(value: number, min: number, max: number): number {
  const integer = Math.round(value);
  return Math.max(min, Math.min(max, integer));
}

function sanitizeJson(value: unknown, depth: number, maxStringLength: number): JsonValue {
  if (depth < 0) throw new HttpError(400, 'JSON_TOO_DEEP', 'JSON payload is too deep.');
  if (value === null || typeof value === 'boolean') return value;
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value === 'string') return normalizeText(value, Math.min(maxStringLength, 12000));
  if (Array.isArray(value)) return value.slice(0, 1000).map((entry) => sanitizeJson(entry, depth - 1, maxStringLength));
  if (isPlainRecord(value)) {
    const output: JsonObject = {};
    for (const [key, entry] of Object.entries(value).slice(0, 500)) {
      output[normalizeText(key, 120)] = sanitizeJson(entry, depth - 1, maxStringLength);
    }
    return output;
  }
  return null;
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && Object.prototype.toString.call(value) === '[object Object]';
}

function isJsonValue(value: unknown): value is JsonValue {
  if (value === null || typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return true;
  if (Array.isArray(value)) return value.every(isJsonValue);
  return isJsonObject(value);
}

function isJsonObject(value: unknown): value is JsonObject {
  if (!isPlainRecord(value)) return false;
  return Object.values(value).every(isJsonValue);
}

function deepCloneJsonObject(value: JsonObject): JsonObject {
  return JSON.parse(JSON.stringify(value)) as JsonObject;
}

function isLeadRecord(value: unknown): value is LeadRecord {
  return isJsonObject(value) &&
    typeof value.id === 'string' &&
    typeof value.createdAt === 'string' &&
    typeof value.type === 'string' &&
    typeof value.status === 'string' &&
    typeof value.lang === 'string' &&
    typeof value.page === 'string' &&
    isJsonObject(value.data) &&
    typeof value.deliveryStatus === 'string' &&
    typeof value.deliveryAttempts === 'number' &&
    typeof value.lastDeliveryAt === 'string' &&
    typeof value.nextRetryAt === 'string' &&
    typeof value.deliveryError === 'string';
}

function isReviewRecord(value: unknown): value is ReviewRecord {
  return isJsonObject(value) &&
    typeof value.id === 'string' &&
    typeof value.createdAt === 'string' &&
    typeof value.status === 'string' &&
    typeof value.visible === 'boolean' &&
    typeof value.rating === 'number' &&
    typeof value.author === 'string' &&
    typeof value.country === 'string' &&
    typeof value.service === 'string' &&
    isJsonObject(value.text);
}

function isMediaRecord(value: unknown): value is MediaRecord {
  return isJsonObject(value) &&
    typeof value.id === 'string' &&
    typeof value.createdAt === 'string' &&
    typeof value.path === 'string' &&
    typeof value.originalName === 'string' &&
    typeof value.mimeType === 'string' &&
    typeof value.sizeBytes === 'number';
}

main().catch((error: unknown) => {
  console.error('[dianafarm] fatal startup error', error);
  process.exit(1);
});
