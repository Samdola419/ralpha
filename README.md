# R Alpha

R Alpha is a browser-based chat workspace. It is deployed as a static website on Vercel, with the search endpoint in `api/search.js` running as a Vercel serverless function.

## Deploy on Vercel

1. Import this project into Vercel with the project root set to the folder containing `index.html` and `vercel.json`.
2. In **Project → Settings → Environment Variables**, add `FIRECRAWL_API_KEY` with your Firecrawl key for Production (and Preview/Development if you use those environments).
3. Redeploy after changing environment variables.
4. Open R Alpha, connect your inference provider in Settings, and enable Search and Files if they are currently disabled.

Do not paste the Firecrawl secret into `index.html`, commit it to Git, or include it in a ZIP. `api/search.js` reads the secret from `process.env.FIRECRAWL_API_KEY`.

## Search fallback behavior

The existing fallback order is preserved:

- The app first calls `/api/search` on the deployed Vercel project. That function tries the configured Firecrawl key, then Firecrawl keyless.
- If the endpoint fails, the browser tries Firecrawl keyless directly.
- If that fails, the browser tries Wikipedia search.

The app now performs a direct pre-search for explicit search requests and likely factual/current questions, and the model is also instructed to use the search tool when needed. Search can still be disabled in Settings.

## Model tools and output

The agent tool loop now feeds each tool call and tool result into the next model request without adding synthetic tool messages to the visible chat. `run_code` captures console output and awaits asynchronous JavaScript. High thinking effort requests up to 500,000 output tokens where the selected model/provider accepts that parameter. The provider's own context/output limits remain authoritative; a compatibility retry falls back to the provider default if it rejects both supported token-limit parameter styles.

## Files and exports

R Alpha can bundle generated project files into a ZIP and export source files into PDF, DOCX, XLSX or PPTX in the browser. PDF requests use an internal print-ready HTML source and present the PDF as the deliverable. DOCX uses Markdown/HTML document source, XLSX uses CSV/JSON or a Markdown table, and PPTX uses Markdown slides separated by `---`.

The JSZip, html2pdf.js, docx, SheetJS and PptxGenJS browser libraries are loaded from pinned CDN versions only when the relevant export is requested.

## Rive

See [`RIVE-SETUP.md`](RIVE-SETUP.md). R Alpha's mascot keeps its original SVG fallback. A compiled `assets/ember.riv` activates the optional Rive Canvas runtime and should contain an `Ember` state machine with boolean inputs `thinking`, `writing` and `error`. The web runtime can play compiled `.riv` files; compiling custom `.rml` into `.riv` requires the Rive CLI in a local/CI build workspace, not the browser preview sandbox.
