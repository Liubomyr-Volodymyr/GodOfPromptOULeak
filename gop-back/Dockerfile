FROM node:20-slim
RUN apt-get update && apt-get install -y procps
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 4000
