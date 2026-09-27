FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
COPY tsconfig.json ./
COPY prisma ./prisma/

RUN npm install

COPY src ./src/
COPY .env ./

RUN npx prisma generate
RUN npx prisma db push
RUN npx tsx prisma/seed.ts

EXPOSE 3000

CMD ["npm", "run", "dev"]
