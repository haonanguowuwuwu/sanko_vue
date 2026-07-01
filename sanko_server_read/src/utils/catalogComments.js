import { store } from '../store.js'

export function getBookComments(bookId) {
  if (!store.catalogComments.has(bookId)) {
    store.catalogComments.set(bookId, [])
  }
  return store.catalogComments.get(bookId)
}

export function findCommentById(commentId) {
  for (const [bookId, comments] of store.catalogComments.entries()) {
    for (const comment of comments) {
      if (comment.id === commentId) {
        return { bookId, comment, parent: null }
      }
      for (const reply of comment.replies ?? []) {
        if (reply.id === commentId) {
          return { bookId, comment: reply, parent: comment }
        }
      }
    }
  }
  return null
}

export function likeKey(userId, commentId) {
  return `${userId}:${commentId}`
}

export function isCommentLiked(userId, commentId) {
  return store.commentLikes.has(likeKey(userId, commentId))
}
