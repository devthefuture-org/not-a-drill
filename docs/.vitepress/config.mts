import { defineConfig } from 'vitepress';

const repo = 'https://github.com/devthefuture-org/not-a-drill';

export default defineConfig({
  title: 'NOT_A_DRILL.md',
  base: '/not-a-drill/',
  cleanUrls: true,
  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/not-a-drill/favicon.svg' }],
    ['meta', { name: 'theme-color', content: '#b91c1c' }],
  ],
  themeConfig: {
    socialLinks: [
      { icon: 'github', link: repo },
      { icon: 'npm', link: 'https://www.npmjs.com/package/not-a-drill' },
    ],
    search: { provider: 'local' },
    footer: {
      message: 'Text under CC BY 4.0, code under the MIT License.',
      copyright: '© 2026 DevTheFuture',
    },
  },
  locales: {
    root: {
      label: 'English',
      lang: 'en',
      description: 'A plain-text sign for AI agents that arrive on your system: it is real, it belongs to someone, here is what you may do, here is how to reach a human.',
      themeConfig: {
        nav: [
          { text: 'Guide', link: '/guide' },
          { text: 'CLI', link: '/cli' },
          { text: 'Prompts', link: '/prompts' },
          { text: 'Template', link: '/template' },
        ],
        sidebar: [
          {
            text: 'NOT_A_DRILL.md',
            items: [
              { text: 'Guide', link: '/guide' },
              { text: 'CLI', link: '/cli' },
              { text: 'Prompts to copy', link: '/prompts' },
              { text: 'Template', link: '/template' },
            ],
          },
        ],
        editLink: { pattern: `${repo}/edit/main/docs/:path`, text: 'Edit this page' },
      },
    },
    fr: {
      label: 'Français',
      lang: 'fr',
      link: '/fr/',
      description: "Un panneau en texte brut pour les agents IA qui arrivent sur votre système : il est réel, il appartient à quelqu'un, voici ce qui y est permis, voici comment joindre un humain.",
      themeConfig: {
        nav: [
          { text: 'Guide', link: '/fr/guide' },
          { text: 'CLI', link: '/fr/cli' },
          { text: 'Prompts', link: '/fr/prompts' },
          { text: 'Modèle', link: '/fr/template' },
        ],
        sidebar: [
          {
            text: 'NOT_A_DRILL.md',
            items: [
              { text: 'Guide', link: '/fr/guide' },
              { text: 'CLI', link: '/fr/cli' },
              { text: 'Prompts à copier', link: '/fr/prompts' },
              { text: 'Modèle', link: '/fr/template' },
            ],
          },
        ],
        editLink: { pattern: `${repo}/edit/main/docs/:path`, text: 'Modifier cette page' },
        outline: { label: 'Sur cette page' },
        docFooter: { prev: 'Page précédente', next: 'Page suivante' },
        darkModeSwitchLabel: 'Apparence',
        sidebarMenuLabel: 'Menu',
        returnToTopLabel: 'Retour en haut',
        langMenuLabel: 'Changer de langue',
      },
    },
  },
});
