FROM node:18-alpine3.15

# Carpeta de trabajo
WORKDIR /usr/src/app

# Copia los archivos de las dependencias
COPY package.json yarn.lock ./

# Instala las dependencias
RUN yarn install

# Copia los archivos de la aplicación
COPY . .

# Arma el build de la aplicacion
RUN yarn build

# Corre el build en modo produccion
CMD ["node", "dist/main.js"]
