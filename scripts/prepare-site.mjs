import { promises as fs } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const OUTPUT = path.join(ROOT, process.env.SITE_OUTPUT_DIR || "_site");
const ASSET_DIR = path.join(OUTPUT, "assets", "images", "remote");
const SITE_BASE_URL = (process.env.SITE_BASE_URL || "https://budapesservices-dotcom.github.io/modern-hotel-booking/")
  .replace(/\/+$/, "") + "/";
const REMOTE_RE = /https:\/\/images\.unsplash\.com\/photo-[^"'\`\\s<>)]+/g;
const TEXT_EXTENSIONS = new Set([
  ".html", ".htm", ".js", ".mjs", ".css", ".json", ".xml", ".txt", ".svg", ".webmanifest"
]);
const EXCLUDED = new Set([
  ".git", ".github", "node_modules", "_site", "scripts", "README.md"
]);

const toPosix = value => value.split(path.sep).join("/");

const walk = async dir => {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (EXCLUDED.has(entry.name)) continue;

    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await walk(fullPath));
    } else {
      files.push(fullPath);
    }
  }

  return files;
};

const copySourceTree = async () => {
  await fs.rm(OUTPUT, { recursive: true, force: true });
  await fs.mkdir(OUTPUT, { recursive: true });

  const entries = await fs.readdir(ROOT, { withFileTypes: true });
  for (const entry of entries) {
    if (EXCLUDED.has(entry.name)) continue;

    const source = path.join(ROOT, entry.name);
    const destination = path.join(OUTPUT, entry.name);
    await fs.cp(source, destination, { recursive: true });
  }
};

const textFiles = files =>
  files.filter(file => TEXT_EXTENSIONS.has(path.extname(file).toLowerCase()));

const extractRemoteUrls = async files => {
  const urls = new Set();

  for (const file of textFiles(files)) {
    const content = await fs.readFile(file, "utf8");
    for (const match of content.matchAll(REMOTE_RE)) {
      urls.add(match[0]);
    }
  }

  return urls;
};

const deriveHeroMobileUrls = async files => {
  const heroConfig = files.find(file => toPosix(path.relative(OUTPUT, file)) === "js/hero-config.js");
  if (!heroConfig) return [];

  const content = await fs.readFile(heroConfig, "utf8");
  const mobileUrls = [];

  for (const match of content.matchAll(REMOTE_RE)) {
    try {
      const url = new URL(match[0]);
      const width = url.searchParams.get("w");
      if (width === "1400") {
        url.searchParams.set("w", "760");
        url.searchParams.set("q", "78");
        mobileUrls.push(url.toString());
      }
    } catch {
      // Ignore malformed URLs; the main asset pass will report a useful error if needed.
    }
  }

  return mobileUrls;
};

const forceJpeg = sourceUrl => {
  const url = new URL(sourceUrl);
  url.searchParams.delete("auto");
  url.searchParams.set("fm", "jpg");
  return url.toString();
};

const assetFilename = sourceUrl => {
  const url = new URL(sourceUrl);
  const photoId = path.basename(url.pathname);
  const width = url.searchParams.get("w") || "original";
  const quality = url.searchParams.get("q") || "82";
  return `${photoId}-w${width}-q${quality}.jpg`;
};

const downloadAssets = async urls => {
  await fs.mkdir(ASSET_DIR, { recursive: true });
  const assets = new Map();

  for (const sourceUrl of urls) {
    const filename = assetFilename(sourceUrl);
    const destination = path.join(ASSET_DIR, filename);

    if (!(await fileExists(destination))) {
      const response = await fetch(forceJpeg(sourceUrl), {
        headers: {
          Accept: "image/jpeg",
          "User-Agent": "The-Still-Hotel-static-site-build/1.0"
        },
        signal: AbortSignal.timeout(30000)
      });

      if (!response.ok) {
        throw new Error(`Image download failed (${response.status}) for ${sourceUrl}`);
      }

      const contentType = response.headers.get("content-type") || "";
      if (!contentType.toLowerCase().startsWith("image/")) {
        throw new Error(`Unexpected image response for ${sourceUrl}: ${contentType || "unknown content type"}`);
      }

      const bytes = Buffer.from(await response.arrayBuffer());
      if (!bytes.length) {
        throw new Error(`Empty image response for ${sourceUrl}`);
      }

      await fs.writeFile(destination, bytes);
    }

    assets.set(sourceUrl, `assets/images/remote/${filename}`);
  }

  return assets;
};

const fileExists = async file => {
  try {
    await fs.access(file);
    return true;
  } catch {
    return false;
  }
};

const isOpenGraphImageMeta = (source, offset) => {
  const context = source.slice(Math.max(0, offset - 260), offset + 40);
  return /<(?:meta)\\b[^>]*(?:property|name)=["'](?:og:image|twitter:image)["'][^>]*content=["']?$/i.test(context);
};

const rewriteFiles = async (files, assets) => {
  for (const file of textFiles(files)) {
    const extension = path.extname(file).toLowerCase();
    let content = await fs.readFile(file, "utf8");

    content = content.replace(
      /(<meta\\b[^>]*(?:property|name)=["'](?:og:image|twitter:image)["'][^>]*content=["'])(https:\/\/images\.unsplash\.com\/photo-[^"'\`\\s<>)]+)(["'][^>]*>)/gi,
      (_, prefix, sourceUrl, suffix) => {
        const localPath = assets.get(sourceUrl);
        if (!localPath) return _;
        return prefix + SITE_BASE_URL + localPath + suffix;
      }
    );

    content = content.replace(REMOTE_RE, (sourceUrl, offset, source) => {
      const assetPath = assets.get(sourceUrl);
      if (!assetPath) return sourceUrl;

      if (extension === ".css") {
        return "../" + assetPath;
      }

      return assetPath;
    });

    if (REMOTE_RE.test(content)) {
      REMOTE_RE.lastIndex = 0;
      throw new Error(`Remote Unsplash image reference remained in ${toPosix(path.relative(OUTPUT, file))}`);
    }
    REMOTE_RE.lastIndex = 0;

    await fs.writeFile(file, content, "utf8");
  }
};

const main = async () => {
  console.log("Preparing production site...");
  await copySourceTree();

  const files = await walk(OUTPUT);
  const remoteUrls = await extractRemoteUrls(files);
  const heroMobileUrls = await deriveHeroMobileUrls(files);

  for (const url of heroMobileUrls) {
    remoteUrls.add(url);
  }

  console.log(`Found ${remoteUrls.size} unique Unsplash asset URLs.`);
  const assets = await downloadAssets(remoteUrls);
  await rewriteFiles(files, assets);

  const finalFiles = await textFiles(await walk(OUTPUT));
  const remaining = [];

  for (const file of finalFiles) {
    const content = await fs.readFile(file, "utf8");
    if (REMOTE_RE.test(content)) {
      remaining.push(toPosix(path.relative(OUTPUT, file)));
    }
    REMOTE_RE.lastIndex = 0;
  }

  if (remaining.length) {
    throw new Error(`Remote image references remain in: ${remaining.join(", ")}`);
  }

  console.log(`Production site ready at ${OUTPUT}`);
};

main().catch(error => {
  console.error(error);
  process.exit(1);
});
