FROM node:20-alpine AS builder

WORKDIR /app
ARG NEXT_PUBLIC_API_URL=http://localhost:4568/api
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=4567
COPY package*.json ./
RUN npm install --omit=dev
COPY --chown=node:node --from=builder /app/.next ./.next
COPY --chown=node:node --from=builder /app/public ./public
COPY --chown=node:node --from=builder /app/next.config.js ./next.config.js
RUN chown -R node:node /app

EXPOSE 4567
USER node
CMD ["npm", "start"]
