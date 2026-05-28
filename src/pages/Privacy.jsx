import { Link } from 'react-router-dom'

export default function Privacy() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@400;500&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        body { background: #0e0e0c; }

        .privacy-page {
          font-family: 'DM Sans', sans-serif;
          background: #0e0e0c;
          color: #f0ede4;
          min-height: 100vh;
        }

        .privacy-nav {
          display: flex;
          align-items: center;
          padding: 1.5rem 4rem;
          border-bottom: 0.5px solid rgba(240,237,228,0.08);
        }

        .privacy-nav-logo {
          font-family: 'Instrument Serif', serif;
          font-size: 22px;
          color: #f0ede4;
          letter-spacing: -0.3px;
          text-decoration: none;
        }

        .privacy-content {
          max-width: 720px;
          margin: 0 auto;
          padding: 4rem 2rem 6rem;
        }

        .privacy-content h1 {
          font-family: 'Instrument Serif', serif;
          font-size: clamp(32px, 5vw, 48px);
          letter-spacing: -0.5px;
          line-height: 1.1;
          color: #f0ede4;
          margin-bottom: 0.5rem;
        }

        .privacy-date {
          font-size: 13px;
          color: rgba(240,237,228,0.35);
          margin-bottom: 3rem;
        }

        .privacy-content h2 {
          font-family: 'DM Sans', sans-serif;
          font-size: 16px;
          font-weight: 500;
          color: #f0ede4;
          margin-top: 2.5rem;
          margin-bottom: 0.75rem;
        }

        .privacy-content p {
          font-size: 15px;
          line-height: 1.75;
          color: rgba(240,237,228,0.6);
          margin-bottom: 1rem;
        }

        .privacy-content ul {
          margin: 0.5rem 0 1rem 1.25rem;
        }

        .privacy-content ul li {
          font-size: 15px;
          line-height: 1.75;
          color: rgba(240,237,228,0.6);
          margin-bottom: 0.25rem;
        }

        .privacy-divider {
          border: none;
          border-top: 0.5px solid rgba(240,237,228,0.08);
          margin: 2rem 0;
        }

        .privacy-footer {
          padding: 2rem 4rem;
          border-top: 0.5px solid rgba(240,237,228,0.06);
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .privacy-footer-logo {
          font-family: 'Instrument Serif', serif;
          font-size: 18px;
          color: rgba(240,237,228,0.4);
        }

        .privacy-footer-note {
          font-size: 13px;
          color: rgba(240,237,228,0.2);
        }

        @media (max-width: 600px) {
          .privacy-nav { padding: 1.25rem 1.5rem; }
          .privacy-footer { padding: 1.5rem; }
        }
      `}</style>

      <div className="privacy-page">
        <nav className="privacy-nav">
          <Link to="/" className="privacy-nav-logo">Finku</Link>
        </nav>

        <div className="privacy-content">
          <h1>Privacy Policy</h1>
          <p className="privacy-date">Last updated: May 28, 2026</p>

          <p>
            Finku ("we", "our", or "us") is committed to protecting your personal information. This Privacy Policy explains what data we collect, how we use it, and your rights in relation to it.
          </p>

          <hr className="privacy-divider" />

          <h2>1. Who we are</h2>
          <p>
            Finku is a personal finance tool designed for freelancers. It helps you track income and expenses and estimate your tax obligations. We are the data controller for the personal data you provide through the app.
          </p>
          <p>
            You can contact us at: <a href="mailto:hello@finku.eu" style={{ color: '#c8f03a', textDecoration: 'none' }}>hello@finku.eu</a>
          </p>

          <h2>2. Data we collect</h2>
          <p>When you use Finku, we collect and store the following data:</p>
          <ul>
            <li>Your email address (used to create and identify your account)</li>
            <li>Income and expense entries you add manually or via CSV import</li>
            <li>Your preferred language and currency settings</li>
            <li>Date and amount information associated with your transactions</li>
          </ul>
          <p>
            We do not collect payment card information. We do not access your bank accounts directly.
          </p>

          <h2>3. How we use your data</h2>
          <p>We use your data solely to provide the Finku service:</p>
          <ul>
            <li>To display your financial summary and tax estimate</li>
            <li>To authenticate you and maintain your session</li>
            <li>To save your preferences across devices</li>
          </ul>
          <p>
            We do not sell your data, share it with advertisers, or use it for any purpose beyond operating the service.
          </p>

          <h2>4. Data storage and security</h2>
          <p>
            Your data is stored securely using Supabase, a hosted database platform. Data is encrypted in transit using TLS. Access to your data is restricted to your authenticated session only.
          </p>
          <p>
            We retain your data for as long as your account is active. If you delete your account, your data is permanently removed within 30 days.
          </p>

          <h2>5. Third-party services</h2>
          <p>Finku uses the following third-party services to operate:</p>
          <ul>
            <li><strong style={{ color: '#f0ede4', fontWeight: 500 }}>Supabase</strong> — database and authentication</li>
            <li><strong style={{ color: '#f0ede4', fontWeight: 500 }}>Google Fonts</strong> — font delivery (DM Sans, Instrument Serif)</li>
          </ul>
          <p>
            Each service operates under its own privacy policy. We have chosen providers that meet reasonable data protection standards.
          </p>

          <h2>6. Cookies</h2>
          <p>
            Finku uses a single authentication session cookie to keep you logged in. We do not use tracking cookies, analytics cookies, or advertising cookies.
          </p>

          <h2>7. Your rights</h2>
          <p>Under applicable data protection law, you have the right to:</p>
          <ul>
            <li>Access the personal data we hold about you</li>
            <li>Request correction of inaccurate data</li>
            <li>Request deletion of your data and account</li>
            <li>Object to processing or request restriction</li>
          </ul>
          <p>
            To exercise any of these rights, email us at <a href="mailto:hello@finku.eu" style={{ color: '#c8f03a', textDecoration: 'none' }}>hello@finku.eu</a>. We will respond within 30 days.
          </p>

          <h2>8. Tax disclaimer</h2>
          <p>
            Tax estimates provided by Finku are calculated based on the data you enter and publicly available tax rates. They are intended as a planning aid only and do not constitute professional tax advice. Always consult a qualified accountant or tax advisor for your specific situation.
          </p>

          <h2>9. Changes to this policy</h2>
          <p>
            We may update this Privacy Policy from time to time. When we do, we will update the date at the top of this page. Continued use of Finku after changes constitutes acceptance of the updated policy.
          </p>
        </div>

        <footer className="privacy-footer">
          <div className="privacy-footer-logo">Finku</div>
          <div className="privacy-footer-note">Tax estimates are approximate and do not constitute tax advice.</div>
        </footer>
      </div>
    </>
  )
}
