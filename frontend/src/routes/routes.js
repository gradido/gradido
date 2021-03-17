import DashboardLayout from '@/views/Layout/DashboardLayout.vue'
import AuthLayoutGDD from '@/views/Layout/AuthLayout_gdd.vue'
import AuthLayout from '@/views/Layout/AuthLayout.vue'

// import NotFound from '@/views/NotFoundPage.vue'


const routes = [
  {
    path: '/',
    redirect: 'login',
    component: AuthLayoutGDD,
    children: [
      {
        path: '/login',
        component: () => import('../views/Pages/Login.vue')
      },
      {
        path: '/thx',
        component: () => import('../views/Pages/thx.vue')
      },      
      {
        path: '/register',
        component: () => import('../views/Pages/Register.vue')
      },      
      {
        path: '/password',
        component: () => import('../views/Pages/Password.vue')
      }
    ]
  },
  {
    path: '/',
    redirect: 'overview',
    component: DashboardLayout,
    children: [
      {
        path: '/overview',
        component: () => import('../views/KontoOverview.vue'),
        meta: {
          requiresAuth: true
        }
      },     
      {
        path: '/profile',
        component: () => import('../views/Pages/UserProfileCard.vue')
      },         
      {
        path: '/profileedit',
        component: () => import('../views/Pages/UserProfileEdit.vue')
      },         
      {
        path: '/activity',
        component: () => import('../views/Pages/UserProfileActivity.vue')
      }
    ]
  },
  ,
  {
    path: '/',
    redirect: 'AdminOverview',
    component: AuthLayout,
    children: [
      {
        path: '/AdminOverview',
        name: 'Adminübersicht',
        component: () => import('../views/AdminOverview.vue'),
        meta: {
          requiresAuth: true
        }
      }
    ]
  }
];

export default routes;
