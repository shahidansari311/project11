#!/bin/bash

echo "🚀 Installing Nginx and Certbot..."
sudo apt update
sudo apt install nginx certbot python3-certbot-nginx -y

echo "🚀 Copying Nginx configuration..."
sudo cp nginx/silverreal-backend.conf /etc/nginx/sites-available/silverreal-backend

echo "🚀 Enabling configuration..."
sudo ln -sf /etc/nginx/sites-available/silverreal-backend /etc/nginx/sites-enabled/
# Remove the default nginx site so it doesn't conflict
sudo rm -f /etc/nginx/sites-enabled/default

echo "🚀 Testing Nginx config..."
sudo nginx -t

echo "🚀 Restarting Nginx..."
sudo systemctl restart nginx

echo "🚀 Running Certbot for SSL (Please answer the prompts!)..."
sudo certbot --nginx -d silverreal-backend.duckdns.org

echo "✅ All done! Your backend is now secure at https://silverreal-backend.duckdns.org"
