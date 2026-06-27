module.exports = function (eleventyConfig) {
  // NHS design system assets and our own assets are copied as-is.
  eleventyConfig.addPassthroughCopy({
    'node_modules/nhsuk-frontend/dist/nhsuk': 'nhsuk-frontend',
  });
  eleventyConfig.addPassthroughCopy({ 'src/assets': 'assets' });

  eleventyConfig.addFilter('year', () => new Date().getFullYear());

  return {
    dir: {
      input: 'src',
      output: '_site',
      includes: '_includes',
      data: '_data',
    },
    markdownTemplateEngine: 'njk',
    htmlTemplateEngine: 'njk',
    // GitHub project Pages serve under /<repo>/. Override at build time with
    // PATH_PREFIX (the deploy workflow sets this). Defaults to "/" for local.
    pathPrefix: process.env.PATH_PREFIX || '/',
  };
};
