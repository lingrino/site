export const onRequest: PagesFunction = async (context) => {
  const accept = context.request.headers.get("Accept") || "";

  if (!accept.includes("text/markdown")) {
    return context.next();
  }

  // Map the request URL to the corresponding .md file
  const url = new URL(context.request.url);
  let path = url.pathname;

  // Skip non-page requests (static assets, feeds, files with extensions)
  if (path !== "/" && /\.\w+$/.test(path)) {
    return context.next();
  }

  // Build the .md path
  if (path === "/") {
    path = "/index.md";
  } else {
    path = path.replace(/\/$/, "") + ".md";
  }

  url.pathname = path;
  const mdResponse = await context.env.ASSETS.fetch(new Request(url, context.request));

  if (!mdResponse.ok) {
    return context.next();
  }

  const response = new Response(mdResponse.body, mdResponse);
  response.headers.set("Content-Type", "text/markdown; charset=utf-8");
  return response;
};
