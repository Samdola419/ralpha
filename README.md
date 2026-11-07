# R Alpha — Vercel deployment

This project contains the R Alpha frontend and a Vercel serverless proxy for Dahl and Token Harbor.

## Deploy

1. Upload the contents of this folder to the root of a GitHub repository.
2. In Vercel, choose **Add New → Project** and import that GitHub repository.
3. Keep the framework preset as **Other**. Leave Build Command and Output Directory empty/default; there is no build step.
4. Deploy. Vercel serves `index.html` and the `/api/proxy/...` function automatically.

## Provider routing

R Alpha is configured to use these same-origin proxy URLs by default:

- Dahl: `/api/proxy/dahl/v1`
- Token Harbor: `/api/proxy/harbor/v1`

The proxy forwards only `/v1/models` and `/v1/chat/completions` to fixed provider hosts. It streams chat responses back to the browser.

## API keys and data

Users enter their own provider API keys in R Alpha. The existing frontend stores those keys in that browser's localStorage and sends them in the Authorization header. This proxy does not store API keys. Anyone who can use a deployed public site can invoke its proxy, but requests can only be forwarded to the two allowlisted providers and supported endpoints. Add authentication/rate limiting before operating a public multi-user service at scale.

## Important

`cors-proxy-worker.js` is a Cloudflare Worker file and is not used by this Vercel project. Do not deploy it as the Vercel proxy. The replacement is `api/proxy/[...path].js`.
