# Project website

The public website for the Digital Sickle Cell Care Plan programme, built with
[Eleventy](https://www.11ty.dev/) and the NHS design system. Deployed to GitHub Pages.

## Develop

```bash
npm install
npm start          # serve locally with live reload at http://localhost:8080
npm run build      # build static site to _site/
```

## Deployment

Pushing to `main` triggers `.github/workflows/pages.yml`, which builds the site with the correct
`PATH_PREFIX` (the repository name, for GitHub project Pages) and publishes `_site/` to GitHub
Pages.

## Editing content

Pages live in `src/*.njk` with simple front matter (`title`, `description`). Navigation and site
metadata are in `src/_data/site.js`. The shared layout is `src/_includes/base.njk`.
