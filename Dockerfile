FROM node:20-slim

WORKDIR /usr/src/app
COPY package.json package-lock.json* ./
RUN npm install --production

# optional: if you need chromium, skip automatic download and rely on system chrome; for Render/Railway you may need to set PUPPETEER_SKIP_CHROMIUM_DOWNLOAD env
COPY . .

EXPOSE 3001
CMD ["node", "index.js"]
