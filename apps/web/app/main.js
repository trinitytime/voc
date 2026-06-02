// Vue 3 entry — loads .vue SFC files in the browser via vue3-sfc-loader.
// In a real Vue project, replace this with: createApp(App).mount('#app')
//   import App from './App.vue';
//   import { createApp } from 'vue';

(function () {
  const { loadModule } = window['vue3-sfc-loader'];
  const { createApp } = window.Vue;

  const options = {
    moduleCache: {
      vue: window.Vue,
    },
    async getFile(url) {
      const res = await fetch(url);
      if (!res.ok) throw Object.assign(new Error(url + ' ' + res.statusText), { res });
      const content = await res.text();
      // vue3-sfc-loader expects an object { getContentData } for non-.vue files,
      // or a plain string for .vue files. Use object form so .js gets parsed as module.
      return {
        getContentData: () => content,
        type: url.endsWith('.vue') ? '.vue' : '.mjs',
      };
    },
    addStyle(textContent) {
      const style = Object.assign(document.createElement('style'), { textContent });
      document.head.appendChild(style);
    },
  };

  loadModule('./vue/App.vue', options).then((App) => {
    createApp(App).mount('#app');
  }).catch((err) => {
    console.error('Failed to load App.vue', err);
  });
})();
