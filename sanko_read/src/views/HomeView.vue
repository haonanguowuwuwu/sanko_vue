<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { featuredBooks as staticFeaturedBooks } from '@/data/catalogBooks'
import { fetchCatalogHome } from '@/api/catalog'
import type { CatalogBook } from '@/types/catalog'
import ChatPanel from '@/components/ChatPanel.vue'

const router = useRouter()
const featuredBooks = ref<CatalogBook[]>([...staticFeaturedBooks])
const loading = ref(false)

onMounted(async () => {
  loading.value = true
  try {
    const home = await fetchCatalogHome()
    if (home.featured?.length) {
      featuredBooks.value = home.featured
    }
  } catch {
    featuredBooks.value = [...staticFeaturedBooks]
  } finally {
    loading.value = false
  }
})

const openBook = (id: string) => {
  router.push({ name: 'book-intro', params: { id } })
}
</script>

<template>
  <div class="home-page">
    <section v-if="loading" class="home-featured home-featured--loading">加载中…</section>
    <section v-else class="home-featured">
      <article
        v-for="book in featuredBooks"
        :key="book.id"
        class="home-featured__item home-book-link"
        role="link"
        tabindex="0"
        @click="openBook(book.id)"
        @keydown.enter="openBook(book.id)"
      >
        <div class="home-cover home-cover--featured" :style="{ background: book.coverColor }">
          <span class="home-cover__title">{{ book.coverTitle }}</span>
        </div>
        <h3 class="home-featured__title">{{ book.title }}</h3>
        <p class="home-featured__author">{{ book.author }}</p>
      </article>
    </section>

    <section class="home-chat">
      <ChatPanel />
    </section>
  </div>
</template>

<style scoped>
.home-page {
  --home-inset-featured: 120px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.home-featured {
  display: flex;
  justify-content: center;
  gap: 64px;
  flex-shrink: 0;
  padding-inline: var(--home-inset-featured);
}

.home-featured--loading {
  justify-content: center;
  color: var(--sanko-text-secondary);
  font-size: 14px;
}

.home-featured__item {
  flex: 0 0 auto;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 96px;
}

.home-book-link {
  cursor: pointer;
  transition: opacity 0.15s;
}

.home-book-link:hover {
  opacity: 0.85;
}

.home-featured__title {
  margin: 6px 0 0;
  width: 100%;
  font-size: 13px;
  font-weight: 600;
  color: var(--sanko-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: center;
}

.home-featured__author {
  margin: 2px 0 0;
  width: 100%;
  font-size: 12px;
  color: var(--sanko-green);
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.home-cover {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
  color: #fff;
  overflow: hidden;
}

.home-cover--featured {
  width: 100%;
  max-width: 96px;
  height: 128px;
}

.home-cover__title {
  font-size: 13px;
  font-weight: 700;
  writing-mode: vertical-rl;
  letter-spacing: 2px;
}

.home-chat {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  padding-inline: 48px;
}

@media (max-width: 1100px) {
  .home-page {
    --home-inset-featured: 40px;
  }

  .home-featured {
    flex-wrap: wrap;
    justify-content: center;
    gap: 32px;
  }

  .home-chat {
    padding-inline: 24px;
  }
}

@media (max-width: 640px) {
  .home-featured {
    gap: 20px;
  }

  .home-featured__item {
    width: 80px;
  }
}
</style>
