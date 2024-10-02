import { createMemoryHistory, createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    component: () => import('@/pages/index.vue'),
  },
  {
    path: '/sign-in',
    component: () => import('@/pages/auth/sign-in.vue'),
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
