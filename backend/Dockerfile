FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm install --omit=dev
COPY --chown=node:node --from=builder /app/dist ./dist
RUN chown -R node:node /app

EXPOSE 4568
USER node
CMD ["node", "dist/main"]
