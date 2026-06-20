import starlight from "@astrojs/starlight";
import { defineConfig } from "astro/config";
import lucodeStarlight from "lucode-starlight";

// https://astro.build/config
export default defineConfig({
  site: "https://fermeridamagni.github.io",
  base: "/avva",
  integrations: [
    starlight({
      title: "AVVA",
      logo: {
        src: "./src/assets/icon.png",
      },
      defaultLocale: "root",
      locales: {
        root: {
          label: "Español",
          lang: "es",
        },
      },
      customCss: ["./src/styles/global.css"],
      plugins: [lucodeStarlight()],
      social: [
        {
          icon: "github",
          label: "GitHub",
          href: "https://github.com/fermeridamagni/avva",
        },
      ],
      sidebar: [
        {
          label: "Especificaciones",
          items: [
            { label: "Arquitectura", slug: "spec/architecture" },
            { label: "Hardware", slug: "spec/hardware" },
          ],
        },
      ],
    }),
  ],
});
