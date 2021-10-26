import NotFound from '@/components/NotFoundPage.vue'

const routes = [
  {
    path: '/',
    meta: {
      requiresAuth: true,
    },
  },
  { path: '*', component: NotFound },
]

export default routes
