"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import Nav from "./ui/Nav";
import Hero from "./ui/Hero";
import Loader from "./ui/Loader";
import ScrollProgress from "./ui/ScrollProgress";
import Placeholders from "./ui/Placeholders";
import Services from "./ui/Services";
import Work from "./ui/Work";
import { PROJECTS } from "@/content/projects";
import { store, on, now, INTERACTIVE, SHARD_HOVER } from "@/lib/store";
import { detectDevice } from "@/lib/device";

// The WebGL scene is client-only and code-split so the HTML is usable immediately.
const SceneMount = dynamic(() => import("./three/SceneMount"), { ssr: false });

export const SECTIONS = [
  { id: "work", label: "Work", index: "05", name: "Work" },
  { id: "services", label: "Services", index: "04", name: "Services" },
  { id: "vault", label: "Vault", index: "08", name: "Vault" },
  { id: "about", label: "About", index: "07", name: "About" },
  { id: "contact", label: "Contact", index: "09", name: "Contact" },
];

export default function Experience() {
  const rootRef = useRef(null);
  const lenisRef = useRef(null);
  const introRef = useRef(null);
  const [device, setDevice] = useState(null);
  const [active, setActive] = useState(null);
  const [sceneFailed, setSceneFailed] = useState(false);
  const [serviceFocus, setServiceFocus] = useState(-1);
  useEffect(() => {
    store.serviceFocus = serviceFocus;
  }, [serviceFocus]);

  // Work gallery state: the project in view, the one opened, the one hovered in 3D.
  const [workIndex, setWorkIndex] = useState(0);
  const [workOpen, setWorkOpen] = useState(-1);
  const [workHover, setWorkHover] = useState(-1);
  useEffect(() => {
    store.workOpen = workOpen;
  }, [workOpen]);
  useEffect(() => on("work:hover", setWorkHover), []);
  useEffect(() => on("work:open", setWorkOpen), []);

  // ---- Device capabilities (client only) --------------------------------
  useEffect(() => {
    window.__hxBooted = true;
    const d = detectDevice();
    store.reducedMotion = d.reducedMotion;
    store.tier = d.tier;
    store.mobile = d.mobile;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDevice(d);
  }, []);

  // ---- Smooth scroll + ScrollTrigger ------------------------------------
  useEffect(() => {
    if (!device) return;
    gsap.registerPlugin(ScrollTrigger);

    let lenis = null;
    let tick = null;
    if (!device.reducedMotion) {
      lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
      lenisRef.current = lenis;
      lenis.on("scroll", ScrollTrigger.update);
      tick = (time) => lenis.raf(time * 1000);
      gsap.ticker.add(tick);
      gsap.ticker.lagSmoothing(0);
    }

    const ctx = gsap.context(() => {
      // Hero exit: one progress value drives the 3D scene, a scrubbed timeline drives the copy.
      const root = document.documentElement;
      root.classList.add("is-hero-top");
      ScrollTrigger.create({
        trigger: ".hero-track",
        start: "top top",
        end: "bottom bottom",
        onUpdate: (self) => {
          store.hero = self.progress;
          // At rest in the hero only the wordmark shows; the rest of the UI arrives with the scroll.
          root.classList.toggle("is-hero-top", self.progress < 0.02);
        },
      });
      if (document.querySelector(".hero-copy")) {
        gsap
          .timeline({
            scrollTrigger: { trigger: ".hero-track", start: "top top", end: "bottom bottom", scrub: 0.6 },
          })
          .to(".hero-copy", { y: -90, autoAlpha: 0, filter: "blur(10px)", ease: "power2.in", duration: 0.45 }, 0)
          .to(".hero-meta, .hero-hint", { autoAlpha: 0, y: 24, ease: "power1.in", duration: 0.3 }, 0)
          .to(".scroll-cue", { autoAlpha: 0, duration: 0.15 }, 0)
          .to({}, { duration: 0.55 });
      }

      // Services: the burst pieces settle into four formations as the section arrives.
      ScrollTrigger.create({
        trigger: ".services-track",
        start: "top bottom",
        end: "top top",
        onUpdate: (self) => (store.services = self.progress),
      });
      ScrollTrigger.create({
        trigger: ".services-track",
        start: "top top",
        end: "bottom bottom",
        onLeave: () => setServiceFocus(-1),
        onLeaveBack: () => setServiceFocus(-1),
      });
      if (document.querySelector(".services [data-svc-reveal]")) gsap.fromTo(
        ".services [data-svc-reveal]",
        { autoAlpha: 0, y: 28 },
        {
          autoAlpha: 1,
          y: 0,
          stagger: 0.12,
          ease: "power2.out",
          scrollTrigger: { trigger: ".services-track", start: "top 45%", end: "top top", scrub: 0.6 },
        }
      );

      // Work: shards become frames as the section arrives, then the camera travels the gallery.
      const n = PROJECTS.length;
      ScrollTrigger.create({
        trigger: ".work-track",
        start: "top bottom",
        end: "top top",
        onUpdate: (self) => (store.workIn = self.progress),
      });
      ScrollTrigger.create({
        trigger: ".work-track",
        start: "top top",
        end: "bottom bottom",
        onUpdate: (self) => {
          store.work = self.progress;
          setWorkIndex(Math.round(self.progress * (n - 1)));
        },
        onLeave: () => setWorkOpen(-1),
        onLeaveBack: () => setWorkOpen(-1),
      });
      if (document.querySelector(".work [data-work-reveal]")) gsap.fromTo(
        ".work [data-work-reveal]",
        { autoAlpha: 0, y: 24 },
        {
          autoAlpha: 1,
          y: 0,
          stagger: 0.1,
          ease: "power2.out",
          scrollTrigger: { trigger: ".work-track", start: "top 35%", end: "top top", scrub: 0.6 },
        }
      );

      // Active navigation state.
      document.querySelectorAll("[data-section]").forEach((el) => {
        ScrollTrigger.create({
          trigger: el,
          start: "top 55%",
          end: "bottom 55%",
          onToggle: (self) => {
            if (self.isActive) setActive(el.dataset.section === "hero" ? null : el.id);
          },
        });
      });
    }, rootRef);

    return () => {
      ctx.revert();
      if (tick) gsap.ticker.remove(tick);
      lenis?.destroy();
      lenisRef.current = null;
    };
  }, [device]);

  // ---- Pointer → shared state (works for mouse, pen and touch) ----------
  useEffect(() => {
    if (!INTERACTIVE && !SHARD_HOVER) return;
    let last = null;
    const move = (e) => {
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = -((e.clientY / window.innerHeight) * 2 - 1);
      const t = now();
      if (last) {
        const v = Math.hypot(x - last.x, y - last.y) / Math.max(t - last.t, 1 / 120);
        store.pointer.speed = Math.max(store.pointer.speed, Math.min(v, 8));
      }
      last = { x, y, t };
      store.pointer.x = x;
      store.pointer.y = y;
      store.pointer.active = true;
      store.pointer.lastMove = t;
    };
    const leave = () => {
      store.pointer.active = false;
      last = null;
    };
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerdown", move, { passive: true });
    document.documentElement.addEventListener("pointerleave", leave);
    window.addEventListener("blur", leave);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerdown", move);
      document.documentElement.removeEventListener("pointerleave", leave);
      window.removeEventListener("blur", leave);
    };
  }, []);

  // ---- Genesis intro → hero reveal ---------------------------------------
  const revealUI = useCallback((instant = false) => {
    const root = document.documentElement;
    const has = (sel) => document.querySelector(sel);
    const tl = gsap.timeline({ onComplete: () => root.classList.remove("js-intro") });
    if (instant) {
      if (has(".line-inner")) tl.set(".line-inner", { y: 0, yPercent: 0 });
      tl.set("[data-reveal]", { autoAlpha: 1, y: 0 });
      return;
    }
    tl.fromTo(
      ".nav [data-reveal]",
      { autoAlpha: 0, y: -10 },
      { autoAlpha: 1, y: 0, duration: 1.1, stagger: 0.06, ease: "power3.out" },
      0
    );
    if (has(".line-inner")) {
      tl.fromTo(".line-inner", { y: 0, yPercent: 110 }, { y: 0, yPercent: 0, duration: 1.5, stagger: 0.12, ease: "expo.out" }, 0.1);
    }
    if (has(".hero [data-reveal]")) {
      tl.fromTo(
        ".hero [data-reveal]",
        { autoAlpha: 0, y: 16 },
        { autoAlpha: 1, y: 0, duration: 1.2, stagger: 0.08, ease: "power3.out" },
        0.45
      );
    }
    tl.fromTo(".scroll-progress", { autoAlpha: 0 }, { autoAlpha: 1, duration: 1 }, 0.8);
  }, []);

  useEffect(() => {
    if (!device) return;

    const skipIntro = () => {
      store.genesis = 1;
      revealUI(true);
    };

    if (!device.webgl) {
      skipIntro();
      return;
    }

    let started = false;
    const start = () => {
      if (started) return;
      started = true;
      if (device.reducedMotion) {
        // Short, calm version: the H is simply there.
        gsap.to(store, { genesis: 1, duration: 0.01 });
        revealUI();
        return;
      }
      const tl = gsap.timeline();
      tl.to(store, { genesis: 1, duration: 5.8, ease: "none" }, 0).add(() => revealUI(), 4.6);
      introRef.current = tl;
    };

    const off = on("ready", start);
    if (store.ready) start();

    // If the scene takes too long, don't hold the page hostage.
    const failsafe = setTimeout(() => {
      if (!started) {
        started = true;
        skipIntro();
      }
    }, 9000);

    // Any intent to move on speeds the intro up rather than blocking it.
    const hurry = () => introRef.current?.isActive() && introRef.current.timeScale(3.5);
    window.addEventListener("wheel", hurry, { passive: true });
    window.addEventListener("touchmove", hurry, { passive: true });
    window.addEventListener("keydown", hurry);

    return () => {
      off();
      clearTimeout(failsafe);
      introRef.current?.kill();
      window.removeEventListener("wheel", hurry);
      window.removeEventListener("touchmove", hurry);
      window.removeEventListener("keydown", hurry);
    };
  }, [device, revealUI]);

  // ---- Navigation --------------------------------------------------------
  const scrollToId = useCallback((id, push = true) => {
    const el = id === "top" ? document.body : document.getElementById(id);
    if (!el) return;
    const lenis = lenisRef.current;
    if (lenis) lenis.scrollTo(id === "top" ? 0 : el, { duration: 1.8, easing: (t) => 1 - Math.pow(1 - t, 4) });
    else window.scrollTo({ top: id === "top" ? 0 : el.getBoundingClientRect().top + window.scrollY });
    if (push) history.pushState(null, "", id === "top" ? location.pathname : `#${id}`);
  }, []);

  // Move the gallery to project i by scrolling to its point on the Work track.
  const goToProject = useCallback((i) => {
    const track = document.querySelector(".work-track");
    if (!track) return;
    const n = PROJECTS.length;
    const top = track.getBoundingClientRect().top + window.scrollY;
    const range = track.offsetHeight - window.innerHeight;
    const y = top + (n > 1 ? i / (n - 1) : 0) * range + 1;
    const lenis = lenisRef.current;
    if (lenis) lenis.scrollTo(y, { duration: 1.4, easing: (t) => 1 - Math.pow(1 - t, 3) });
    else window.scrollTo({ top: y });
  }, []);

  useEffect(() => {
    if (active !== "work") return;
    const onKey = (e) => {
      if (e.target.closest?.("input, textarea, select")) return;
      if (e.key === "ArrowRight") goToProject(Math.min(PROJECTS.length - 1, workIndex + 1));
      if (e.key === "ArrowLeft") goToProject(Math.max(0, workIndex - 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, workIndex, goToProject]);

  useEffect(() => {
    const onPop = () => scrollToId(location.hash.slice(1) || "top", false);
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [scrollToId]);

  return (
    <div ref={rootRef} className="experience">
      <div className="stage" aria-hidden="true">
        {device?.webgl && !sceneFailed && (
          <SceneMount tier={device.tier} eventSource={rootRef} onError={() => setSceneFailed(true)} />
        )}
        <div className="stage-grain" />
      </div>

      {device && (!device.webgl || sceneFailed) && <div className="stage-fallback" aria-hidden="true" />}

      <Loader hidden={!!device && (!device.webgl || sceneFailed)} />
      <Nav sections={SECTIONS} active={active} onNavigate={scrollToId} />
      <ScrollProgress sections={SECTIONS} active={active} />

      <main>
        <Hero onNavigate={scrollToId} />
        <Services focus={serviceFocus} setFocus={setServiceFocus} />
        <Work index={workIndex} open={workOpen} setOpen={setWorkOpen} hover={workHover} onGo={goToProject} />
        <Placeholders />
      </main>
    </div>
  );
}
