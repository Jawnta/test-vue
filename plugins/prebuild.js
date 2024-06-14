const { execSync } = require('child_process');

if (process.argv.includes('--publish')) {
  process.env.pnpm_config_publish = 'true';
}

execSync('vite build', { stdio: 'inherit' });
