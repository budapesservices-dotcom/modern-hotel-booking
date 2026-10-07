# The Still Hotel

A modern, lightweight hotel booking concept built with semantic HTML5, CSS and vanilla JavaScript.

## Pages

- `index.html` — cinematic home page, automatic background gallery, story-led sections and booking CTA.
- `rooms.html` — individual room blocks, amenities and a future pricing area.
- `gallery.html` — editorial masonry-style gallery with lightbox.
- `contact.html` — contact form, WhatsApp, email and embedded Google Map.
- `css/*.css` — modular source styles split by visual/page responsibility.
- `css/style.css` — generated runtime bundle produced from the modular CSS sources by `scripts/build-css.mjs`.
- `scripts/build-css.mjs` — deterministic CSS bundler that preserves the original cascade order.
- `js/main.js` — navigation, scroll reveal, booking drawer, carousel flow, filters and lightbox.
- `js/contact-config.js` — single source for WhatsApp number, phone, email and map location.


### CSS architecture

The stylesheet is maintained as ordered modules so individual page systems can be edited without navigating one monolithic source file. The deployment still serves a single `css/style.css` bundle, so the browser does not pay for a larger number of render-blocking CSS files. The module order is intentionally fixed to preserve the existing cascade and visual behavior.

## Concept

**THE STILL HOTEL — A hotel for slower hours.**

The experience is organised around moments of the day instead of a generic hotel-template sequence. Time becomes part of the visual identity: morning, afternoon, blue hour and night. The hero is a looping timeline: imagery, mood color and time rail move together.


## Hero timeline

The homepage hero is controlled from `js/hero-config.js`. This is the only file a client needs to touch for the hero image sequence.

Each item contains `time`, `label`, `caption`, `tone` and `image`. Add or replace an item in that array and the hero automatically creates the corresponding image scene and time-rail control. The sequence loops continuously and accepts any number of scenes.

For the final handoff, store approved images under `assets/images/hero/` and replace the remote image URL in the config with the local path. No HTML restructuring is required.

### Production image pipeline

The source keeps the current Unsplash URLs as reproducible image inputs. During the GitHub Pages build, `scripts/prepare-site.mjs` downloads those images into the deployment artifact, rewrites the site's image references to local assets, preserves the hero's mobile/desktop variants, and fails the build if any Unsplash image reference remains in the published site. This removes the runtime dependency on the Unsplash CDN while keeping the current visual asset set intact.

Unsplash's current license allows downloading and using its images for free, including commercial use, subject to its license terms. For a final client handoff, replace the sample imagery with approved/licensed project photography where required.

## Booking flow

Booking is a request workflow, not a final reservation confirmation. The guest reviews the stay details, the request is stored locally for the demo, and the flow opens WhatsApp with a pre-filled request so the hotel can confirm availability, final rates and stay conditions directly. Contact enquiries use a lightweight static form endpoint so the site remains a plain HTML/CSS/JS build without its own server.


### Contact configuration

Open `js/contact-config.js` and replace `whatsappNumber`, `phoneDisplay`, `phoneHref`, `email` and `mapQuery` once. All WhatsApp, phone, email and map actions across the site read from this file.

The booking review's **Send request** button records a booking request and opens a direct WhatsApp chat using the configured number. The request receives a Customer Booking ID for reference, but it is not treated as confirmed until the hotel confirms availability and final stay conditions. The contact form also reads the configured email instead of a hard-coded recipient.

## Image sources

The foundation currently references Unsplash-hosted images remotely. Images use responsive Unsplash sizing, `loading="lazy"` for below-the-fold content, and asynchronous decoding where appropriate. For a production handoff, you may still download a consistent set of legally reusable images, optimise them locally (WebP/AVIF where appropriate), store them under `assets/images/`, and record source URLs/licensing information.


- `index.html` Our Story exterior image: Unsplash photo by Suryaman Shrestha, “Modern hotel building at dusk with illuminated entrance and cars,” available under the Unsplash License. citeturn515281view0

## Updating content

1. Open the relevant HTML file.
2. Replace the text inside the semantic headings, paragraphs or room blocks.
3. Replace image `src` URLs and update the corresponding `alt` text.
4. Add final pricing when supplied.
5. Replace the contact details and optional map embed.

## Final QA checklist

- Test desktop, laptop, tablet and mobile widths.
- Test navigation and booking drawer with keyboard.
- Test the lightbox and WhatsApp hand-off.
- Confirm all links and contact information.
- Convert remote development images to optimised local assets.
- Run a performance and accessibility pass before contest submission.
