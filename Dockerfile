# Build stage
FROM node:20-alpine AS build

WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer toutes les dépendances (y compris devDependencies pour le build)
RUN npm ci

# Copier le code source
COPY . .

# >>> clé : passer l'URL au moment du build
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}

# Construire l'application pour la production
RUN node -e "console.log('>> VITE_API_URL during build =', process.env.VITE_API_URL || '(empty)')"
RUN npm run build

# Production stage
FROM nginx:alpine

# Copier les fichiers construits depuis le stage de build
COPY --from=build /app/dist /usr/share/nginx/html

# Copier la configuration nginx personnalisée
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Exposer le port 80
EXPOSE 80

# Démarrer nginx
CMD ["nginx", "-g", "daemon off;"]

