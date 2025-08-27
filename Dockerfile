FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci

# Copier seulement les fichiers de configuration
COPY vite.config.ts ./
COPY tsconfig*.json ./
COPY index.html ./

EXPOSE 5173

# Configuration pour le développement avec hot reload
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]
