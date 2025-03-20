FROM node:20-alpine as build

WORKDIR /app

# Instalar dependências
COPY package.json ./

# Instalar dependências (com legacy-peer-deps como fallback)
RUN npm install || npm install --legacy-peer-deps

# Copiar código-fonte
COPY . ./

# Construir aplicação
RUN npm run build

# Imagem de produção
FROM nginx:alpine

# Configurar nginx
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf

# Copiar arquivos de build
COPY --from=build /app/build /usr/share/nginx/html

# Expor porta
EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]