# One-click posting: setup

Posto.ai can publish a generated post straight to **LinkedIn** (personal profile), **Facebook Pages** and **Instagram Business/Creator** accounts. It uses each platform's official API, so you need one developer app per platform. This is a one-time setup.

> Platform limits: no app can post to a *personal* Facebook profile, and Instagram only allows posting to Business or Creator accounts that are linked to a Facebook Page. Instagram posts must have a JPEG image.

## 1. Run the database migration

Open the Supabase **SQL Editor**, paste [`supabase/migrations/001_social_posting.sql`](../supabase/migrations/001_social_posting.sql) and run it. It creates:

- `social_accounts`: connected accounts. Access tokens are encrypted, and RLS has no policies, so only the server (service role) can read them.
- `post_publications`: what was posted where, with the result. Users can read their own rows.
- Storage bucket `post-images` (public), so platforms can download the post image.

## 2. Generate the encryption key

```
openssl rand -base64 32
```

Save the output as `SOCIAL_TOKEN_KEY`. If you change it later, everyone has to reconnect their accounts.

## 3. LinkedIn app

1. Go to https://www.linkedin.com/developers/apps and click **Create app**. LinkedIn asks you to attach a company page; any page you manage works.
2. Under **Products**, add **Sign In with LinkedIn using OpenID Connect** and **Share on LinkedIn**. Both are self-serve.
3. Under **Auth → Authorized redirect URLs**, add:
   - `https://posto-ai-nine.vercel.app/api/social/callback/linkedin`
   - `http://localhost:3000/api/social/callback/linkedin` (for local dev)
4. Copy the **Client ID** and **Client Secret**.

LinkedIn tokens last 60 days. After that the account shows "expired, reconnect" on the Accounts page.

## 4. Meta app (Facebook + Instagram)

1. Go to https://developers.facebook.com/apps, click **Create app**, choose the **Business** type, and add the **Facebook Login for Business** product.
2. Under **Facebook Login → Settings → Valid OAuth Redirect URIs**, add:
   - `https://posto-ai-nine.vercel.app/api/social/callback/meta`
   - `http://localhost:3000/api/social/callback/meta`
3. Permissions used: `pages_show_list`, `pages_read_engagement`, `pages_manage_posts`, `instagram_basic`, `instagram_content_publish`, `business_management`.
4. Copy the **App ID** and **App Secret** (Settings → Basic).

While the app is in **Development mode**, only people with a role on the app (admin, developer, tester) can connect. That's enough for testing and a demo. To let any user connect, submit the permissions above for **App Review** and switch the app to **Live**.

## 5. Environment variables

Add these to `.env.local` and to Vercel (Project → Settings → Environment Variables):

```
SOCIAL_TOKEN_KEY=...            # from step 2
LINKEDIN_CLIENT_ID=...
LINKEDIN_CLIENT_SECRET=...
META_APP_ID=...
META_APP_SECRET=...

# Optional
APP_URL=https://posto-ai-nine.vercel.app   # if the redirect URL should not follow the request host
LINKEDIN_API_VERSION=202608                # defaults to two months ago
META_GRAPH_VERSION=v23.0
```

A platform with missing keys shows up greyed out on the Accounts page. The rest of the app keeps working.

## How it works

1. **Accounts** page → **Connect** → the server returns the platform's login URL with a signed `state`, and sets a short-lived nonce cookie.
2. The platform redirects to `/api/social/callback/{linkedin|meta}`. The server checks the state and cookie, exchanges the code for a token, encrypts it and saves the account. One Meta login saves every Page plus the Instagram account linked to each one.
3. On a generation, **🚀 Publish** opens a dialog: edit the text, tick accounts, publish. The server uploads the image to Storage (if it's still stored as a data URL), posts to every selected account in parallel, logs each result in `post_publications`, and returns links to the live posts.
