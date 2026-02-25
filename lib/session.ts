'use server';

import { headers } from 'next/headers';
import { auth } from './auth';
import { cache } from 'react';

export const getServerSession = cache(async () => {
  return await auth.api.getSession({ headers: await headers() });
});

export const requireSession = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
    query: { disableCookieCache: true },
  });
  if (!session?.session || !session?.user) {
    throw new Error('Unauthorized');
  }
  return session;
};

export const requireAdminSession = async () => {
  const session = await requireSession();
  if (session.user.role !== 'admin') {
    throw new Error('Unauthorized');
  }
  return session;
};
