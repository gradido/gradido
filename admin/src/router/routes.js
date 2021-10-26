import NotFound from '@/components/NotFoundPage.vue'

const routes = [
  {
    path: '/',
    meta: {
      requiresAuth: true,
    },
  },
  {
    path: 'not-found',
    component: NotFound,
  },
]

export default routes
