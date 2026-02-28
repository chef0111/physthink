import { deleteFiles } from './uploadthing';
import {
  createCourse,
  deleteCourse,
  getCourse,
  getCourseBySlug,
  listCourses,
  listPublicCourses,
  updateCourse,
  enroll,
  listEnrolled,
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
    listPublic: listPublicCourses,
    get: getCourse,
    getPublic: getCourseBySlug,
    update: updateCourse,
    delete: deleteCourse,
    enroll,
    listEnrolled,
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
