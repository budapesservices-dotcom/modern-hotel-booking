import { promises as fs } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const CSS_DIR = path.join(ROOT, "css");
const OUTPUT = path.join(CSS_DIR, "style.css");

const MODULES = [
  "01-core.css",
  "01b-shared-components.css",
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

const main = async () => {
  const parts = [];

  for (const filename of MODULES) {
    const file = path.join(CSS_DIR, filename);
    const content = await fs.readFile(file, "utf8");
    const source = content.replace(
      /^\/\* =========================================================[\\s\\S]*?========================================================= \*\/\\s*/m,
      ""
    );
    parts.push(source.trimEnd());
  }

  const bundle =
    "/* Generated from css/*.css modules by scripts/build-css.mjs. */\n\n" +
    parts.join("\n\n") +
    "\n";

  await fs.writeFile(OUTPUT, bundle, "utf8");
  console.log(`Built ${OUTPUT} from ${MODULES.length} CSS modules.`);
};

main().catch(error => {
  console.error(error);
  process.exit(1);
});
