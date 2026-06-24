import { createRouter, createWebHistory } from 'vue-router'
import MainLayout from '@/layout/MainLayout.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/read/:id',
      name: 'reader',
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
          path: 'notes',
          name: 'notes',
          component: () => import('@/views/NotesView.vue'),
        },
        {
          path: 'highlights',
          name: 'highlights',
          component: () => import('@/views/HighlightsView.vue'),
        },
        {
          path: 'recycle-bin',
          name: 'recycle-bin',
          component: () => import('@/views/RecycleBinView.vue'),
        },
        {
          path: 'chat',
          name: 'chat',
          component: () => import('@/views/ChatView.vue'),
        },
        {
          path: 'shelf/:shelfId',
          name: 'shelf',
          component: () => import('@/views/ShelfView.vue'),
        },
      ],
    },
  ],
})

export default router
