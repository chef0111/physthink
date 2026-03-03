import { getCourseData } from '../course';
import { notFound } from 'next/navigation';
import { MediaVideo } from '@/components/media-uploader/media-video';
import Image from 'next/image';
import { MarkdownPreview } from '@/components/editor/markdown/preview';
import { Card } from '@/components/ui/card';

export default async function LessonPage({
  params,
}: {
  params: Promise<{ slug: string; lessonId: string }>;
}) {
  const { slug, lessonId } = await params;
  const course = await getCourseData(slug);

  if (!course) {
    return notFound();
  }

  // Find the specific lesson across all chapters
  let currentLesson = null;
  let currentChapter = null;

  for (const chapter of course.chapters) {
    const lesson = chapter.lessons.find((l) => l.id === lessonId);
    if (lesson) {
      currentLesson = lesson;
      currentChapter = chapter;
      break;
    }
  }

  if (!currentLesson) {
    return notFound();
  }

  const { title, content, thumbnail, video } = currentLesson;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 pb-6">
      <div className="w-full">
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Chapter: {currentChapter?.title}
        </p>
      </div>

      {video ? (
        <div className="aspect-video w-full overflow-hidden">
          <MediaVideo src={video} poster={thumbnail ?? undefined} />
        </div>
      ) : thumbnail ? (
        <div className="relative aspect-video w-full overflow-hidden rounded-xl border shadow-lg">
          <Image
            src={thumbnail}
            alt={`${title} thumbnail`}
            fill
            className="object-cover"
            priority
          />
        </div>
      ) : null}

      {content && (
        <Card className="p-6 shadow-sm">
          <MarkdownPreview content={content} />
        </Card>
      )}
    </div>
  );
}
