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
  getCourseSlug,
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
import { generate } from './k2think';
import {
  create as createWorkspace,
  list as listWorkspaces,
  get as getWorkspace,
  update as updateWorkspace,
  remove as removeWorkspace,
} from './workspace';

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
    getSlug: getCourseSlug,
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
  k2think: {
    generate,
  },
  workspace: {
    create: createWorkspace,
    list: listWorkspaces,
    get: getWorkspace,
    update: updateWorkspace,
    delete: removeWorkspace,
  },
};
