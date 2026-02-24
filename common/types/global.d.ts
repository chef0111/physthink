interface RouteParams {
  params: Promise<Record<string, string>>;
  searchParams: Promise<Record<string, string | undefined>>;
}

interface QueryParams {
  page?: number;
  pageSize?: number;
  query?: string;
  filter?: string;
  sort?: string;
}

interface Lesson {
  id: string;
  title: string;
  description?: string | null;
  thumbnail?: string | null;
  video?: string | null;
  order: number;
}

interface Chapter {
  id: string;
  title: string;
  order: number;
  lessons: Lesson[];
}
