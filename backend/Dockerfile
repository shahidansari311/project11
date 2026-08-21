FROM node:22-slim

# Install OpenSSL (required by Prisma on Debian slim)
RUN apt-get update -y && apt-get install -y openssl

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the Prisma schema and generate the client
COPY prisma ./prisma
RUN npx prisma generate

# Copy the rest of the application code
COPY . .

# Expose port
EXPOSE 4000

# Start the application
CMD ["npm", "start"]
