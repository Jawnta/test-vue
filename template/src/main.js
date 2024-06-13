import { createApp } from 'vue';
import App from './App.vue';
import vuetify from './plugins/vuetify';
import { createRouter, createWebHistory } from 'vue-router';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'Home',
      component: () => import('./components/HelloWorld.vue'),
    },
  ],
});

const app = createApp(App);
app.use(vuetify);
app.use(router);
app.mount('#app');
