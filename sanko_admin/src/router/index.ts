import { createRouter, createWebHistory } from 'vue-router'
import AdminLayout from '@/layout/AdminLayout.vue'
import { useAdminAuthStore } from '@/stores/adminAuth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      meta: { public: true },
      component: () => import('@/views/LoginView.vue'),
    },
    {
      path: '/',
      component: AdminLayout,
      redirect: '/dashboard',
      children: [
        {
          path: 'dashboard',
          name: 'dashboard',
          meta: { title: '概览' },
          component: () => import('@/views/DashboardView.vue'),
        },
        {
          path: 'profile',
          name: 'profile',
          meta: { title: '个人资料' },
          component: () => import('@/views/ProfileView.vue'),
        },
        {
          path: 'users',
          name: 'users',
          meta: { title: '用户管理' },
          component: () => import('@/views/users/UserListView.vue'),
        },
        {
          path: 'books',
          name: 'books',
          meta: { title: '书籍管理' },
          component: () => import('@/views/books/BookListView.vue'),
        },
        {
          path: 'comments',
          name: 'comments',
          meta: { title: '评论管理' },
          component: () => import('@/views/comments/CommentListView.vue'),
        },
        {
          path: 'points',
          name: 'points',
          meta: { title: '积分管理' },
          component: () => import('@/views/points/PointListView.vue'),
        },
        {
          path: 'history',
          name: 'history',
          meta: { title: '历史记录' },
          component: () => import('@/views/history/HistoryListView.vue'),
        },
        {
          path: 'chat',
          name: 'chat',
          meta: { title: 'AI 聊天管理' },
          component: () => import('@/views/chat/ChatManageView.vue'),
        },
        {
          path: 'settings',
          name: 'settings',
          meta: { title: '系统设置' },
          component: () => import('@/views/settings/SystemSettingsView.vue'),
        },
      ],
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/dashboard',
    },
  ],
})

router.beforeEach((to) => {
  const auth = useAdminAuthStore()
  if (to.meta.public) {
    if (to.name === 'login' && auth.isLoggedIn) {
      return { name: 'dashboard' }
    }
    return true
  }
  if (!auth.isLoggedIn) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  return true
})

export default router
