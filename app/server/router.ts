import { deleteFiles } from './uploadthing';
import { createCourse, getCourse, listCourses, updateCourse } from './course';
import {
  updateChapterTitle,
  deleteChapter,
  reorderChapter,
  createChapter,
} from './chapter';
import {
  updateLessonTitle,
  deleteLesson,
  reorderLesson,
  getLesson,
  createLesson,
} from './lesson';

export const router = {
  uploadthing: {
    delete: deleteFiles,
  },
  course: {
    create: createCourse,
    list: listCourses,
    get: getCourse,
    update: updateCourse,
  },
  chapter: {
    create: createChapter,
    updateTitle: updateChapterTitle,
    delete: deleteChapter,
    reorder: reorderChapter,
  },
  lesson: {
    create: createLesson,
    get: getLesson,
    updateTitle: updateLessonTitle,
    delete: deleteLesson,
    reorder: reorderLesson,
  },
};
