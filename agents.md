# Deployment Guide

Detailed instructions on how to successfully deploy this application, especially on Windows where path length limits can cause issues with standard deployment tools.

## Standard Deployment
The project includes a deployment script that can be run with:
```bash
npm run deploy
```
This script uses the `gh-pages` package to push the `dist` folder to the `gh-pages` branch.

## Manual Deployment (Windows Troubleshooting)
If `npm run deploy` fails due to "Filename too long" or "invalid index-pack output" errors, use this manual sequence:

1. **Build the project**:
   ```bash
   npm run build
   ```

2. **Deploy via manual git commands**:
   ```bash
   cd dist
   git init
   git add .
   git commit -m "Deploy to gh-pages"
   git push --force https://github.com/GreatTrog/ks2-maths-sats-arithmetic-practice.git master:gh-pages
   ```

3. **Cleanup**:
   After deployment, you can delete the temporary `.git` folder inside `dist`.

## Git Configuration for Windows
To help prevent path length issues, enable long paths in Git:
```bash
git config core.longpaths true
```
