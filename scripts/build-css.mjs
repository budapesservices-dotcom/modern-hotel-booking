import { promises as fs } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const CSS_DIR = path.join(ROOT, "css");
const RUNTIME_DIR = path.join(CSS_DIR, "runtime");
const OUTPUT = path.join(CSS_DIR, "style.css");

const MODULES = [
  "01-core.css",
  "02-home.css",
  "03-story-responsive.css",
  "04-rooms.css",
  "05-gallery.css",
  "06-amenities.css",
  "07-about.css",
  "08-about-login-shared.css",
  "09-global-contact.css",
  "10-login.css",
  "11-booking.css",
  "12-your-booking.css",
  "13-admin-bookings.css",
  "14-motion.css"
];

// Keep the original cascade order inside every page bundle.
// Some source modules intentionally contain shared/responsive rules for
// more than one page, so page manifests are explicit and conservative.
const PAGE_BUNDLES = {
  home: [
    "01-core.css",
    "02-home.css",
    "03-story-responsive.css",
    "09-global-contact.css",
    "11-booking.css",
    "14-motion.css"
  ],
  rooms: [
    "01-core.css",
    "04-rooms.css",
    "09-global-contact.css",
    "11-booking.css",
    "14-motion.css"
  ],
  gallery: [
    "01-core.css",
    "05-gallery.css",
    "09-global-contact.css",
    "14-motion.css"
  ],
  amenities: [
    "01-core.css",
    "06-amenities.css",
    "08-about-login-shared.css",
    "09-global-contact.css",
    "14-motion.css"
  ],
  about: [
    "01-core.css",
    "06-amenities.css",
    "07-about.css",
    "08-about-login-shared.css",
    "09-global-contact.css",
    "14-motion.css"
  ],
  contact: [
    "01-core.css",
    "09-global-contact.css",
    "10-login.css",
    "14-motion.css"
  ],
  "your-booking": [
    "01-core.css",
    "09-global-contact.css",
    "12-your-booking.css",
    "14-motion.css"
  ],
  login: [
    "01-core.css",
    "08-about-login-shared.css",
    "10-login.css",
    "14-motion.css"
  ],
  "admin-bookings": [
    "01-core.css",
    "13-admin-bookings.css"
  ]
};

const readModule = async (filename) => {
  const file = path.join(CSS_DIR, filename);
  const content = await fs.readFile(file, "utf8");
  return content.replace(
    /^\/\* =========================================================[\s\S]*?========================================================= \*\/\s*/m,
    ""
  ).trimEnd();
};

const buildBundle = async (name, modules) => {
  const parts = [];
  for (const filename of modules) {
    parts.push(await readModule(filename));
  }

  const bundle =
    `/* Generated from css/*.css modules by scripts/build-css.mjs. Bundle: ${name}. */\n\n` +
    parts.join("\n\n") +
    "\n";

  const output = path.join(RUNTIME_DIR, `${name}.css`);
  await fs.writeFile(output, bundle, "utf8");
  console.log(`Built ${output} from ${modules.length} CSS modules.`);
};

const main = async () => {
  await fs.mkdir(RUNTIME_DIR, { recursive: true });

  // Preserve the original full bundle as a fallback/debug artifact.
  const fullParts = [];
  for (const filename of MODULES) {
    fullParts.push(await readModule(filename));
  }
  const fullBundle =
    "/* Generated from css/*.css modules by scripts/build-css.mjs. Full bundle. */\n\n" +
    fullParts.join("\n\n") +
    "\n";
  await fs.writeFile(OUTPUT, fullBundle, "utf8");
  console.log(`Built ${OUTPUT} from ${MODULES.length} CSS modules.`);

  for (const [name, modules] of Object.entries(PAGE_BUNDLES)) {
    await buildBundle(name, modules);
  }
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
