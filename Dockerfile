FROM node:18-bullseye
RUN npm install -g n8n@latest
WORKDIR /data
EXPOSE 5678
CMD ["n8n", "start"]
