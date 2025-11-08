# Use the official Node.js image as the base image
FROM node:20-alpine

# Set the working directory
WORKDIR /usr/src/app

# Install n8n globally
RUN npm install -g n8n@latest

# Copy the package.json and package-lock.json (if any)
# COPY package*.json ./

# Install dependencies (if any)
# RUN npm install

# Copy the rest of the application code
# COPY . .

# Expose the port n8n will run on
EXPOSE 5678

# Set the command to run n8n
CMD ["n8n", "start", "--host", "0.0.0.0", "--port", "5678"]
