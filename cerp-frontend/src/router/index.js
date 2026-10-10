import { createRouter, createWebHistory } from 'vue-router'
import Login from '../views/Login.vue'
import Register from '../views/Register.vue'
import Dashboard from '../views/Dashboard.vue'
import CreateUser from '../views/CreateUser.vue'
import UserData from '../views/UserData.vue'
import Report from '../views/Report.vue'
import sReport from '../views/sReport.vue'
import { Guest, auth } from '../middleware/middleware.js'
import MobileUsers from '@/views/MobileUsers.vue'
import DataUpload from '@/views/DataUpload.vue'
import AssignPins from '@/views/AssignPins.vue'
import Pins from '@/views/Pins.vue'
import Circle from '@/views/circle.vue'
import status from '@/views/status.vue'
import MainLayout from '@/components/MainLayout.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'Login',
      component: Login,
      beforeEnter: Guest
    },
    {
      path: '/register',
      name: 'Register',
      component: Register
    },
    {
      path: '/',
      component: MainLayout,
      beforeEnter: auth,
      children: [
        {
          path: 'dashboard',
          name: 'Dashboard',
          component: Dashboard,
        },
        {
          path: 'create-user',
          name: 'CreateUser',
          component: CreateUser,
        },
        {
          path: 'mobile-users',
          name: 'MobileUser',
          component: MobileUsers,
        },
        {
          path: 'user-data',
          name: 'UserData',
          component: UserData,
        },
        {
          path: 'UPLOAD',
          name: 'UPLOAD',
          component: DataUpload,
        },
        {
          path: 'assign',
          name: 'assign',
          component: AssignPins,
        },
        {
          path: 'report',
          name: 'Report',
          component: Report,
        },
        {
          path: 'sreport',
          name: 'sReport',
          component: sReport,
        },
        {
          path: 'Pins',
          name: 'Pins',
          component: Pins,
        },
        {
          path: 'circle',
          name: 'circle',
          component: Circle,
        },
        {
          path: 'status',
          name: 'status',
          component: status,
        }
      ]
    }
  ]
})

export default router
