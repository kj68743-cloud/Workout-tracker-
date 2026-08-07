# Builds the client and runs the server in the same container/process,
# so the whole app deploys as one service with one URL (see README).

FROM node:20-slim AS client-build
WORKDIR /app/client
COPY client/package.json client/package-lock.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

FROM node:20-slim AS server
WORKDIR /app/server
COPY server/package.json server/package-lock.json ./
RUN npm ci --omit=dev
COPY server/ ./
COPY --from=client-build /app/client/dist /app/client/dist

ENV NODE_ENV=production
ENV PORT=4000
# Overridden to a mounted volume path (e.g. /data) on hosts with persistent
# storage — see fly.toml / render.yaml.
ENV DATA_DIR=/app/server/data

EXPOSE 4000
CMD ["node", "src/index.js"]
