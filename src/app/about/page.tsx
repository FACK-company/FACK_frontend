import styles from "./page.module.css";

export default function AboutPage() {
  return (
    <div className={`page ${styles.pageBg}`}>
      <header className="nav">
        <a className="brand" href="/about">
          Fulbright AntiCheat Knight
        </a>
        <nav className="nav-links" aria-hidden="true"></nav>
        <a className="btn-outline" href="/login">
          Sign in
        </a>
      </header>

      <main>
        <section className="hero">
          <div className="hero-text">
            <h1>
              Where integrity
              <br />
              happens
            </h1>
            <p className="lead">
              We’re building a lightweight anti‑cheat program that screen‑records
              exam sessions and streams them to a separate database in 5‑second
              pieces (we’re still validating if that’s the best approach). The
              goal is to keep recording reliable without overloading students’
              personal laptops while they code.
            </p>
            <p className="sub">
              Exams are submitted on Gradescope, and we want the monitoring
              layer to be as invisible and stable as possible.
            </p>
            <button className="primary-btn">Get in Touch</button>
          </div>

          <div className="hero-grid">
            <div className="photo photo-lg"></div>
            <div className="photo-row">
              <div className="photo photo-sm"></div>
              <div className="photo photo-sm"></div>
            </div>
          </div>
        </section>

        <section className="split">
          <div className="stack">
            <div className="chip"></div>
            <div className="chip"></div>
            <div className="stack-card"></div>
            <div className="chip"></div>
          </div>

          <div className="split-text">
            <div className="kicker">GET TO KNOW US</div>
            <h2>
              Why we make it
              <br />
              happens
            </h2>
            <p>
              Screen recording is heavy. Our design focuses on short, reliable
              uploads and a clean pipeline to protect both student performance
              and exam integrity.
            </p>
            <button className="primary-btn">Get in Touch</button>
          </div>
        </section>

        <section className="why">
          <div className="rule"></div>
          <h3>Why Choose Us</h3>
          <div className="icons">
            <div className="icon-card">
              <div className="icon-circle">
                <span className="icon-dot"></span>
              </div>
              <div className="icon-text">Lightweight</div>
            </div>
            <div className="icon-card">
              <div className="icon-circle">
                <span className="icon-target"></span>
              </div>
              <div className="icon-text">Precise</div>
            </div>
            <div className="icon-card">
              <div className="icon-circle">
                <span className="icon-eye"></span>
              </div>
              <div className="icon-text">Transparent</div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
