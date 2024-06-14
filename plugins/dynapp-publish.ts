import { Plugin } from 'vite';

export default function dynappPublish(): Plugin {
  return {
    name: 'dynapp-publish',
    apply: 'build',
    closeBundle() {
      if (process.env.npm_config_publish) {
        console.log('Publish flag detected! Running publish tasks...');
      }
    }
  }
}
