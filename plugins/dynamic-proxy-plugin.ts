import { Plugin } from 'vite';
import fs from 'fs';
import path from 'path';

// Function to get the dynamic proxy target
function getProxyTarget(): string {
  // Resolve the path to your JSON file
  const configPath = path.resolve(__dirname, '../../dynappconfig.json');
  // Read the JSON file
  const rawData = fs.readFileSync(configPath, 'utf-8');
  // Parse the JSON data
  const config = JSON.parse(rawData);

  // Extract the necessary values
  const rungroup = config.rungroup;
  const runapp = config.runapp;

  // Construct the target URL based on the JSON values
  const targetUrl = `/dynapp-server/public/${rungroup}/${runapp}`;
  console.log('Proxy Target URL:', targetUrl);

  return targetUrl;
}

export default function dynamicProxyPlugin(): Plugin {
  return {
    name: 'dynamic-proxy-plugin',
    config(config, { command }) {
      // Check if we are in serve mode
      if (command === 'serve') {
        const targetUrl = getProxyTarget();
        // Update Vite config
        config.server = config.server || {};
        config.server.proxy = config.server.proxy || {};

        config.server.proxy['/dynapp-server'] = {
          target: 'https://dynappbeta.wip.se',
          changeOrigin: true,
          rewrite: (path: string) => {
            return path.replace(/^\/dynapp-server/, targetUrl);
          }
        };
      }
    }
  };
}
