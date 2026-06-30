import { createRouter, createWebHistory } from 'vue-router'
import MainLayout from '@/layout/MainLayout.vue'
import { useUserStore } from '@/stores/user'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/read/:id',
      name: 'reader',
      meta: { requiresAuth: true },
      component: () => import('@/views/ReaderView.vue'),
    },
    {
      path: '/',
      component: MainLayout,
      children: [
        {
          path: '',
          name: 'home',
          component: () => import('@/views/HomeView.vue'),
        },
        {
          path: 'book/:id',
          name: 'book-intro',
          component: () => import('@/views/BookIntroView.vue'),
        },
        {
          path: 'categories',
          name: 'categories',
          component: () => import('@/views/CategoriesView.vue'),
        },
        {
          path: 'library',
          name: 'library',
          component: () => import('@/views/LocalLibraryView.vue'),
        },
        {
          path: 'favorites',
          name: 'favorites',
          component: () => import('@/views/FavoritesView.vue'),
        },
        {
          path: 'shelf/:shelfId',
          name: 'shelf',
          component: () => import('@/views/ShelfView.vue'),
        },
        {
          path: 'profile',
          name: 'profile',
          meta: { requiresAuth: true },
          component: () => import('@/views/ProfileView.vue'),
        },
        {
          path: 'profile/points',
          redirect: (to) => ({
            name: 'profile',
            query: { tab: (to.query.tab as string) || 'overview' },
          }),
        },
        {
          path: 'profile/account',
          redirect: { name: 'profile' },
        },
        {
          path: 'profile/history',
          name: 'reading-history',
          meta: { requiresAuth: true },
          component: () => import('@/views/ReadingHistoryView.vue'),
        },
      ],
    },
  ],
})

router.beforeEach(async (to) => {
  if (!to.meta.requiresAuth) return true

  const userStore = useUserStore()
  if (!userStore.initialized) {
    await userStore.init()
  }

  if (!userStore.isLoggedIn) {
    return {
      path: '/',
      query: { login: '1', redirect: to.fullPath },
    }
  }

  return true
})

export default router
