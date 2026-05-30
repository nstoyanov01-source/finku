import { Link } from 'react-router-dom'

export default function Terms() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@400;500&display=swap');
        .terms-page { font-family: 'DM Sans', sans-serif; background: #0e0e0c; color: #f0ede4; min-height: 100vh; }
        .terms-nav { display: flex; justify-content: space-between; align-items: center; padding: 1.5rem 4rem; border-bottom: 0.5px solid rgba(240,237,228,0.08); }
        .terms-logo { font-family: 'Instrument Serif', serif; font-size: 22px; color: #f0ede4; text-decoration: none; }
        .terms-content { max-width: 760px; margin: 0 auto; padding: 4rem 2rem 6rem; }
        .terms-title { font-family: 'Instrument Serif', serif; font-size: 42px; letter-spacing: -0.5px; color: #f0ede4; margin-bottom: 0.5rem; }
        .terms-date { font-size: 14px; color: rgba(240,237,228,0.4); margin-bottom: 3rem; }
        .terms-section { margin-bottom: 2.5rem; }
        .terms-h2 { font-size: 17px; font-weight: 500; color: #f0ede4; margin-bottom: 0.75rem; margin-top: 2rem; }
        .terms-h3 { font-size: 15px; font-weight: 500; color: rgba(240,237,228,0.8); margin-bottom: 0.5rem; margin-top: 1.25rem; }
        .terms-p { font-size: 14px; color: rgba(240,237,228,0.55); line-height: 1.75; margin-bottom: 0.75rem; }
        .terms-ul { padding-left: 1.5rem; margin-bottom: 0.75rem; }
        .terms-ul li { font-size: 14px; color: rgba(240,237,228,0.55); line-height: 1.75; margin-bottom: 0.4rem; }
        .terms-toc { background: rgba(240,237,228,0.04); border: 0.5px solid rgba(240,237,228,0.08); border-radius: 12px; padding: 1.5rem; margin-bottom: 3rem; }
        .terms-toc a { display: block; font-size: 13px; color: rgba(240,237,228,0.5); text-decoration: none; padding: 3px 0; transition: color 0.15s; }
        .terms-toc a:hover { color: #c8f03a; }
        .terms-divider { border: none; border-top: 0.5px solid rgba(240,237,228,0.08); margin: 2rem 0; }
        .terms-footer { text-align: center; font-size: 13px; color: rgba(240,237,228,0.2); padding-top: 2rem; border-top: 0.5px solid rgba(240,237,228,0.06); }
        .terms-contact { background: rgba(240,237,228,0.04); border: 0.5px solid rgba(240,237,228,0.08); border-radius: 12px; padding: 1.25rem 1.5rem; margin-top: 1rem; }
        .terms-contact p { font-size: 14px; color: rgba(240,237,228,0.55); margin: 0.2rem 0; }
        .terms-contact a { color: #c8f03a; text-decoration: none; }
        @media (max-width: 600px) { .terms-nav { padding: 1.25rem 1.5rem; } .terms-content { padding: 2rem 1.25rem 4rem; } .terms-title { font-size: 30px; } }
      `}</style>

      <div className="terms-page">
        <nav className="terms-nav">
          <Link to="/" className="terms-logo">Finku</Link>
          <Link to="/" style={{ fontSize: 14, color: 'rgba(240,237,228,0.5)', textDecoration: 'none' }}>← Back</Link>
        </nav>

        <div className="terms-content">
          <h1 className="terms-title">Terms and Conditions</h1>
          <p className="terms-date">Last updated May 30, 2026</p>

          <div className="terms-toc">
            {[
              ['#agreement', '1. Agreement to Legal Terms'],
              ['#services', '2. Our Services'],
              ['#ip', '3. Intellectual Property Rights'],
              ['#userreps', '4. User Representations'],
              ['#userreg', '5. User Registration'],
              ['#purchases', '6. Purchases and Payment'],
              ['#prohibited', '7. Prohibited Activities'],
              ['#ugc', '8. User Generated Contributions'],
              ['#license', '9. Contribution License'],
              ['#sitemanage', '10. Services Management'],
              ['#ppyes', '11. Privacy Policy'],
              ['#terms', '12. Term and Termination'],
              ['#modifications', '13. Modifications and Interruptions'],
              ['#law', '14. Governing Law'],
              ['#disputes', '15. Dispute Resolution'],
              ['#corrections', '16. Corrections'],
              ['#disclaimer', '17. Disclaimer'],
              ['#liability', '18. Limitations of Liability'],
              ['#indemnification', '19. Indemnification'],
              ['#userdata', '20. User Data'],
              ['#electronic', '21. Electronic Communications'],
              ['#misc', '22. Miscellaneous'],
              ['#contact', '23. Contact Us'],
            ].map(([href, label]) => (
              <a key={href} href={href}>{label}</a>
            ))}
          </div>

          <div id="agreement" className="terms-section">
            <h2 className="terms-h2">Agreement to Our Legal Terms</h2>
            <p className="terms-p">We are Nikola Stoyanov, doing business as Finku, a company registered in Bulgaria at Sava Radulov 3, Varna 9002.</p>
            <p className="terms-p">We operate the website finku.eu as well as any other related products and services that refer or link to these legal terms (collectively, the "Services").</p>
            <p className="terms-p">Finku is a financial tracking web application for freelancers and self-employed individuals. It allows users to log income and expenses, view a live tax estimate based on their earnings, and understand their approximate tax obligations throughout the year.</p>
            <p className="terms-p">You can contact us by phone at +359886559511, email at <a href="mailto:privacy@finku.eu" style={{ color: '#c8f03a' }}>privacy@finku.eu</a>, or by mail to Sava Radulov 3, Varna 9002, Bulgaria.</p>
            <p className="terms-p">These Legal Terms constitute a legally binding agreement between you and Nikola Stoyanov concerning your access to and use of the Services. By accessing the Services, you confirm you have read, understood, and agreed to be bound by all of these Legal Terms. IF YOU DO NOT AGREE, YOU MUST DISCONTINUE USE IMMEDIATELY.</p>
            <p className="terms-p">We will provide prior notice of any scheduled changes. Changes become effective 30 days after notice, except security updates and court orders which are effective immediately. The Services are intended for users who are at least 18 years old.</p>
          </div>

          <hr className="terms-divider" />

          <div id="services" className="terms-section">
            <h2 className="terms-h2">1. Our Services</h2>
            <p className="terms-p">The information provided when using the Services is not intended for distribution to any person or entity where such use would be contrary to law or regulation. Those who access the Services from other locations do so on their own initiative and are solely responsible for compliance with local laws.</p>
          </div>

          <div id="ip" className="terms-section">
            <h2 className="terms-h2">2. Intellectual Property Rights</h2>
            <h3 className="terms-h3">Our intellectual property</h3>
            <p className="terms-p">We are the owner or licensee of all intellectual property rights in our Services, including all source code, databases, functionality, software, website designs, text, and graphics, as well as the trademarks, service marks, and logos contained therein.</p>
            <p className="terms-p">Subject to your compliance with these Legal Terms, we grant you a non-exclusive, non-transferable, revocable license to access the Services solely for your personal, non-commercial use or internal business purpose.</p>
            <h3 className="terms-h3">Your submissions</h3>
            <p className="terms-p">By sending us any feedback or suggestions about the Services, you agree to assign to us all intellectual property rights in such submission. You are solely responsible for your submissions and expressly agree to reimburse us for any losses caused by your breach of these terms.</p>
          </div>

          <div id="userreps" className="terms-section">
            <h2 className="terms-h2">3. User Representations</h2>
            <p className="terms-p">By using the Services, you represent and warrant that: (1) all registration information you submit is true and accurate; (2) you will maintain the accuracy of such information; (3) you have the legal capacity to agree to these Legal Terms; (4) you are not a minor in your jurisdiction; (5) you will not access the Services through automated or non-human means; (6) you will not use the Services for any illegal purpose; and (7) your use will not violate any applicable law or regulation.</p>
          </div>

          <div id="userreg" className="terms-section">
            <h2 className="terms-h2">4. User Registration</h2>
            <p className="terms-p">You may be required to register to use the Services. You agree to keep your password confidential and will be responsible for all use of your account. We reserve the right to remove or change a username we determine is inappropriate or objectionable.</p>
          </div>

          <div id="purchases" className="terms-section">
            <h2 className="terms-h2">5. Purchases and Payment</h2>
            <p className="terms-p">All purchases are non-refundable. We accept payment via Stripe. You agree to provide current, complete, and accurate purchase and account information for all purchases. We may change prices at any time. All payments shall be in Euros (€).</p>
          </div>

          <div id="prohibited" className="terms-section">
            <h2 className="terms-h2">6. Prohibited Activities</h2>
            <p className="terms-p">You may not use the Services for any purpose other than that for which we make them available. As a user, you agree not to:</p>
            <ul className="terms-ul">
              <li>Systematically retrieve data to create a database or directory without written permission</li>
              <li>Trick, defraud, or mislead us or other users</li>
              <li>Circumvent or interfere with security-related features</li>
              <li>Use the Services in a manner inconsistent with applicable laws</li>
              <li>Upload or transmit viruses or other malicious material</li>
              <li>Engage in automated use of the system, including bots or scrapers</li>
              <li>Attempt to impersonate another user or person</li>
              <li>Use the Services to compete with us or for any commercial enterprise</li>
              <li>Harass, annoy, or threaten our employees or agents</li>
            </ul>
          </div>

          <div id="ugc" className="terms-section">
            <h2 className="terms-h2">7. User Generated Contributions</h2>
            <p className="terms-p">The Services do not offer users the ability to submit or post public content. Users may submit financial data (income and expense entries) solely for their own personal use within the Services.</p>
          </div>

          <div id="license" className="terms-section">
            <h2 className="terms-h2">8. Contribution License</h2>
            <p className="terms-p">You and Finku agree that we may access, store, process, and use any information and personal data that you provide, following the terms of the Privacy Policy and your choices. By submitting suggestions or other feedback, you agree that we can use such feedback for any purpose without compensation to you.</p>
          </div>

          <div id="sitemanage" className="terms-section">
            <h2 className="terms-h2">9. Services Management</h2>
            <p className="terms-p">We reserve the right, but not the obligation, to: (1) monitor the Services for violations; (2) take appropriate legal action against anyone who violates these Legal Terms; (3) refuse, restrict, or limit access to any portion of the Services; and (4) otherwise manage the Services to protect our rights and property.</p>
          </div>

          <div id="ppyes" className="terms-section">
            <h2 className="terms-h2">10. Privacy Policy</h2>
            <p className="terms-p">We care about data privacy and security. Please review our Privacy Policy at <a href="/privacy" style={{ color: '#c8f03a' }}>finku.eu/privacy</a>. By using the Services, you agree to be bound by our Privacy Policy, which is incorporated into these Legal Terms.</p>
          </div>

          <div id="terms" className="terms-section">
            <h2 className="terms-h2">11. Term and Termination</h2>
            <p className="terms-p">These Legal Terms shall remain in full force and effect while you use the Services. We reserve the right to deny access, terminate your account, or remove any content at any time, without warning, at our sole discretion.</p>
            <p className="terms-p">If we terminate your account for any reason, you are prohibited from registering a new account under any name without our consent.</p>
          </div>

          <div id="modifications" className="terms-section">
            <h2 className="terms-h2">12. Modifications and Interruptions</h2>
            <p className="terms-p">We reserve the right to change, modify, or remove the contents of the Services at any time without notice. We cannot guarantee the Services will be available at all times. We will not be liable for any loss or inconvenience caused by downtime or discontinuance of the Services.</p>
          </div>

          <div id="law" className="terms-section">
            <h2 className="terms-h2">13. Governing Law</h2>
            <p className="terms-p">These Legal Terms are governed by and interpreted following the laws of Bulgaria. If your habitual residence is in the EU and you are a consumer, you additionally possess the protection provided by obligatory provisions of the law in your country of residence. Both parties agree to submit to the non-exclusive jurisdiction of the courts of Sofia, Bulgaria.</p>
          </div>

          <div id="disputes" className="terms-section">
            <h2 className="terms-h2">14. Dispute Resolution</h2>
            <p className="terms-p">The European Commission provides information on consumer redress, including a list of dispute resolution bodies by country. If you would like to bring a dispute to our attention, please contact us directly first.</p>
          </div>

          <div id="corrections" className="terms-section">
            <h2 className="terms-h2">15. Corrections</h2>
            <p className="terms-p">There may be information on the Services that contains typographical errors, inaccuracies, or omissions. We reserve the right to correct any errors and to change or update information at any time, without prior notice.</p>
          </div>

          <div id="disclaimer" className="terms-section">
            <h2 className="terms-h2">16. Disclaimer</h2>
            <p className="terms-p">THE SERVICES ARE PROVIDED ON AN AS-IS AND AS-AVAILABLE BASIS. TO THE FULLEST EXTENT PERMITTED BY LAW, WE DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED. WE MAKE NO WARRANTIES ABOUT THE ACCURACY OR COMPLETENESS OF THE SERVICES' CONTENT. TAX ESTIMATES PROVIDED ARE APPROXIMATE AND DO NOT CONSTITUTE TAX ADVICE.</p>
          </div>

          <div id="liability" className="terms-section">
            <h2 className="terms-h2">17. Limitations of Liability</h2>
            <p className="terms-p">IN NO EVENT WILL WE BE LIABLE FOR ANY DIRECT, INDIRECT, CONSEQUENTIAL, INCIDENTAL, OR PUNITIVE DAMAGES ARISING FROM YOUR USE OF THE SERVICES. OUR LIABILITY TO YOU FOR ANY CAUSE WHATSOEVER WILL AT ALL TIMES BE LIMITED TO THE AMOUNT PAID, IF ANY, BY YOU TO US DURING THE SIX (6) MONTH PERIOD PRIOR TO ANY CAUSE OF ACTION ARISING.</p>
          </div>

          <div id="indemnification" className="terms-section">
            <h2 className="terms-h2">18. Indemnification</h2>
            <p className="terms-p">You agree to defend, indemnify, and hold us harmless from any loss, damage, liability, or claim arising from: (1) your use of the Services; (2) breach of these Legal Terms; (3) any breach of your representations and warranties; (4) your violation of any third party's rights; or (5) any harmful act toward another user.</p>
          </div>

          <div id="userdata" className="terms-section">
            <h2 className="terms-h2">19. User Data</h2>
            <p className="terms-p">We will maintain certain data that you transmit to the Services for the purpose of managing performance. Although we perform regular backups, you are solely responsible for all data you transmit. We shall have no liability for any loss or corruption of such data.</p>
          </div>

          <div id="electronic" className="terms-section">
            <h2 className="terms-h2">20. Electronic Communications, Transactions, and Signatures</h2>
            <p className="terms-p">Visiting the Services, sending us emails, and completing online forms constitute electronic communications. You consent to receive electronic communications and agree that all agreements, notices, and other communications we provide electronically satisfy any legal requirement that such communication be in writing.</p>
          </div>

          <div id="misc" className="terms-section">
            <h2 className="terms-h2">21. Miscellaneous</h2>
            <p className="terms-p">These Legal Terms constitute the entire agreement between you and us. Our failure to exercise any right or provision shall not operate as a waiver. If any provision is determined to be unlawful or unenforceable, that provision is deemed severable and does not affect any remaining provisions. There is no joint venture, partnership, or agency relationship created between you and us.</p>
          </div>

          <div id="contact" className="terms-section">
            <h2 className="terms-h2">22. Contact Us</h2>
            <p className="terms-p">To resolve a complaint or receive further information, please contact us:</p>
            <div className="terms-contact">
              <p><strong>Nikola Stoyanov (Finku)</strong></p>
              <p>Sava Radulov 3, Varna 9002, Bulgaria</p>
              <p>Phone: +359886559511</p>
              <p>Email: <a href="mailto:privacy@finku.eu">privacy@finku.eu</a></p>
              <p>Website: <a href="https://finku.eu">finku.eu</a></p>
            </div>
          </div>

          <p className="terms-footer">
            These Terms and Conditions were generated with assistance from Termly.
          </p>
        </div>
      </div>
    </>
  )
}
