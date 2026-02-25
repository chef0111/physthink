import { createUploadthing, type FileRouter } from 'uploadthing/next';
import { UploadThingError } from 'uploadthing/server';
import arcjet, { detectBot, shield, slidingWindow } from '@/lib/arcjet';
import { requireAdminSession } from '@/lib/session';

const f = createUploadthing();

const aj = arcjet
  .withRule(shield({ mode: 'LIVE' }))
  .withRule(
    detectBot({
      mode: 'LIVE',
      allow: ['CATEGORY:SEARCH_ENGINE', 'CATEGORY:PREVIEW', 'CATEGORY:MONITOR'],
    })
  )
  .withRule(
    slidingWindow({
      mode: 'LIVE',
      interval: '1m',
      max: 10,
    })
  );

export const ourFileRouter = {
  mediaUploader: f({
    image: {
      maxFileSize: '4MB',
      maxFileCount: 1,
    },
    video: {
      maxFileSize: '32MB',
      maxFileCount: 1,
    },
    audio: {
      maxFileSize: '8MB',
      maxFileCount: 1,
    },
  })
    .middleware(async ({ req }) => {
      const session = await requireAdminSession();

      const decision = await aj.protect(req, {
        userId: session.user.id,
      });

      if (decision.isDenied()) {
        if (decision.reason.isBot())
          throw new UploadThingError('Automated traffic blocked.');
        if (decision.reason.isRateLimit())
          throw new UploadThingError('Too many requests. Please slow down.');
        if (decision.reason.isShield())
          throw new UploadThingError('Request blocked by security policy.');

        throw new UploadThingError('Request blocked.');
      }

      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      return {
        uploadedBy: metadata.userId,
        url: file.ufsUrl,
        key: file.key,
        name: file.name,
      };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
