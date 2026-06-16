# Modular CMS content

In production-server mode the old monolithic `assets/js/data.js` is used only as the first boot seed.
After the first admin save the backend splits the CMS state into modular JSON files in `data/content/`:

- `settings.json`
- `sitePages.json`
- `services.json`
- `realEstate.json`
- `cars.json`
- `parkings.json`
- `b2bOffers.json`
- `promotions.json`
- `blogArticles.json`
- `blogTopics.json`
- `reviews.json`
- `socialLinks.json`
- `seo.json`
- every other top-level collection as its own file

The browser no longer needs to store production data in `localStorage`. It receives public content from `/api/site-data`, while admin writes go through authenticated `/api/admin/site-data` with CSRF protection.
