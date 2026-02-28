import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { prisma } from './prisma';
import { username, emailOTP, admin } from 'better-auth/plugins';
import { nextCookies } from 'better-auth/next-js';
import { APIError, createAuthMiddleware } from 'better-auth/api';
import { PasswordSchema } from './validations';
import { resend } from './resend';
import crypto from 'crypto';

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID as string,
      clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
    },
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          const emailPrefix = user.email.split('@')[0];
          const generatedName = emailPrefix
            .split(/[._-]/)
            .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
            .join(' ');

          const emailHash = crypto
            .createHash('sha256')
            .update(user.email.trim().toLowerCase())
            .digest('hex');
          const generatedImage = `https://gravatar.com/avatar/${emailHash}?d=retro`;

          return {
            data: {
              ...user,
              name: user.name || generatedName,
              image: user.image || generatedImage,
              role: user.role || 'user',
            },
          };
        },
      },
    },
  },
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (
        ctx.path === '/sign-up/email' ||
        ctx.path === '/reset-password' ||
        ctx.path === '/change-password'
      ) {
        const password = ctx.body.password || ctx.body.newPassword;

        const { error } = PasswordSchema.safeParse(password);

        if (error) {
          throw new APIError('BAD_REQUEST', {
            message: 'Password not strong enough.',
          });
        }
      }
    }),
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 300,
    },
  },
  plugins: [
    username(),
    emailOTP({
      async sendVerificationOTP({ email, otp }) {
        await resend.emails.send({
          from: 'PhysThink <physthink@dev4room.pro>',
          to: [email],
          subject: 'PhysThink - Email Verification',
          html: `<p>Your OTP code is: <strong>${otp}</strong></p>`,
        });
      },
    }),
    admin(),
    nextCookies(),
  ],
});

export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;
