/**
 * Copyright (c) 2017-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// See https://docusaurus.io/docs/site-config for all the possible site configuration options.

const siteConfig = {
  title: 'Auspice', // Title for your website.
  tagline: 'Interactive exploration of phylodynamic & phylogenomic data.',
  projectName: 'auspice',
  organizationName: 'nextstrain',
  url: 'https://nextstrain.github.io', // Your website URL
  baseUrl: '/auspice/', // Base URL for your project */

  // Header links in the top nav bar
  headerLinks: [
    {doc: 'overview', label: 'Docs'}
  ],

  /* path to images for header/footer */
  headerIcon: 'img/icon.svg',
  footerIcon: 'img/icon.svg',
  favicon: 'img/favicon.ico',

  colors: {
    primaryColor: '#30353F', /* header navigation bar and sidebars */
    secondaryColor: '#5DA8A3' /* second row of the header navigation bar when the site window is narrow */
  },

  /* Custom fonts for website */
  /*
  fonts: {
    myFont: [
      "Times New Roman",
      "Serif"
    ],
    myOtherFont: [
      "-apple-system",
      "system-ui"
    ]
  },
  */

  // This copyright info is used in /core/Footer.js and blog RSS/Atom feeds.
  copyright: `Copyright © 2014-${new Date().getFullYear()} Richard Neher & Trevor Bedford`,

  highlight: {
    // The name of the theme used by Highlight.js when highlighting code.
    // You can find the list of supported themes here:
    // https://github.com/isagalaev/highlight.js/tree/master/src/styles
    theme: 'solarized-dark'
  },

  // Add custom scripts here that would be placed in <script> tags.
  scripts: ['https://buttons.github.io/buttons.js'],

  // On page navigation for the current documentation page.
  onPageNav: 'separate',

  // No .html extensions for paths.
  cleanUrl: true,

  // Open Graph and Twitter card images.
  ogImage: 'img/icon.svg',
  twitterImage: 'img/icon.svg',

  // Show documentation's last contributor's name.
  // enableUpdateBy: true,

  // Show documentation's last update time.
  enableUpdateTime: true,

  // disableHeaderTitle: true, /* don't automatically add title to top of page */
  docsUrl: '' /* no /docs/ in URL */

  // You may provide arbitrary config keys to be used as needed by your
  // template. For example, if you need your repo's URL...
  //   repoUrl: 'https://github.com/facebook/test-site',
};

module.exports = siteConfig;
