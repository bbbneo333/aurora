import { spawnSync } from 'node:child_process';

const version = process.env.npm_package_version;

if (!version || version === '0.0.0') {
  console.error('Invalid app version:', version);
  process.exit(1);
}

const args = [
  'build',
  '--publish',
  'never',
  `--config.extraMetadata.version=${version}`,
  ...process.argv.slice(2),
];

const result = spawnSync(
  'electron-builder',
  args,
  { stdio: 'inherit', shell: true },
);

process.exit(result.status ?? 1);
