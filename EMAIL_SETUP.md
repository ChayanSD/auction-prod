# Email Configuration Guide

## Overview
The newsletter and email notification features work in both **development** and **production** environments. However, you need to configure email credentials for emails to be sent.

## Required Environment Variables

Add these to your `.env.local` file (for development) or your production environment:

```env
# Email Configuration (Gmail)
APP_EMAIL=your-email@gmail.com
APP_PASSWORD=your-app-password

# OR use SMTP variables (alternative)
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# Optional: Custom sender name
SMTP_FROM_NAME=Supermedia Bros
```

## Setting Up Gmail App Password

1. **Enable 2-Factor Authentication** on your Gmail account
2. Go to [Google Account Settings](https://myaccount.google.com/)
3. Navigate to **Security** → **2-Step Verification**
4. Scroll down to **App passwords**
5. Generate a new app password for "Mail"
6. Copy the 16-character password
7. Use this password as `APP_PASSWORD` (not your regular Gmail password)

## Testing Email Configuration

1. Make sure your `.env.local` file has the email credentials
2. Restart your development server after adding environment variables
3. Try sending a newsletter from the CMS admin panel
4. Check the server console logs for email sending status

## Troubleshooting

### Emails not sending?
- Check that environment variables are set correctly
- Verify the app password is correct (not your regular password)
- Check server console logs for error messages
- Ensure 2FA is enabled on your Gmail account

### "Email not configured" error?
- Make sure `.env.local` exists in the project root
- Restart the development server after adding variables
- Verify variable names match exactly: `APP_EMAIL` and `APP_PASSWORD`

## Production Deployment

For production, set these environment variables in your hosting platform:
- **Vercel**: Add in Project Settings → Environment Variables
- **Other platforms**: Add via their environment variable configuration

The same email configuration works in both development and production!
