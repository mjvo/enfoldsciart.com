import { useEffect, useRef } from "react";
import { initializeReferenceEffects } from "./reference-effects";
import header from "./content/header.html?raw";
import footer from "./content/footer.html?raw";
import site from "./content/site.json";
import home from "./content/pages/home.html?raw";
import about from "./content/pages/about.html?raw";
import schedule from "./content/pages/schedule.html?raw";
import participants from "./content/pages/participants.html?raw";
import art from "./content/pages/art.html?raw";
import contact from "./content/pages/contact.html?raw";

const pages: Record<string, { html: string; title: string }> = {
  "/": { html: home, title: "Enfold" },
  "/about": { html: about, title: "about — Enfold" },
  "/schedule": { html: schedule, title: "schedule — Enfold" },
  "/participants": { html: participants, title: "participants — Enfold" },
  "/art": { html: art, title: "art — Enfold" },
  "/contact": { html: contact, title: "contact — Enfold" },
  "/thank-you": {
    html: '<main id="page" class="reference-message"><h3>thank you.</h3><p>your message has been sent.</p></main>',
    title: "thank you — Enfold",
  },
};

export default function App() {
  const container = useRef<HTMLDivElement>(null);
  const path = window.location.pathname.replace(/\/+$/, "") || "/";
  const page = pages[path] || {
    html: '<main id="page" class="reference-message"><h3>page not found.</h3><p><a href="/">return home</a></p></main>',
    title: "page not found — Enfold",
  };

  useEffect(() => {
    const root = container.current!;
    document.title = page.title;
    document.body.className = site.bodyClass;
    document.querySelector('link[rel="canonical"]')?.setAttribute("href", `https://enfoldsciart.com${path === "/" ? "" : path}`);
    const headerElement = root.querySelector<HTMLElement>("header")!;
    const headerTheme = headerElement.getAttribute("data-section-theme") || "";
    const firstSection = root.querySelector<HTMLElement>("#page .page-section");
    const buttons = [...root.querySelectorAll<HTMLButtonElement>(".header-burger-btn")];
    const menu = root.querySelector<HTMLElement>(".header-menu")!;
    let menuOpen = false;
    let expandHeaderTimer: ReturnType<typeof setTimeout> | undefined;
    const updateHeader = () => {
      clearTimeout(expandHeaderTimer);
      if (window.scrollY > 10) headerElement.classList.add("shrink");
      else expandHeaderTimer = setTimeout(() => headerElement.classList.remove("shrink"), 300);
    };

    for (const item of root.querySelectorAll(".header-nav-item")) item.classList.remove("header-nav-item--active");
    for (const link of root.querySelectorAll<HTMLAnchorElement>('header a[href]')) {
      link.removeAttribute("aria-current");
      if (link.getAttribute("href") === path) {
        link.setAttribute("aria-current", "page");
        link.closest(".header-nav-item")?.classList.add("header-nav-item--active");
      }
    }

    const setMenu = (open: boolean) => {
      menuOpen = open;
      document.body.classList.toggle("header--menu-open", open);
      document.body.style.overflow = open ? "hidden" : "";
      headerElement.classList.toggle("black", open);
      headerElement.setAttribute("data-section-theme", open ? "black" : headerTheme);
      menu.setAttribute("aria-hidden", String(!open));
      menu.inert = !open;
      buttons.forEach(button => {
        button.setAttribute("aria-expanded", String(open));
        button.setAttribute("aria-label", open ? "Close Menu" : "Open Menu");
        button.querySelector(".js-header-burger-open-title")?.classList.toggle("hidden", open);
        button.querySelector(".js-header-burger-close-title")?.classList.toggle("hidden", !open);
        button.classList.toggle("burger--active", open);
        const openTitle = button.querySelector<HTMLElement>(".js-header-burger-open-title");
        const closeTitle = button.querySelector<HTMLElement>(".js-header-burger-close-title");
        if (openTitle) openTitle.hidden = open;
        if (closeTitle) closeTitle.hidden = !open;
      });
    };
    const resize = (observedHeight?: number) => {
      // The reference uses ResizeObserver's content box, whose subpixel
      // rounding differs slightly from getBoundingClientRect in WebKit.
      const height = observedHeight ?? headerElement.getBoundingClientRect().height;
      document.documentElement.style.setProperty("--header-height", `${height}px`);
      document.documentElement.style.setProperty("--header-fixed-top-offset", `${height}px`);
      document.documentElement.style.scrollPaddingTop = `${height}px`;
      menu.style.paddingTop = `${height}px`;
      if (firstSection) firstSection.style.paddingTop = `${height}px`;
      for (const button of root.querySelectorAll<HTMLButtonElement>('.accordion-item__click-target[aria-expanded="true"]')) {
        const panel = document.getElementById(button.getAttribute("aria-controls") || "");
        if (panel) panel.style.height = "auto";
      }
      if (window.innerWidth >= 768 && menuOpen) setMenu(false);
    };
    const setAccordion = (button: HTMLButtonElement, open: boolean) => {
      const panel = document.getElementById(button.getAttribute("aria-controls") || "");
      if (!panel) return;
      button.setAttribute("aria-expanded", String(open));
      button.closest(".accordion-item")?.classList.toggle("accordion-item--open", open);
      panel.setAttribute("aria-hidden", String(!open));
      panel.inert = !open;
      panel.classList.toggle("accordion-item__dropdown--open", open);
      if (!open && panel.style.height === "auto") {
        panel.style.height = `${panel.getBoundingClientRect().height}px`;
        void panel.offsetHeight;
      }
      panel.style.height = open ? `${panel.scrollHeight}px` : "0px";
      if (open && window.matchMedia("(prefers-reduced-motion: reduce)").matches) panel.style.height = "auto";
    };
    root.querySelectorAll<HTMLButtonElement>(".accordion-item__click-target").forEach(button => setAccordion(button, false));

    const click = (event: MouseEvent) => {
      const target = event.target instanceof Element ? event.target : null;
      if (target?.closest(".header-burger-btn")) setMenu(!menuOpen);
      const accordion = target?.closest<HTMLButtonElement>(".accordion-item__click-target");
      if (accordion) {
        const open = accordion.getAttribute("aria-expanded") !== "true";
        const list = accordion.closest(".accordion-items-container");
        if (open && list?.getAttribute("data-should-allow-multiple-open-items") === "false") {
          list.querySelectorAll<HTMLButtonElement>('.accordion-item__click-target[aria-expanded="true"]').forEach(button => setAccordion(button, false));
        }
        setAccordion(accordion, open);
      }
    };
    const keydown = (event: KeyboardEvent) => {
      if (!menuOpen) return;
      if (event.key === "Escape") { setMenu(false); buttons.find(b => b.offsetParent !== null)?.focus(); }
      if (event.key === "Tab") {
        const focusable = [...headerElement.querySelectorAll<HTMLElement>('a[href],button')].filter(el => el.offsetParent !== null && !el.closest('[inert]'));
        const first = focusable[0], last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    };
    const transitionEnd = (event: TransitionEvent) => {
      const panel = event.target instanceof HTMLElement ? event.target : null;
      if (event.propertyName === "height" && panel?.classList.contains("accordion-item__dropdown--open")) panel.style.height = "auto";
    };
    const onResize = () => resize();
    const observer = new ResizeObserver(entries => resize(entries[0].contentRect.height));
    observer.observe(headerElement);
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", updateHeader, { passive: true });
    root.addEventListener("click", click);
    root.addEventListener("transitionend", transitionEnd);
    document.addEventListener("keydown", keydown);
    setMenu(false);
    updateHeader();
    resize();
    const cleanUpEffects = initializeReferenceEffects(root);

    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const backgroundVideos = [...root.querySelectorAll<HTMLVideoElement>(".reference-background-video")];
    const updateMotion = () => backgroundVideos.forEach(video => {
      if (motion.matches) video.pause();
      else { video.muted = true; void video.play().catch(() => {}); }
    });
    updateMotion();
    motion.addEventListener("change", updateMotion);

    return () => {
      observer.disconnect();
      cleanUpEffects();
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", updateHeader);
      clearTimeout(expandHeaderTimer);
      root.removeEventListener("click", click);
      root.removeEventListener("transitionend", transitionEnd);
      document.removeEventListener("keydown", keydown);
      motion.removeEventListener("change", updateMotion);
      document.body.style.overflow = "";
    };
  }, [path, page.title]);

  // This is checked-in, reviewed content from the owner's public pages.
  // It never includes user input or third-party scripts.
  return <div id="siteWrapper" ref={container} className="site-wrapper" dangerouslySetInnerHTML={{ __html: header + page.html + footer }} />;
}
