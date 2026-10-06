# The Still Hotel

A modern, lightweight hotel booking concept built with semantic HTML5, CSS and vanilla JavaScript.

## Pages

- `index.html` — cinematic home page, automatic background gallery, story-led sections and booking CTA.
- `rooms.html` — individual room blocks, amenities and a future pricing area.
- `gallery.html` — editorial masonry-style gallery with lightbox.
- `contact.html` — contact form, WhatsApp, email and embedded Google Map.
- `css/style.css` — responsive design system, typography, layout and motion.
- `js/main.js` — navigation, scroll reveal, booking drawer, carousel flow, filters and lightbox.
- `js/contact-config.js` — single source for WhatsApp number, phone, email and map location.

## Concept

**THE STILL HOTEL — A hotel for slower hours.**

The experience is organised around moments of the day instead of a generic hotel-template sequence. Time becomes part of the visual identity: morning, afternoon, blue hour and night. The hero is a looping timeline: imagery, mood color and time rail move together.


## Hero timeline

The homepage hero is controlled from `js/hero-config.js`. This is the only file a client needs to touch for the hero image sequence.

Each item contains `time`, `label`, `caption`, `tone` and `image`. Add or replace an item in that array and the hero automatically creates the corresponding image scene and time-rail control. The sequence loops continuously and accepts any number of scenes.

For the final handoff, store approved images under `assets/images/hero/` and replace the remote image URL in the config with the local path. No HTML restructuring is required.

## Booking flow

Booking uses the existing client-side WhatsApp hand-off. Contact enquiries use a lightweight static form endpoint so the site remains a plain HTML/CSS/JS build without its own server.


### Contact configuration

Open `js/contact-config.js` and replace `whatsappNumber`, `phoneDisplay`, `phoneHref`, `email` and `mapQuery` once. All WhatsApp, phone, email and map actions across the site read from this file.

The booking review's **Continue** button generates a concise booking summary and opens a direct WhatsApp chat using the configured number. The contact form also reads the configured email instead of a hard-coded recipient.

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
