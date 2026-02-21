import { deleteFiles } from './uploadthing';
import { createCourse } from './course';

export const router = {
  uploadthing: {
    delete: deleteFiles,
  },
  course: {
    create: createCourse,
  },
};
