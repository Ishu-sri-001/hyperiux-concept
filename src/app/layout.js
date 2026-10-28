import { Jost, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const display = Jost({
  variable: "--font-display",
  subsets: ["latin"],
});

const mono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400"],
});

export const metadata = {
  title: "Hyperiux — Digital Experience Design Agency",
  description:
    "Hyperiux is a global UI UX design agency crafting immersive, interactive digital experiences across the USA, Canada, the Middle East, and India.",
};

export const viewport = {
  themeColor: "#F5F2EC",
};

// Runs before first paint: hide hero copy only when JS is available, so the
// intro can reveal it. If the app never boots, the copy is shown after 8s.
const introScript = `(function(){var d=document.documentElement;d.classList.add('js-intro');try{if(localStorage.getItem('hx-accent')==='orange')d.dataset.accent='orange'}catch(e){}setTimeout(function(){if(!window.__hxBooted)d.classList.remove('js-intro')},8000)})();`;

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${display.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: introScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
