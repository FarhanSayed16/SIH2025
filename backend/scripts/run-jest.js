import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { MongoMemoryReplSet } from 'mongodb-memory-server';

const require = createRequire(import.meta.url);
// Every run owns an isolated database. No tests can delete development data.
const database = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
try {
  const child = spawn(process.execPath, ['--experimental-vm-modules', require.resolve('jest/bin/jest'), '--runInBand', ...process.argv.slice(2)], {
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'test', MONGODB_URI: database.getUri('kavach_test') },
  });
  const status = await new Promise((resolve, reject) => {
    child.once('error', reject);
    child.once('exit', (code) => resolve(code ?? 1));
  });
  process.exitCode = status;
} finally {
  await database.stop();
}
