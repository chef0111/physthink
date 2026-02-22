import { deleteFiles } from './uploadthing';
import { createCourse, listCourses } from './course';

export const router = {
  uploadthing: {
    delete: deleteFiles,
  },
  course: {
    create: createCourse,
    list: listCourses,
  },
};
