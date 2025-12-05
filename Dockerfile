# Usamos una imagen base ligera de Node.js
FROM node:18-slim

# 1. Instalar dependencias necesarias para correr Chrome (Puppeteer)
# Esto incluye librerías gráficas, fuentes y herramientas de seguridad.
RUN apt-get update \
    && apt-get install -y wget gnupg \
    && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | gpg --dearmor -o /usr/share/keyrings/googlechrome-linux-keyring.gpg \
    && sh -c 'echo "deb [arch=amd64 signed-by=/usr/share/keyrings/googlechrome-linux-keyring.gpg] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
    && apt-get update \
    && apt-get install -y google-chrome-stable fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst fonts-freefont-ttf libxss1 \
      --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# 2. Configurar variables de entorno para Puppeteer
# Le decimos que NO descargue su propio Chromium (usaremos el que acabamos de instalar)
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable

# 3. Crear directorio de trabajo
WORKDIR /usr/src/app

# 4. Copiar archivos del proyecto
COPY package*.json ./

# 5. Instalar dependencias de Node
RUN npm install

# 6. Copiar el resto del código
COPY . .

# 7. Exponer el puerto (Render lo asigna dinámicamente, pero esto es buena práctica)
EXPOSE 3000

# 8. Comando de inicio
CMD [ "node", "index.js" ]