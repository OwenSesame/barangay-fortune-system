import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'login',
      component: () => import('../views/Login.vue')
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('../views/Register.vue')
    },
    {
      path: '/admin-dashboard',
      name: 'admin-dashboard',
      component: () => import('../views/AdminDashboard.vue')
    },
    {
      path: '/resident-dashboard',
      name: 'resident-dashboard',
      component: () => import('../views/ResidentDashboard.vue')
    },
    {
      path: '/staff-home',
      name: 'staff-home',
      component: () => import('../views/StaffHome.vue')
    },
    {
      path: '/audit-logs',
      name: 'audit-logs',
      component: () => import('../views/AuditLogs.vue')
    },
    {
      path: '/system-settings',
      name: 'system-settings',
      component: () => import('../views/SystemSettings.vue')
    },
    {
      path: '/resident-approvals',
      name: 'resident-approvals',
      component: () => import('../views/ResidentApprovals.vue')
    },
    {
      path: '/account-management',
      name: 'account-management',
      component: () => import('../views/AccountManagement.vue')
    },
    {
      path: '/document-management',
      name: 'document-management',
      component: () => import('../views/DocumentManagement.vue')
    },
    {
      path: '/document-records',
      name: 'document-records',
      component: () => import('../views/DocumentRecords.vue')
    },
    {
      path: '/staff-pending',
      name: 'staff-pending',
      component: () => import('../views/StaffPendingReview.vue')
    },
    {
      path: '/staff-ready-to-print',
      name: 'staff-ready-to-print',
      component: () => import('../views/StaffReadyToPrint.vue')
    },
    {
      path: '/print/:id',
      name: 'print',
      component: () => import('../views/PrintCertificate.vue')
    },
    {
      path: '/resident-dashboard',
      name: 'resident-dashboard',
      component: () => import('../views/ResidentDashboard.vue')
    },
    {
      path: '/profile',
      name: 'profile',
      component: () => import('../views/Profile.vue')
    },
    {
      path: '/document-request',
      name: 'document-request',
      component: () => import('../views/DocumentRequest.vue')
    }
  ]
})

export default router
