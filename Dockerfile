FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install n8n globally
RUN npm install -g n8n@latest

# Expose the port Railway uses
ENV PORT=5678
EXPOSE 5678

# Default command
CMD ["n8n", "start", "--tunnel"]
