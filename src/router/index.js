import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'pending',
    component: () => import('@/views/PendingSetsView.vue'),
  },
  {
    path: '/montados',
    name: 'built',
    component: () => import('@/views/BuiltSetsView.vue'),
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/',
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router