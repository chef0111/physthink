'use server';

import { headers } from 'next/headers';
import { auth } from './auth';
import { cache } from 'react';

export const getServerSession = cache(async () => {
  return await auth.api.getSession({ headers: await headers() });
});

export const requireSession = cache(async () => {
  const session = await getServerSession();
  if (!session?.session || !session?.user) {
    throw new Error('Unauthorized');
  }
  return session;
});

export const requireAdminSession = cache(async () => {
  const session = await requireSession();
  if (session.user.role !== 'admin') {
    throw new Error('Unauthorized');
  }
  return session;
});
