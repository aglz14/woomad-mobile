# woomad-boltexpo

[Edit in StackBlitz next generation editor ⚡️](https://stackblitz.com/~/github.com/aglz14/woomad-boltexpo)

# Woomad Mobile App

## Google Authentication Implementation

This app uses Supabase's OAuth implementation for Google authentication. The authentication flow works as follows:

1. When the user clicks "Continue with Google" on the login screen, the app calls `supabase.auth.signInWithOAuth()` with the Google provider.
2. Supabase returns a URL that the app opens in the device's browser.
3. The user completes the authentication in the browser.
4. After successful authentication, the browser redirects back to the app using the deep link URL scheme `woomad://auth/callback`.
5. The app handles this deep link in the `_layout.tsx` file, extracts the authentication code from the URL, and exchanges it for a session using `supabase.auth.exchangeCodeForSession()`.

### URL Scheme Configuration

The app uses the URL scheme `woomad` for deep linking. This is configured in the `app.json` file:

```json
{
  "expo": {
    "scheme": "woomad"
    // other configuration...
  }
}
```

### Deep Link Handling

Deep links are handled in the `app/_layout.tsx` file. The app listens for incoming URLs and processes authentication callbacks.

### Authentication Hook

The `useGoogleAuth` hook in `hooks/useGoogleAuth.ts` provides a simple interface for initiating Google authentication:

```typescript
const { signInWithGoogle, loading, error } = useGoogleAuth();
```

## Troubleshooting

If you encounter issues with Google authentication:

1. Make sure the correct redirect URL is configured in the Google Cloud Console.
2. Check that the URL scheme is properly configured in `app.json`.
3. Verify that deep link handling is working by testing with a sample deep link.
4. Check the console logs for any error messages during the authentication process.
