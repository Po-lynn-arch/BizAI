import '../CSS/LandingPage.css'
import { useNavigate } from 'react-router-dom'
// ✅ Memoized with React.memo to prevent unnecessary re-renders if parent ever re-renders
import { memo } from 'react'

// ✅ Split heavy sections into memoized sub-components so they don't re-render on navigate state changes
const FeaturesSection = memo(function FeaturesSection() {
  return (
    <section className="features-section" id="features">
      <div className="section-header">
        <p className="features-label">WHAT WE OFFER</p>
        <h2>Everything your business needs</h2>
        <p className="section-sub">No IT expertise required. No expensive software. Just results.</p>
      </div>
      <div className="features-grid">
        <div className="feature-card">
          <div className="feature-icon-wrap">📦</div>
          <h3>Stock Management</h3>
          <p>Add your products, set how long your stock lasts, and let BizAI automatically track what's left as you sell. Get alerts before you run out.</p>
          <ul className="feature-list">
            <li>✅ Track units remaining</li>
            <li>✅ Colour-coded alerts</li>
            <li>✅ Days of stock remaining</li>
          </ul>
        </div>
        <div className="feature-card">
          <div className="feature-icon-wrap">📝</div>
          <h3>Sales Recording</h3>
          <p>Record every sale in seconds. The system instantly calculates your profit per sale, deducts from stock, and updates your dashboard.</p>
          <ul className="feature-list">
            <li>✅ Real-time profit preview</li>
            <li>✅ Auto stock deduction</li>
            <li>✅ Daily sales summary</li>
          </ul>
        </div>
        <div className="feature-card">
          <div className="feature-icon-wrap">🤖</div>
          <h3>AI Demand Predictions</h3>
          <p>Our machine learning model studies your sales history and predicts which products will sell most next month so you stock up at the right time.</p>
          <ul className="feature-list">
            <li>✅ Random Forest ML model</li>
            <li>✅ Top 3 product forecast</li>
            <li>✅ Accuracy metrics shown</li>
          </ul>
        </div>
        <div className="feature-card">
          <div className="feature-icon-wrap">🧪</div>
          <h3>Business Simulation</h3>
          <p>Ask your AI advisor: "What if I sell Milk at KES 90 instead of KES 80?" Get an instant answer before making any real decision.</p>
          <ul className="feature-list">
            <li>✅ Chat-style interface</li>
            <li>✅ Profit impact analysis</li>
            <li>✅ Revenue comparison</li>
          </ul>
        </div>
        <div className="feature-card">
          <div className="feature-icon-wrap">📄</div>
          <h3>Automated Reports</h3>
          <p>Get daily and weekly reports showing income, stock costs, operational expenses, and net profit — all calculated automatically.</p>
          <ul className="feature-list">
            <li>✅ Daily profit tracking</li>
            <li>✅ Weekly revenue trends</li>
            <li>✅ Income vs expense charts</li>
          </ul>
        </div>
        <div className="feature-card">
          <div className="feature-icon-wrap">🏠</div>
          <h3>Expense Tracking</h3>
          <p>Record rent, transport, electricity and other operational costs. BizAI spreads them correctly so your daily profit is always accurate.</p>
          <ul className="feature-list">
            <li>✅ Daily, weekly, monthly costs</li>
            <li>✅ Smart profit calculation</li>
            <li>✅ Cost breakdown charts</li>
          </ul>
        </div>
      </div>
    </section>
  )
})

export function LandingPage() {
  const navigate = useNavigate()

  return (
    <div className="landing-page">

      {/* NAVBAR */}
      <nav className="navbar">
        <span className="logo">BizAI</span>
        <div className="nav-links">
          <a href="#features">Features</a>
          <a href="#how-it-works">How it Works</a>
          <a href="#about">About</a>
        </div>
        <div className="nav-buttons">
          <button onClick={() => navigate('/login')}>Login</button>
          <button className="btn-primary" onClick={() => navigate('/Register')}>Get Started</button>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className="hero-badge">🇰🇪 Built for Kenyan SMEs</div>
        <h1>Run your business <span className="highlight">smarter.</span></h1>
        <p className="hero-sub">
          BizAI gives small business owners in Kenya the power of AI — track your stock,
          record sales, predict demand, and simulate decisions before spending a shilling.
        </p>
        <div className="hero-buttons">
          <button className="btn-primary hero-cta" onClick={() => navigate('/Register')}>
            Start for Free →
          </button>
          <button className="btn-secondary" onClick={() => navigate('/login')}>
            Login to Dashboard
          </button>
        </div>
        <div className="hero-stats">
          <div className="stat">
            <span className="stat-number">📦</span>
            <span className="stat-label">Stock Tracking</span>
          </div>
          <div className="stat-divider" />
          <div className="stat">
            <span className="stat-number">🤖</span>
            <span className="stat-label">AI Predictions</span>
          </div>
          <div className="stat-divider" />
          <div className="stat">
            <span className="stat-number">📊</span>
            <span className="stat-label">Smart Reports</span>
          </div>
          <div className="stat-divider" />
          <div className="stat">
            <span className="stat-number">🧪</span>
            <span className="stat-label">Simulation</span>
          </div>
        </div>
      </section>

      {/* ✅ Memoized heavy section — won't re-render unless its own props change */}
      <FeaturesSection />

      {/* HOW IT WORKS */}
      <section className="how-section" id="how-it-works">
        <div className="section-header">
          <p className="features-label">HOW IT WORKS</p>
          <h2>Up and running in minutes</h2>
        </div>
        <div className="steps-grid">
          <div className="step">
            <div className="step-number">1</div>
            <h3>Create your account</h3>
            <p>Register your business in under a minute. No credit card required.</p>
          </div>
          <div className="step-arrow">→</div>
          <div className="step">
            <div className="step-number">2</div>
            <h3>Add your stock</h3>
            <p>Tell BizAI what products you sell, how many you bought, and at what cost.</p>
          </div>
          <div className="step-arrow">→</div>
          <div className="step">
            <div className="step-number">3</div>
            <h3>Record your sales</h3>
            <p>Every time you sell, record it in seconds. Stock updates automatically.</p>
          </div>
          <div className="step-arrow">→</div>
          <div className="step">
            <div className="step-number">4</div>
            <h3>Get AI insights</h3>
            <p>BizAI predicts demand, alerts low stock, and shows your real profit daily.</p>
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section className="about-section" id="about">
        <div className="about-content">
          <div className="about-text">
            <p className="features-label">ABOUT BIZAI</p>
            <h2>Built for the Kenyan market</h2>
            <p>
              Most AI business tools are built for large companies in developed countries.
              They are expensive, complicated, and require IT teams to set up.
              BizAI was designed specifically for small and medium businesses in Kenya —
              affordable, simple, and powerful enough to make a real difference.
            </p>
            <p style={{ marginTop: '16px' }}>
              Built by students at <strong>Multimedia University of Kenya</strong> as part
              of a BCT research project focused on making AI accessible to everyday business owners.
            </p>
          </div>
          <div className="about-cards">
            <div className="about-card">
              <span style={{ fontSize: '28px' }}>🎯</span>
              <h4>Purpose Built</h4>
              <p>Designed specifically for Kenyan retail SMEs</p>
            </div>
            <div className="about-card">
              <span style={{ fontSize: '28px' }}>🔒</span>
              <h4>Secure</h4>
              <p>Passwords hashed, data protected per business</p>
            </div>
            <div className="about-card">
              <span style={{ fontSize: '28px' }}>💡</span>
              <h4>Easy to Use</h4>
              <p>No training needed. Start recording in minutes</p>
            </div>
            <div className="about-card">
              <span style={{ fontSize: '28px' }}>📱</span>
              <h4>Accessible</h4>
              <p>Works on any device with a browser</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <h2>Ready to run your business smarter?</h2>
        <p>Join other Kenyan business owners making better decisions with BizAI.</p>
        <button className="btn-primary hero-cta" onClick={() => navigate('/Register')}>
          Create Free Account →
        </button>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-brand">
            <span className="logo">BizAI</span>
            <p>AI-powered business support for Kenyan SMEs</p>
          </div>
          <div className="footer-links">
            <h4>Product</h4>
            <a href="#features">Features</a>
            <a href="#how-it-works">How it Works</a>
            <a href="#about">About</a>
          </div>
          <div className="footer-links">
            <h4>Get Started</h4>
            <span onClick={() => navigate('/Register')} style={{ cursor: 'pointer' }}>Create Account</span>
            <span onClick={() => navigate('/login')} style={{ cursor: 'pointer' }}>Login</span>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© 2025 BizAI · Multimedia University of Kenya · BCT Group 3</p>
        </div>
      </footer>

    </div>
  )
}