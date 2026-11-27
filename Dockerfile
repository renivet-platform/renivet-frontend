# Development/staging image. Base-image multi-platform digest verified in GitHub CI; production approval remains separate.
FROM node:26-alpine@sha256:6bd9ab43c0ec0190ca7b2d193906cb8b7edf6e7f4afa43ddeccd6452710bffb5 AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY vendor/picomatch ./vendor/picomatch
RUN npm ci --no-audit --no-fund
COPY . .
RUN npm run build

FROM node:26-alpine@sha256:6bd9ab43c0ec0190ca7b2d193906cb8b7edf6e7f4afa43ddeccd6452710bffb5
ENV NODE_ENV=production
WORKDIR /app
COPY package.json package-lock.json ./
COPY vendor/picomatch ./vendor/picomatch
RUN npm ci --omit=dev --no-audit --no-fund \
    && npm cache clean --force \
    && rm -rf /app/vendor \
    && rm -rf /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/next.config.ts ./next.config.ts
COPY --from=build /app/tsconfig.json ./tsconfig.json
RUN chown -R node:node /app
USER node
EXPOSE 3000
CMD ["node", "node_modules/next/dist/bin/next", "start"]
