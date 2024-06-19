import { Plugin } from 'vite';
import urlJoin from 'url-join';
import mime from 'mime-types';
import path from 'path';
import fs from 'fs-extra';
import ora from 'ora';
import * as readline from 'readline';

const getDistFiles = (folder) => {
  const result = [];

  const files = fs.readdirSync(folder);
  files.forEach(file => {
    const fileWithPath = path.join(folder, file);
    const stats = fs.statSync(fileWithPath);
    if (stats.isDirectory()) {
      const subFiles = getDistFiles(path.join(folder, file));
      subFiles.forEach(subFile => {
          result.push(path.join(file, subFile));
      });
    } else {
      result.push(file);
    }
  });

  return result;
}

const getDynapConfig = () => {
  const findConfigFile = (currentDir) => {
    const configPath = path.join(currentDir, 'dynappconfig.json');
    
    if (fs.existsSync(configPath)) {
      const rawData = fs.readFileSync(configPath, 'utf-8');
      return JSON.parse(rawData);
    }

    const parentDir = path.dirname(currentDir);

    if (currentDir === parentDir) {
      console.error('dynappconfig.json not found in any parent directories.');
      return null;
    }

    return findConfigFile(parentDir);
  };

  return findConfigFile(__dirname);
};

const dataItemsBaseUrl = (dynappConfig) => {
  return urlJoin(dynappConfig.baseUrl, 'dynapp-server/rest/groups', dynappConfig.group, 'apps', dynappConfig.app)
}

const clearDataItems = async (dynappConfig: any, prefix: string): Promise<void> => {
  const url = urlJoin(dataItemsBaseUrl(dynappConfig), 'data-items/');
  const authHeader = 'Basic ' + Buffer.from(`${dynappConfig.username}:${dynappConfig.password}`).toString('base64');

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': authHeader
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch data items: ${response.statusText}`);
  }

  const data = await response.json();
  const existingWebDataItems = Object.keys(data).filter(dataItem => dataItem.startsWith(prefix));
  const operations = existingWebDataItems.map(async (dataItem) => {
    const deleteUrl = urlJoin(dataItemsBaseUrl(dynappConfig), 'data-items', dataItem);

    const deleteResponse = await fetch(deleteUrl, {
      method: 'DELETE',
      headers: {
        'Authorization': authHeader
      }
    });

    if (!deleteResponse.ok) {
      throw new Error(`Failed to delete data item ${dataItem}: ${deleteResponse.statusText}`);
    }

    return deleteResponse;
  });

  await Promise.all(operations);
};

const uploadDataItems = async (dynappConfig, prefix, files, distFolder) => {
  if (files.length === 0) {
    return null;
  }

  const uploadQueue = [...files];
  const spinner = ora(`Publishing to ${prefix}...`).start();

  try {
    await Promise.all(uploadQueue.map(async (file) => {
      try {
        await uploadDataItem(dynappConfig, path.join(distFolder, file), prefix + file);
      } catch (error) {
        spinner.fail(`Failed to upload: ${error}`);
        throw new Error(`Failed to upload file ${file}: ${error.message}`);
      }
    }));
    spinner.succeed(`Successfully published to ${prefix}!`);
  } catch (error) {
    spinner.fail(`Publishing failed.`);
    throw error;
  }

  return null;
};

const uploadDataItem = async (dynappConfig, file, targetFile) => {
  const url = urlJoin(dataItemsBaseUrl(dynappConfig), 'data-items', targetFile);
  const fileData = fs.readFileSync(file);
  const contentType = mime.lookup(targetFile) || '';

  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': contentType,
      'X-Category': '2',
      'Authorization': 'Basic ' + Buffer.from(dynappConfig.username + ':' + dynappConfig.password).toString('base64')
    },
    body: fileData,

  });

  return response.text();
};


const setPrefix = (question: string, defaultValue: string = ''): Promise<string> => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(`${question} (${defaultValue}): `, (answer) => {
      rl.close();
      resolve(answer || defaultValue);
    });
  });
};

const willPublish = (question: string): Promise<string> => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(`${question}`, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
};


export default function dynappPublish(): Plugin {
  return {
    name: 'dynapp-publish',
    apply: 'build',
    async closeBundle() {
      if (process.env.pnpm_config_publish) {
        const dynappConfig = getDynapConfig();
        const url = dataItemsBaseUrl(dynappConfig);
        const distFolder = "./dist";
        const distFiles = getDistFiles(distFolder)
        const prefix = await setPrefix("Prefix:", "web") + "/";
        const isPublish = await willPublish(`Do you want to publish to: ${url}/${prefix}? (Y/N) `);
        if (isPublish === "y") {
          await clearDataItems(dynappConfig, prefix)
          await uploadDataItems(dynappConfig, prefix, distFiles, distFolder)
          const publicUrl = `${dynappConfig.baseUrl}dynapp-server/public/${dynappConfig.group}/${dynappConfig.app}/${prefix}`;
          console.log(`We think your public url is: ${publicUrl}`)
          return
        }
        return

      }
    }
  }
}
