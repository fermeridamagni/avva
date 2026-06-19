// @ts-check

import starlight from "@astrojs/starlight";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";
import lucodeStarlight from "lucode-starlight";

// https://astro.build/config
export default defineConfig({
  site: 'https://fermeridamagni.github.io',
  base: '/avva',
  integrations: [
    starlight({
      title: "AVVA",
      customCss: ["./src/styles/global.css"],
      plugins: [lucodeStarlight()],
      social: [
        {
          icon: "github",
          label: "GitHub",
          href: "https://github.com/lucas-labs",
        },
      ],
      sidebar: [
        {
          label: "Project Spec",
          items: [
            { label: "Architecture", slug: "spec/architecture" },
            { label: "Hardware setup", slug: "spec/hardware" },
          ],
        },
      ],
    }),
  ],

  vite: {
    plugins: [tailwindcss()],
  },
});
