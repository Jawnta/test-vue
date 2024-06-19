import { Plugin } from 'vite';
import fs from 'fs';
import path from 'path';

const getDynappConfig = () => {
  
  const findConfigFile = (currentDir) => {
    const configPath = path.join(currentDir, 'dynappconfig.json');
    
    if (fs.existsSync(configPath)) {
      const rawData = fs.readFileSync(configPath, 'utf-8');
      return JSON.parse(rawData);
    }

    const parentDir = path.dirname(currentDir);

    if (currentDir === parentDir) {
      throw new Error('\n\n\ndynappconfig.json not found in any parent directories.\n\n\n');
    }

    return findConfigFile(parentDir);
  };

  return findConfigFile(__dirname);
};

// Function to get the dynamic proxy target
function getProxyTarget(): string {
  // Resolve the path to your JSON file
  const  config = getDynappConfig();

  // Extract the necessary values
  const group = config.group;
  const app = config.app;
  const rungroup = config.rungroup;
  const runapp = config.runapp;

  // Construct the target URL based on the JSON values
  
  const targetUrl = rungroup && runapp 
  ? `/dynapp-server/public/${rungroup}/${runapp}` 
  : `/dynapp-server/public/${group}/${app}`;
  
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
