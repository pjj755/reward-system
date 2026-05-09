#!/bin/sh
npx prisma db push --skip-generate
npx tsx prisma/seed.ts
npm start
