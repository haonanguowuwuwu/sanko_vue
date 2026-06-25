<script setup lang="ts">
import { useRouter } from 'vue-router'
import { featuredBooks, rankSections } from '@/data/catalogBooks'

const router = useRouter()

const openBook = (id: string) => {
  router.push({ name: 'book-intro', params: { id } })
}
</script>

<template>
  <div class="home-page">
    <section class="home-featured">
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

    <section class="home-ranks">
      <div v-for="section in rankSections" :key="section.title" class="home-rank">
        <h2 class="home-rank__heading">{{ section.title }}</h2>

        <article
          class="home-rank__highlight home-book-link"
          role="link"
          tabindex="0"
          @click="openBook(section.highlight.id)"
          @keydown.enter="openBook(section.highlight.id)"
        >
          <div
            class="home-cover home-cover--rank"
            :style="{ background: section.highlight.coverColor }"
          >
            <span class="home-cover__title">{{ section.highlight.coverTitle }}</span>
          </div>
          <div class="home-rank__highlight-body">
            <h3 class="home-rank__book-title">{{ section.highlight.title }}</h3>
            <p v-if="section.highlight.description" class="home-rank__desc">
              {{ section.highlight.description }}
            </p>
          </div>
        </article>

        <ul class="home-rank__list">
          <li
            v-for="(item, index) in section.items"
            :key="item.id"
            class="home-rank__row home-book-link"
            role="link"
            tabindex="0"
            @click="openBook(item.id)"
            @keydown.enter="openBook(item.id)"
          >
            <div
              class="home-cover home-cover--thumb"
              :style="{ background: item.coverColor }"
            >
              <span class="home-cover__title home-cover__title--small">{{ item.coverTitle }}</span>
            </div>
            <span class="home-rank__row-title">{{ item.title }}</span>
            <span class="home-rank__row-meta">{{ index + 2 }}</span>
          </li>
        </ul>
      </div>
    </section>
  </div>
</template>

<style scoped>
.home-page {
  --home-inset-featured: 120px;
  --home-inset-ranks: 180px;
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

.home-cover--rank {
  flex-shrink: 0;
  width: 56px;
  height: 74px;
}

.home-cover--thumb {
  flex-shrink: 0;
  width: 36px;
  height: 48px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
}

.home-cover__title {
  font-size: 13px;
  font-weight: 700;
  writing-mode: vertical-rl;
  letter-spacing: 2px;
}

.home-cover__title--small {
  font-size: 10px;
  letter-spacing: 1px;
}

.home-ranks {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 24px;
  flex: 1;
  min-height: 0;
  padding-inline: var(--home-inset-ranks);
}

.home-rank__heading {
  margin: 0 0 10px;
  font-size: 16px;
  font-weight: 700;
  color: var(--sanko-green);
}

.home-rank__highlight {
  display: flex;
  gap: 10px;
  margin-bottom: 8px;
}

.home-rank__highlight-body {
  min-width: 0;
}

.home-rank__book-title {
  margin: 0 0 4px;
  font-size: 14px;
  font-weight: 600;
  color: var(--sanko-text);
}

.home-rank__desc {
  margin: 0;
  font-size: 12px;
  line-height: 1.5;
  color: var(--sanko-text-secondary);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.home-rank__list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.home-rank__row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 0;
  border-top: 1px solid var(--sanko-border);
}

.home-rank__row-title {
  flex: 1;
  min-width: 0;
  font-size: 13px;
  color: var(--sanko-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.home-rank__row-meta {
  flex-shrink: 0;
  font-size: 12px;
  color: var(--sanko-text-secondary);
}

@media (max-width: 1100px) {
  .home-page {
    --home-inset-featured: 40px;
    --home-inset-ranks: 48px;
  }
  .home-featured {
    flex-wrap: wrap;
    justify-content: center;
    gap: 32px;
  }

  .home-featured__item {
    width: 96px;
  }

  .home-ranks {
    grid-template-columns: 1fr;
    overflow-y: auto;
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
