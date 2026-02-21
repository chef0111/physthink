import { UTApi } from 'uploadthing/server';

const utapi = new UTApi();

class UploadThingDAL {
  static async deleteFile(key: string) {
    const result = await utapi.deleteFiles(key);
    return result;
  }
}

export const deleteFile = (
  ...args: Parameters<typeof UploadThingDAL.deleteFile>
) => UploadThingDAL.deleteFile(...args);
