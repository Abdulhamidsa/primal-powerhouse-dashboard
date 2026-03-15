 
const { spawnSync } = require('node:child_process');
const path = require('node:path');

const workspacePath = process.cwd();

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: workspacePath,
    stdio: 'pipe',
    shell: false,
    encoding: 'utf8',
    ...options,
  });

  return {
    status: result.status ?? 1,
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
    error: result.error ? String(result.error.message || result.error) : '',
  };
}

function printResult(output) {
  if (output.stdout.trim()) {
    process.stdout.write(output.stdout);
  }
  if (output.stderr.trim()) {
    process.stderr.write(output.stderr);
  }
  if (output.error && output.error.trim()) {
    process.stderr.write(`${output.error}\n`);
  }
}

function isWindowsLockError(output) {
  const text = `${output.stdout}\n${output.stderr}`;
  return process.platform === 'win32' && text.includes('EPERM') && text.includes('query_engine-windows.dll.node');
}

function stopWorkspaceNextProcesses() {
  if (process.platform !== 'win32') {
    return;
  }

  const escapedWorkspace = workspacePath.replace(/\\/g, '\\\\').replace(/'/g, "''");
  const psScript =
    `$workspace = '${escapedWorkspace}'; ` +
    `Get-CimInstance Win32_Process -Filter \"name = 'node.exe'\" | ` +
    `Where-Object { $_.CommandLine -and ( ` +
    `$_.CommandLine -like \"*$workspace*\" -or ` +
    `$_.CommandLine -like '*next\\dist\\server\\lib\\start-server.js*' -or ` +
    `$_.CommandLine -like '*next dev*' ) } | ` +
    `ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }`;

  const result = run('powershell', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', psScript]);
  printResult(result);
}

function generatePrismaClient() {
  const result = run('pnpm prisma generate', [], { shell: true });
  printResult(result);
  return result;
}

function main() {
  const firstTry = generatePrismaClient();
  if (firstTry.status === 0) {
    return;
  }

  if (!isWindowsLockError(firstTry)) {
    process.exit(firstTry.status || 1);
  }

  console.warn(
    '[prisma:generate:safe] Detected Windows Prisma engine lock. Stopping workspace Node/Next processes and retrying...'
  );
  stopWorkspaceNextProcesses();

  const secondTry = generatePrismaClient();
  if (secondTry.status === 0) {
    return;
  }

  console.error('[prisma:generate:safe] Prisma generate failed after retry.');
  process.exit(secondTry.status || 1);
}

main();
