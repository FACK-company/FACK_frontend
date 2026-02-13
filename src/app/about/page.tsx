import styles from "./page.module.css";

export default function AboutPage() {
  return (
    <div className={`page ${styles.pageBg}`}>
      <header className="nav">
        <a className={`brand ${styles.brandWithLogo}`} href="/about">
          <img className={styles.brandLogo} src="/img/logo.png" alt="FACK logo" />
          <span>Fulbright AntiCheat Knight</span>
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
              Fulbright AntiCheat Knight is a web-based proctoring platform
              designed to strengthen exam integrity while keeping the student
              experience stable and lightweight. During an exam session, the
              system captures screen activity and uploads recording data in
              short intervals to support reliable evidence collection.
            </p>
            <p className="sub">
              The exam PDF is integrated directly in the exam workspace, so
              students can review prompts and submit work in one controlled
              flow. This reduces context-switching and gives instructors a
              clear, auditable timeline of exam behavior.
            </p>
            <a className="primary-btn" href="/login">
              Get in Touch
            </a>
          </div>

          <div className="hero-grid">
            <div className={`photo photo-lg ${styles.whoamiPhotoLg}`}></div>
            <div className="photo-row">
              <div className={`photo photo-sm ${styles.whoamiPhotoSmLeft}`}></div>
              <div className={`photo photo-sm ${styles.whoamiPhotoSmRight}`}></div>
            </div>
          </div>
        </section>

        <section className="split">
          <div className="stack">
            <div className={`chip ${styles.logoChip}`}></div>
            <div className={`chip ${styles.logoChip}`}></div>
            <div className={`stack-card ${styles.logoStackCard}`}></div>
            <div className={`chip ${styles.logoChip}`}></div>
          </div>

          <div className="split-text">
            <div className="kicker">OUR APPROACH</div>
            <h2>
              Reliable monitoring
              <br />
              without heavy overhead
            </h2>
            <p>
              The architecture focuses on practical performance: lightweight
              browser capture, resilient upload behavior, and structured
              metadata for review. Instructors receive verifiable recording
              evidence, while students keep a smooth testing environment.
            </p>
            <a className="primary-btn" href="/login">
              Get in Touch
            </a>
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
              <div className="icon-text">Efficient</div>
            </div>
            <div className="icon-card">
              <div className="icon-circle">
                <span className="icon-target"></span>
              </div>
              <div className="icon-text">Auditable</div>
            </div>
            <div className="icon-card">
              <div className="icon-circle">
                <span className="icon-eye"></span>
              </div>
              <div className="icon-text">Secure</div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
