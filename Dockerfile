# syntax=docker/dockerfile:1

FROM node:22-alpine AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1 \
    NEXT_OUTPUT=standalone
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# The standalone output already contains the server and only the
# dependencies it imports, so the runtime image needs no npm install.
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
USER node
EXPOSE 3000
CMD ["node", "server.js"]
