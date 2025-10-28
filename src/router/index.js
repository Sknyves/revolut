import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/callback',
    name: 'Callback',
    component: () => import('@/components/Callback.vue')
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

export default router
