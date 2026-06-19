# Sistema POS Gastronómico Premium

Un sistema POS de gestión gastronómica moderno, responsivo y de alto rendimiento diseñado para cafeterías y restaurantes. Desarrollado con **React + Vite**, estilizado con variables de diseño CSS puras y con soporte completo para modo claro/oscuro.

---

## 🚀 Características Principales

1. **Terminal de Mozo:** Toma de pedidos interactiva por zonas y mesas, buscador de platos inteligente integrado, y panel de cuenta en tiempo real.
2. **Tableros de Cocina y Bar:** Visualización y despacho de pedidos pendientes y en preparación en tiempo real, agrupados por estaciones de trabajo.
3. **Módulo de Caja:** Facturación electrónica simulada (boletas y facturas), control de ingresos y egresos, e impresión de tickets térmicos (80mm).
4. **Panel de Administración:** Control total de usuarios, locales/sedes, empresas facturadoras, zonas, mesas, categorías, subcategorías y platos del menú.
5. **Diseño Visual de Vanguardia:** Interfaz premium con efectos de glassmorphism, Outfit font para títulos, animaciones fluidas y soporte completo para modo claro/oscuro.

---

## 🛠️ Desarrollo Local

Instala las dependencias y arranca el servidor de desarrollo:

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo con HMR
npm run dev
```

El servidor web local arrancará en [http://localhost:5173](http://localhost:5173).

---

## 📦 Servidor de Producción y Despliegue en la Nube

Para ejecutar la aplicación localmente en modo producción o desplegarla de forma **100% gratuita ($0)** en la nube (como Render o Koyeb), el proyecto incluye un servidor de producción ligero e independiente (`server.cjs`).

### Ejecución Local de Producción:
```bash
# Compilar la aplicación React
npm run build

# Iniciar el servidor de Node
npm start
```
El servidor web de producción local arrancará en [http://localhost:3000](http://localhost:3000).

### Despliegue Gratis en Render:
1. Sube este repositorio a tu GitHub.
2. Crea un nuevo **Web Service** en [Render.com](https://render.com/).
3. Conecta tu repositorio de GitHub.
4. Usa los siguientes valores:
   * **Root Directory:** `cafeteria-app`
   * **Build Command:** `npm run build`
   * **Start Command:** `npm start`
   * **Instance Type:** `Free` ($0/month)
