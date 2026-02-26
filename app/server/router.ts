import { deleteFiles } from './uploadthing';
import {
  createCourse,
  deleteCourse,
  getCourse,
  listCourses,
  updateCourse,
} from './course';
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
  updateLesson,
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
    delete: deleteCourse,
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
    update: updateLesson,
    updateTitle: updateLessonTitle,
    delete: deleteLesson,
    reorder: reorderLesson,
  },
};
