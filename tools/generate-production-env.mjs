import { existsSync, writeFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';

const file = '.env.production.local';
if (existsSync(file) && !process.argv.includes('--force')) {
  console.error(`${file} already exists. Use npm run env:generate -- --force to replace it.`);
  process.exit(1);
}

const adminPassword = `DianaFarm-${randomBytes(18).toString('base64url')}`;
const sessionSecret = randomBytes(64).toString('hex');
const content = `DFG_NODE_ENV=production
DFG_PORT=8080
DFG_PUBLIC_ORIGIN=http://localhost:8080
DFG_ADMIN_PASSWORD=${adminPassword}
DFG_SESSION_SECRET=${sessionSecret}
DFG_STORAGE_DIR=./data
DFG_MAX_JSON_BYTES=5242880
DFG_MAX_MEDIA_BYTES=8388608
DFG_LEAD_WEBHOOK_URL=
`;
writeFileSync(file, content, { mode: 0o600 });
console.log(`${file} created.`);
console.log(`Admin password: ${adminPassword}`);
console.log('Save this password. It is not stored in frontend files.');
