import { configService } from '@/reader/configService'

export interface BookRecordLocation {
  text?: string
  chapterTitle?: string
  chapterDocIndex?: string | number
  chapterHref?: string
  count?: string | number
  page?: string
  percentage?: string | number
  cfi?: string
  xpath?: string
}

export function getRecordLocation(bookId: string): BookRecordLocation {
  return configService.getObjectConfig(bookId, 'recordLocation', {}) as BookRecordLocation
}

export function setRecordLocation(bookId: string, location: BookRecordLocation) {
  configService.setObjectConfig(bookId, location as Record<string, unknown>, 'recordLocation')
}
