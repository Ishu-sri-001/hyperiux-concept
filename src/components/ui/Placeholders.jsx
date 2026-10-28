"use client";

/**
 * Anchor targets for the navigation while the remaining stages are being built.
 * Each one is intentionally bare and clearly marked as upcoming; only verified
 * facts are used (Vault URL, published contact details).
 */
const STAGES = [
  { id: "about", index: "07", title: "About" },
];

export default function Placeholders() {
  return (
    <div className="stubs">
      {STAGES.map((s) => (
        <section key={s.id} id={s.id} data-section={s.id} className="stub" aria-labelledby={`${s.id}-title`}>
          <p className="mono stub-index">{s.index}</p>
          <h2 id={`${s.id}-title`} className="stub-title">
            {s.title}
          </h2>
          <p className="mono stub-note">Stage in development</p>
        </section>
      ))}

      <section id="vault" data-section="vault" className="stub" aria-labelledby="vault-title">
        <p className="mono stub-index">08</p>
        <h2 id="vault-title" className="stub-title">
          Hyperiux Vault
        </h2>
        <p className="mono stub-note">Stage in development</p>
        <a className="text-link" href="https://vault.hyperiux.com/" target="_blank" rel="noopener noreferrer">
          Explore Vault <span aria-hidden="true">↗</span>
        </a>
      </section>

      <section id="contact" data-section="contact" className="stub stub-contact" aria-labelledby="contact-title">
        <p className="mono stub-index">09</p>
        <h2 id="contact-title" className="stub-title">
          Have an idea?
        </h2>
        <a className="text-link" href="mailto:hi@hyperiux.com">
          hi@hyperiux.com
        </a>
        <a className="text-link" href="tel:+918178026136">
          +91 81780 26136
        </a>
      </section>

      <footer className="footer">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/hyperiux-wordmark.svg" alt="Hyperiux" width={110} height={14} />
        <p className="mono">© 2026 Hyperiux Immersion Labs</p>
        <a className="mono" href="https://vault.hyperiux.com/" target="_blank" rel="noopener noreferrer">
          Hyperiux Vault ↗
        </a>
      </footer>
    </div>
  );
}
