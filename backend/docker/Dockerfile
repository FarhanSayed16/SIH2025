FROM node:22-alpine

WORKDIR /app
# Resolve the backend workspace through the shared, audited root lockfile.
COPY package.json package-lock.json ./
COPY backend/package.json ./backend/package.json
COPY web/package.json ./web/package.json
RUN npm ci --omit=dev --workspace backend

# Copy only runtime source; credentials and development assets stay outside the image.
COPY backend/src ./backend/src
WORKDIR /app/backend
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"
CMD ["node", "src/server.js"]
