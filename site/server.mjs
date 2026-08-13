import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve, relative, isAbsolute, sep } from "node:path";

const root = dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT ?? 3000);

const server = createServer(async (request, response) => {
  let requested;
  try {
    const pathname = new URL(request.url ?? "/", "http://localhost").pathname;
    requested = pathname === "/" ? "index.html" : decodeURIComponent(pathname.slice(1));
  } catch {
    response.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Bad request");
    return;
  }
  const filePath = resolve(root, requested);
  const relativePath = relative(root, filePath);
  if (isAbsolute(relativePath) || relativePath === ".." || relativePath.startsWith(`..${sep}`)) {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
    return;
  }

  try {
    const body = await readFile(filePath);
    const contentType = filePath.endsWith(".webp")
      ? "image/webp"
      : filePath.endsWith(".svg")
        ? "image/svg+xml; charset=utf-8"
      : filePath.endsWith(".ico")
        ? "image/x-icon"
      : filePath.endsWith(".png")
        ? "image/png"
      : filePath.endsWith(".webmanifest")
        ? "application/manifest+json; charset=utf-8"
      : filePath.endsWith(".xml")
        ? "application/xml; charset=utf-8"
      : filePath.endsWith(".txt")
        ? "text/plain; charset=utf-8"
      : filePath.endsWith(".js")
        ? "text/javascript; charset=utf-8"
        : filePath.endsWith(".map") || filePath.endsWith(".json")
          ? "application/json; charset=utf-8"
          : filePath.endsWith(".css")
            ? "text/css; charset=utf-8"
            : "text/html; charset=utf-8";
    response.writeHead(200, {
      "Content-Type": contentType,
      "Cache-Control": "no-cache",
    });
    response.end(body);
  } catch {
    response.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Unable to load DoktorDev site");
  }
});

server.listen(port, "localhost", () => {
  console.log(`DoktorDev site running at http://localhost:${port}`);
});
