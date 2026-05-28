FROM node:20-alpine

RUN apk add --no-cache dumb-init vips-dev python3 make g++

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY src ./src

EXPOSE 3000

CMD ["dumb-init", "node", "src/index.js"]
