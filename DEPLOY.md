# Deploying Phonix Printer to Fly.io

This guide will help you deploy your Phonix Printer website to Fly.io.

## Prerequisites

1. **Install Fly.io CLI**
   - Visit: https://fly.io/docs/getting-started/installing-flyctl/
   - Or use: `powershell -Command "iwr https://fly.io/install.ps1 -useb | iex"` (Windows PowerShell)

2. **Create a Fly.io account**
   - Visit: https://fly.io/app/sign-up
   - Sign up for a free account

## Deployment Steps

### 1. Login to Fly.io

```bash
fly auth login
```

This will open a browser window for you to authenticate.

### 2. Initialize Fly.io App (if not already done)

```bash
fly launch
```

When prompted:
- **App name**: Use the default or choose `phonix-printer`
- **Region**: Choose the closest region (e.g., `iad` for Washington D.C.)
- **Postgres**: No (unless you need a database)
- **Redis**: No (unless you need it)

### 3. Deploy the Application

```bash
fly deploy
```

This will:
- Build the Docker image
- Push it to Fly.io
- Deploy your application

### 4. Open Your App

```bash
fly open
```

This will open your deployed website in your browser.

### 5. Check App Status

```bash
fly status
```

### 6. View Logs

```bash
fly logs
```

## Important Notes

1. **Telegram Bot Token**: The bot token is currently hardcoded in `server.js`. For production, consider using Fly.io secrets:
   ```bash
   fly secrets set TELEGRAM_BOT_TOKEN=your_token_here
   ```

2. **File Uploads**: The `uploads/` directory is ephemeral on Fly.io. Files will be deleted when the app restarts. Consider using Fly.io volumes for persistent storage if needed.

3. **Environment Variables**: You can set environment variables using:
   ```bash
   fly secrets set KEY=value
   ```

4. **Scaling**: Your app is configured to auto-stop when idle and auto-start when needed. You can manually scale:
   ```bash
   fly scale count 1
   ```

## Troubleshooting

- **Build fails**: Check `fly logs` for errors
- **App won't start**: Check `fly status` and `fly logs`
- **Port issues**: Ensure PORT environment variable is set (already configured in fly.toml)

## Useful Commands

```bash
# View app info
fly info

# SSH into the app
fly ssh console

# Restart the app
fly apps restart phonix-printer

# View metrics
fly metrics
```

## Next Steps

After deployment:
1. Test all pages on your live site
2. Test the Telegram bot integration
3. Set up a custom domain (optional)
4. Monitor the app with `fly logs`

Your website will be available at: `https://phonix-printer.fly.dev`

