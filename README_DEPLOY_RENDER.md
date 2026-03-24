# Deploy Zamor Manager On Render

## 1. Create The Render Web Service

1. Push `zamor-manager` to GitHub.
2. In Render, create a new `Blueprint` or `Web Service`.
3. Connect the GitHub repository.
4. If you use the Blueprint flow, Render reads `render.yaml` automatically.

## 2. Configure The Root Directory

Use the backend folder as the Render root directory if you deploy manually:

`zamor-manager/server`

## 3. Add Environment Variables

Create these variables in Render:

```env
PORT=10000
DB_HOST=your-mysql-host
DB_PORT=3306
DB_USER=your-mysql-user
DB_PASSWORD=your-mysql-password
DB_NAME=your-mysql-database
JWT_SECRET=your-strong-secret
JWT_EXPIRES_IN=7d
CLIENT_URL=https://your-frontend-domain.onrender.com
NODE_ENV=production
```

Important:

- Render Blueprints support managed Postgres databases, not managed MySQL databases.
- For this project, keep MySQL on an external managed provider and connect it with `DB_HOST`, `DB_USER`, `DB_PASSWORD`, and `DB_NAME`.
- Preview environments require a Professional workspace or higher on Render.

If you use a custom logo path, also add:

```env
RECEIPT_LOGO_PATH=/opt/render/project/src/assets/zamor-logo.png
```

## 4. Build Command

Render build command:

```bash
npm install
```

## 5. Start Command

Render start command:

```bash
npm start
```

## 6. Frontend Build

Build the frontend before deployment:

```bash
cd client
npm install
npm run build
```

This generates the production frontend inside:

`server/build`

The Express server serves this folder automatically in production.

## 7. Preview Environments

`render.yaml` enables:

- automatic preview environments
- automatic expiration after 7 days of inactivity

Render creates a disposable preview deployment for pull requests.

## 8. Custom Domain

The advanced `render.yaml` includes a commented `domains` section.

Before syncing it, replace with your real domains, for example:

```yaml
domains:
  - app.yourdomain.com
  - www.yourdomain.com
```

## 9. Health Check

Render can use:

`/health`

Expected response:

```json
{
  "status": "OK",
  "time": 1700000000000
}
```
