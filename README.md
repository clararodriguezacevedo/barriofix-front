# BarrioFix — Frontend

SPA en React + Vite para pedir reparaciones del hogar y conectar con profesionales
del barrio. Consume la API de BarrioFix (FastAPI detrás de un ALB) y se sirve como
sitio estático desde S3.

- **Stack:** React 19, React Router 7, Vite 8
- **Deploy:** archivos estáticos en un bucket S3 con *static website hosting*
- **Backend:** FastAPI en EC2 detrás de un Application Load Balancer

---

## 1. Requisitos

| Herramienta | Para qué | Verificar |
|---|---|---|
| Node.js 20+ | build y dev server | `node --version` |
| npm | dependencias | `npm --version` |
| AWS CLI v2 | subir a S3 | `aws --version` |

Si `aws --version` dice que el comando no existe, instalá el CLI. En Windows:

```bash
winget install --id Amazon.AWSCLI -e
```

(o el instalador de https://aws.amazon.com/cli/). Cerrá y reabrí la terminal
después de instalar, para que tome el PATH.

Credenciales de AWS configuradas con permisos de escritura sobre el bucket:

```bash
aws configure
```

Comprobá que funcionan:

```bash
aws sts get-caller-identity
```

---

## 2. Configuración

Toda la configuración vive en `.env`. Partí del ejemplo, que documenta cada valor
y cómo obtenerlo de tu cuenta:

```bash
cp .env.example .env
```

Hay dos tipos de variables y la diferencia importa:

- **`VITE_API_URL`** — la lee la aplicación. Vite la compila **dentro** del bundle
  en tiempo de build. Si la cambiás, tenés que volver a correr `npm run build`;
  no alcanza con re-subir los archivos a S3.
- **`AWS_REGION`, `AWS_S3_BUCKET`, `AWS_S3_WEBSITE_URL`, `AWS_PROFILE`** — no las
  lee la aplicación (Vite ignora todo lo que no empiece con `VITE_`). Están para
  documentar el destino del deploy y para copiarlas a los comandos de abajo.

### Antes de buildear: confirmá que el backend está vivo

```bash
curl http://barriofix-alb-XXXXXXXXX.us-east-1.elb.amazonaws.com/health
```

Tiene que devolver `{"status":"ok"}`. Si devuelve **503**, ese ALB no tiene targets
healthy: es un problema de infraestructura, no del frontend. Puede haber más de un
ALB con nombre parecido y solo uno funcionando, así que verificá antes de compilar
la URL adentro del bundle.

---

## 3. Instalar

```bash
npm ci
```

---

## 4. Correr en local

```bash
npm run dev
```

Vite levanta en `http://localhost:5173`.

> **La UI carga, pero las llamadas a la API van a fallar.** El backend acepta
> únicamente el origen del sitio en S3, así que desde `localhost` el browser
> bloquea las respuestas por CORS. Es el comportamiento esperado, no un bug.
> Para trabajar contra el backend real hay que pedir que agreguen
> `http://localhost:5173` a la lista de orígenes permitidos.

Lint:

```bash
npm run lint
```

---

## 5. Buildear

```bash
npm run build
```

Genera `dist/` — son los únicos archivos que van a S3:

```
dist/
├── index.html
├── favicon.svg
└── assets/
    ├── index-<hash>.js
    └── index-<hash>.css
```

Los nombres de `assets/` llevan un hash que **cambia en cada build** cuando cambia
el contenido. Por eso el deploy usa `--delete`: si no, se van acumulando bundles
viejos en el bucket.

Verificá que quedó compilada la URL correcta:

```bash
grep -o "barriofix-alb-[0-9]*" dist/assets/*.js
```

Previsualizar el build localmente (mismo límite de CORS que `npm run dev`):

```bash
npm run preview
```

---

## 6. Preparar el bucket S3 (una sola vez)

Si el bucket ya está creado y sirviendo el sitio, saltá a la sección 7.

**a. Crear el bucket**

```bash
aws s3 mb s3://barriofix-frontend-clara --region us-east-1
```

**b. Permitir acceso público**

```bash
aws s3api put-public-access-block --bucket barriofix-frontend-clara --public-access-block-configuration "BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false"
```

**c. Política de lectura pública**

Guardá la política en un archivo:

```bash
cat > bucket-policy.json <<'JSON'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::barriofix-frontend-clara/*"
    }
  ]
}
JSON
```

Y aplicala:

```bash
aws s3api put-bucket-policy --bucket barriofix-frontend-clara --policy file://bucket-policy.json
```

**d. Activar static website hosting**

El documento de error tiene que ser `index.html`, igual que el índice:

```bash
aws s3 website s3://barriofix-frontend-clara --index-document index.html --error-document index.html
```

> **Por qué el error document es `index.html`:** la app usa `BrowserRouter` con
> rutas reales (`/ingreso`, `/trabajos`, `/seguimiento`, `/historial`, `/fotos`).
> Esas rutas no existen como objetos en S3. Sin esta configuración, entrar directo
> a una de ellas o recargar la página devuelve 404. Con ella, S3 sirve `index.html`
> y el router resuelve la ruta del lado del cliente.

Comprobalo desde afuera — tiene que dar `200`, no `404`:

```bash
curl -o /dev/null -w "%{http_code}\n" http://barriofix-frontend-clara.s3-website-us-east-1.amazonaws.com/trabajos
```

**e. Anotá el website endpoint**

```bash
aws s3api get-bucket-website --bucket barriofix-frontend-clara
```

La URL pública es:

```
http://barriofix-frontend-clara.s3-website-us-east-1.amazonaws.com
```

⚠️ Ese **website endpoint** es distinto del **REST endpoint**
(`https://barriofix-frontend-clara.s3.amazonaws.com`). Usá siempre el primero: el
REST endpoint no aplica el documento de error y además es un origen distinto para
CORS, así que el backend rechaza las llamadas.

---

## 7. Subir a S3

```bash
aws s3 sync dist/ s3://barriofix-frontend-clara/ --delete
```

Detalles que importan:

- Se sincroniza el **contenido** de `dist/`, no la carpeta. `index.html` tiene que
  quedar en la raíz del bucket y `assets/` conservar su prefijo
  (`assets/index-<hash>.js`).
- `--delete` borra del bucket todo lo que no esté en `dist/`. Es lo que limpia los
  bundles viejos. **Si el bucket tiene otros archivos, sacá el flag.**
- Con un perfil distinto al default, agregá `--profile <perfil>`.

Abrí el sitio:

```
http://barriofix-frontend-clara.s3-website-us-east-1.amazonaws.com
```

### Checklist post-deploy

1. La home carga y lista solicitudes (no queda en "Cargando…").
2. Entrar directo a `/trabajos` y recargar: tiene que funcionar, no dar 404.
3. La sección **Fotos** muestra las imágenes del bucket de medios.
4. La consola del browser no tiene errores de red.

---

## 8. Ciclo de trabajo habitual

```bash
npm run build
```

```bash
aws s3 sync dist/ s3://barriofix-frontend-clara/ --delete
```

Si tocaste `.env`, el build es obligatorio: la URL de la API está compilada adentro
del bundle.

---

## 9. Problemas frecuentes

**"CORS error" en la consola**

Casi siempre no es CORS. Mirá el status de la respuesta:

- **503** — el ALB no tiene targets healthy. El 503 lo genera el ALB, no la app, así
  que sale sin headers CORS y el browser lo etiqueta mal. Es infra: verificá con
  `curl http://<alb>/health`. La app muestra un mensaje explícito en este caso.
- **200 pero bloqueado** — el origen desde el que estás abriendo el sitio no está en
  la lista del backend. Comparalo carácter por carácter con lo que muestra la barra
  del browser, prestando atención al guión vs punto en `s3-website-us-east-1`.
  Pasa típicamente al abrir por el REST endpoint o desde `localhost`.

**Recargar una ruta da 404**

Falta el error document. Volvé al paso 6d.

**Los cambios no aparecen**

El bundle nuevo tiene otro hash. Confirmá que subió:

```bash
aws s3 ls s3://barriofix-frontend-clara/assets/
```

Si hay más de un `index-*.js`, faltó `--delete`. Si está solo el nuevo, es caché del
browser: recargá con `Ctrl+Shift+R`.

**Sigue pegándole al backend viejo**

La URL vieja quedó compilada en el bundle. Corregí `.env`, `npm run build` de nuevo
y volvé a sincronizar. Verificá con el `grep` de la sección 5.

**Las solicitudes nuevas aparecen y desaparecen**

Hay dos instancias detrás del ALB y los datos viven en memoria de cada proceso: no
hay base de datos. Un `POST` cae en una sola instancia y los `GET` siguientes
alternan entre las dos. La app ya trabaja alrededor de esto — usa la respuesta del
propio `POST`/`PATCH` para actualizar el estado local en lugar de re-consultar la
lista. Todo lo que se cree se pierde en el próximo redeploy.

---

## 10. No pongas HTTPS adelante sin tocar el backend

El ALB escucha solo en el puerto 80 y no tiene certificado, y `VITE_API_URL` es
`http://`. Como el sitio también se sirve por HTTP desde S3, hoy no hay problema.

Si le ponés CloudFront con HTTPS, el browser bloquea **todas** las llamadas a la API
por mixed content. Para hacerlo hace falta, en este orden: certificado ACM y listener
HTTPS en el ALB, agregar el nuevo origen a la lista de CORS del backend, actualizar
`VITE_API_URL` a `https://`, y recompilar.

---

## 11. Estructura

```
src/
├── api/client.js            # única capa de fetch; lee VITE_API_URL
├── context/
│   ├── RequestsContext.jsx  # estado de solicitudes
│   └── UserContext.jsx      # usuario actual (sin autenticación real)
├── components/
├── pages/                   # una por ruta
└── data/mockData.js         # categorías, urgencias, estados
```

Todas las llamadas HTTP pasan por `src/api/client.js`. Si hace falta cambiar cómo se
habla con el backend, ese es el único archivo a tocar.

> `.env` está versionado en el repo. Hoy no guarda secretos (solo el DNS público del
> ALB). Si en algún momento se agregan credenciales, hay que sacarlo del control de
> versiones y agregarlo a `.gitignore`.
