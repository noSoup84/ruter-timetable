import { createRouter, createWebHashHistory } from 'vue-router'
import BoardView from './views/BoardView.vue'

export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', component: BoardView },
    { path: '/config', component: () => import('./views/ConfigView.vue') },
    { path: '/import', component: () => import('./views/ImportView.vue') },
  ],
})
