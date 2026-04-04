import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="leash-landing">
      {/* ── Ambient background ── */}
      <div className="leash-ambient" aria-hidden="true" />

      {/* ══════════════════════════════════════════
          HEADER
      ══════════════════════════════════════════ */}
      <header className="leash-header">
        <div className="leash-header-inner">
          {/* Logo */}
          <div className="leash-logo-wrap">
            <span className="leash-logo">LEASH</span>
            <span className="leash-logo-tag">UI for OpenWallet Standard</span>
          </div>

          {/* Nav */}
          <nav className="leash-nav">
            <a href="#install" className="leash-nav-link">Install</a>
            <a href="#architecture" className="leash-nav-link">Architecture</a>
            <a href="#features" className="leash-nav-link">Features</a>
            <a
              href="https://openwallet.sh"
              target="_blank"
              rel="noopener noreferrer"
              className="leash-nav-link leash-nav-external"
            >
              OWS Docs ↗
            </a>
            <Link href="/dashboard" className="leash-btn-sm">
              Open Dashboard →
            </Link>
          </nav>
        </div>
      </header>

      {/* ══════════════════════════════════════════
          HERO
      ══════════════════════════════════════════ */}
      <section className="leash-hero">
        <div className="leash-hero-inner">
          <div className="leash-badge">
            <span className="leash-badge-dot" />
            Open Wallet Standard · v1.0.0
          </div>
          <h1 className="leash-hero-title">
            The visual dashboard
            <br />
            <span className="leash-hero-accent">for OpenWallet Standard.</span>
          </h1>
          <p className="leash-hero-sub">
            Leash gives your OWS installation a face. Register agents, set
            per-agent budgets, restrict chains and vendors — all from a clean
            local UI. Keys never leave <code className="leash-inline-code">~/.ows/</code>.
          </p>

          {/* Install command */}
          <div className="leash-install-block">
            <div className="leash-install-label">Install Leash</div>
            <div className="leash-install-cmd">
              <code>npx @open-wallet-standard/leash</code>
              <button
                className="leash-copy-btn"
                onClick={undefined}
                aria-label="Copy install command"
                data-cmd="npx @open-wallet-standard/leash"
              >
                Copy
              </button>
            </div>
            <p className="leash-install-note">
              Installs OWS core + Leash UI. Opens on{" "}
              <code className="leash-inline-code">localhost:3847</code>.
              No cloud. No telemetry.
            </p>
          </div>

          {/* Agent install CTA */}
          <div className="leash-agent-pill">
            <span className="leash-agent-pill-icon">🤖</span>
            <span>
              Using an agent? Point it at this page and say:{" "}
              <em>&ldquo;Install Leash and set up OWS for me.&rdquo;</em>
            </span>
          </div>
        </div>

        {/* Dashboard mockup */}
        <div className="leash-mockup-wrap">
          <div className="leash-mockup-chrome">
            <div className="leash-mockup-bar">
              <span className="leash-dot leash-dot-red" />
              <span className="leash-dot leash-dot-yellow" />
              <span className="leash-dot leash-dot-green" />
              <span className="leash-mockup-url">localhost:3847</span>
            </div>
            {/* Inline mini-dashboard preview */}
            <div className="leash-mockup-content">
              {/* header bar */}
              <div className="lm-header">
                <span className="lm-logo">LEASH</span>
                <span className="lm-tagline">Agent Spend Governance Dashboard</span>
                <span className="lm-btn">Register Agent</span>
              </div>
              {/* stats row */}
              <div className="lm-stats">
                {[
                  { label: "Active Agents", value: "4", sub: "6 registered", color: "#a0b4d8" },
                  { label: "Spend Today", value: "$247", sub: "61% of $400 limit", color: "#7c7fff" },
                  { label: "Transactions", value: "38", sub: "across all agents", color: "#a0b4d8" },
                  { label: "Blocked", value: "2", sub: "policy violations", color: "#ff5533" },
                ].map((s) => (
                  <div key={s.label} className="lm-stat">
                    <div className="lm-stat-dot" style={{ background: s.color }} />
                    <div className="lm-stat-label">{s.label}</div>
                    <div className="lm-stat-val" style={{ color: s.color }}>{s.value}</div>
                    <div className="lm-stat-sub">{s.sub}</div>
                  </div>
                ))}
              </div>
              {/* agents list */}
              <div className="lm-agents">
                {[
                  { name: "The Trader", chain: "BASE", budget: "$100", used: 72, status: "active" },
                  { name: "The Lobbyist", chain: "ETH", budget: "$50", used: 20, status: "active" },
                  { name: "The Hacker", chain: "SOL", budget: "$80", used: 55, status: "active" },
                  { name: "Other Claw", chain: "ETH", budget: "$80", used: 0, status: "paused" },
                ].map((a) => (
                  <div key={a.name} className="lm-agent-row">
                    <div className="lm-agent-avatar">{a.name[4]}</div>
                    <div className="lm-agent-name">{a.name}</div>
                    <div className="lm-agent-chain">{a.chain}</div>
                    <div className="lm-agent-bar-wrap">
                      <div className="lm-agent-bar-bg">
                        <div
                          className="lm-agent-bar-fill"
                          style={{ width: `${a.used}%`, background: a.used > 80 ? "#ff5533" : "#7c7fff" }}
                        />
                      </div>
                      <span className="lm-agent-budget">{a.budget}</span>
                    </div>
                    <span
                      className="lm-agent-status"
                      style={{ color: a.status === "active" ? "#4de8a0" : "#7070a0" }}
                    >
                      {a.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <p className="leash-mockup-caption">
            This is what Leash looks like running on your machine at localhost:3847
          </p>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          ARCHITECTURE
      ══════════════════════════════════════════ */}
      <section id="architecture" className="leash-section">
        <div className="leash-section-inner">
          <div className="leash-section-eyebrow">Architecture</div>
          <h2 className="leash-section-title">
            Built on the OWS security model.
          </h2>
          <p className="leash-section-sub">
            Leash is the UI layer on top of OpenWallet Standard. The full OWS
            security model — policy engine, in-memory signing, key wiping —
            is handled by OWS core. Leash just gives you the controls.
          </p>

          {/* Architecture flow */}
          <div className="leash-arch">
            {/* agents column */}
            <div className="leash-arch-col">
              <div className="leash-arch-label">Your Agents</div>
              {["Claude", "OpenAI", "The Trader", "Your Bot"].map((a) => (
                <div key={a} className="leash-arch-pill">{a}</div>
              ))}
            </div>

            {/* arrow */}
            <div className="leash-arch-arrow">
              <div className="leash-arch-arrow-line" />
              <div className="leash-arch-arrow-label">MCP · SDK · CLI · REST</div>
            </div>

            {/* OWS stack */}
            <div className="leash-arch-stack">
              {[
                { label: "OWS Interface", note: "Keys never cross this boundary", highlight: true },
                { label: "Policy Engine", note: "Limits · allowlists · chain rules", highlight: false },
                { label: "Signer", note: "mlock · zeroize · key wiped after use", highlight: false },
                { label: "Wallet Vault", note: "~/.ows/wallets/", highlight: false },
              ].map((layer, i) => (
                <div key={i} className={`leash-arch-layer ${layer.highlight ? "leash-arch-layer-hi" : ""}`}>
                  <div className="leash-arch-layer-label">{layer.label}</div>
                  <div className="leash-arch-layer-note">{layer.note}</div>
                </div>
              ))}
            </div>

            {/* arrow */}
            <div className="leash-arch-arrow">
              <div className="leash-arch-arrow-line" />
              <div className="leash-arch-arrow-label">Signed tx · key wiped</div>
            </div>

            {/* output */}
            <div className="leash-arch-col">
              <div className="leash-arch-label">On-chain</div>
              <div className="leash-arch-pill leash-arch-pill-out">ETH</div>
              <div className="leash-arch-pill leash-arch-pill-out">BASE</div>
              <div className="leash-arch-pill leash-arch-pill-out">SOL</div>
              <div className="leash-arch-pill leash-arch-pill-out">BTC</div>
            </div>
          </div>

          {/* 4-step flow */}
          <div className="leash-steps">
            {[
              {
                n: "01",
                title: "Request",
                body: "Agent calls ows_sign via MCP, REST, or SDK with a chain ID and transaction object.",
              },
              {
                n: "02",
                title: "Policy Check",
                body: "Spending limits, allowlists, chain restrictions, and simulation requirements are evaluated before any key is touched.",
              },
              {
                n: "03",
                title: "Sign",
                body: "Key is decrypted, transaction signed, key immediately wiped. Signed transaction returned to caller.",
              },
              {
                n: "04",
                title: "Submit",
                body: "If RPC URLs are configured, the signed transaction is broadcast on-chain and the transaction hash is returned.",
              },
            ].map((s) => (
              <div key={s.n} className="leash-step">
                <div className="leash-step-n">{s.n}</div>
                <div className="leash-step-title">{s.title}</div>
                <div className="leash-step-body">{s.body}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          INSTALL SECTION
      ══════════════════════════════════════════ */}
      <section id="install" className="leash-section leash-section-dark">
        <div className="leash-section-inner">
          <div className="leash-section-eyebrow leash-eyebrow-green">Get Started</div>
          <h2 className="leash-section-title leash-title-light">
            Up in 30 seconds.
          </h2>
          <p className="leash-section-sub leash-sub-light">
            One command installs OWS core and the Leash UI. No accounts. No cloud.
            Everything runs on your machine.
          </p>

          <div className="leash-install-steps">
            {/* Step 1 */}
            <div className="leash-install-step">
              <div className="leash-install-step-n">1</div>
              <div className="leash-install-step-content">
                <div className="leash-install-step-title">Install Leash</div>
                <div className="leash-install-step-desc">
                  Installs OWS core and the Leash dashboard.
                </div>
                <div className="leash-code-block">
                  <pre><code>{`npx @open-wallet-standard/leash`}</code></pre>
                </div>
                <div className="leash-code-block">
                  <pre><code>{`# Or install globally
npm install -g @open-wallet-standard/leash
leash start`}</code></pre>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="leash-install-step">
              <div className="leash-install-step-n">2</div>
              <div className="leash-install-step-content">
                <div className="leash-install-step-title">Create your first wallet</div>
                <div className="leash-install-step-desc">
                  Leash opens at localhost:3847. Click &ldquo;Register Agent&rdquo; to create an OWS
                  wallet and issue an API key with a spend budget.
                </div>
                <div className="leash-code-block">
                  <pre><code>{`# Or use the OWS CLI directly
ows wallet create --name agent-treasury
ows policy create --wallet agent-treasury \\
  --limit 100 --chains eip155:8453`}</code></pre>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="leash-install-step">
              <div className="leash-install-step-n">3</div>
              <div className="leash-install-step-content">
                <div className="leash-install-step-title">Connect your agents</div>
                <div className="leash-install-step-desc">
                  Pass the API key to your agent. It signs via OWS — no raw
                  keys ever leave the vault.
                </div>
                <div className="leash-code-block">
                  <pre><code>{`// Node.js — @open-wallet-standard/sdk
import { OWSClient } from '@open-wallet-standard/sdk'

const ows = new OWSClient({ apiKey: process.env.OWS_KEY })
const { txHash } = await ows.sign({
  chain: 'eip155:8453',       // Base
  to:    '0xrecipient',
  value: '0.01',
  unit:  'eth'
})`}</code></pre>
                </div>
              </div>
            </div>
          </div>

          {/* Agent install box */}
          <div className="leash-agent-install-box">
            <div className="leash-agent-install-title">
              <span className="leash-agent-install-icon">🤖</span>
              Install via agent
            </div>
            <p className="leash-agent-install-desc">
              If you&apos;re running an AI agent (Claude Code, OpenAI, custom SDK), point it
              at this URL and give it the following prompt:
            </p>
            <div className="leash-code-block leash-code-block-green">
              <pre><code>{`Visit https://leash-zi0u.onrender.com and follow the
install instructions to set up Leash (OpenWallet Standard UI)
on this machine. Run: npx @open-wallet-standard/leash
Then open localhost:3847 and register an agent named
"<your-agent-name>" with a $50 daily budget on Base.`}</code></pre>
            </div>
            <p className="leash-agent-install-note">
              The agent will run the install, start the dashboard, and register
              itself — all without you touching a terminal.
            </p>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          FEATURES
      ══════════════════════════════════════════ */}
      <section id="features" className="leash-section">
        <div className="leash-section-inner">
          <div className="leash-section-eyebrow">Features</div>
          <h2 className="leash-section-title">
            Everything OWS, in one place.
          </h2>
          <p className="leash-section-sub">
            Leash is the visual interface for all six OWS principles. No
            reinventing — just a clean UI over what the standard already
            provides.
          </p>

          <div className="leash-features">
            {[
              {
                n: "01",
                title: "Local-first",
                body: "Your keys live in ~/.ows/ — not in a browser extension, not in the cloud. Leash runs at localhost:3847.",
                tag: "~/.ows/wallets/",
              },
              {
                n: "02",
                title: "No API calls",
                body: "Leash runs entirely on your machine. No HTTP to any vendor. No authentication flows. No rate limits.",
                tag: "Offline capable",
              },
              {
                n: "03",
                title: "Multi-chain",
                body: "One wallet, every chain. BTC, ETH, SOL, ATOM, TON, TRON — manage all from one dashboard.",
                tag: "8 chains",
              },
              {
                n: "04",
                title: "Self-custody",
                body: "Your keys. Your device. No remote signing. No custodians. Leash never uploads anything.",
                tag: "Zero telemetry",
              },
              {
                n: "05",
                title: "Zero-trust",
                body: "Agents authenticate with scoped API tokens. They never see plaintext keys. Leash lets you issue and revoke these.",
                tag: "Per-agent keys",
              },
              {
                n: "06",
                title: "Composable",
                body: "Works with any tool that speaks JSON. Leash adds a UI — the CLI, MCP, SDK, and REST interfaces still work.",
                tag: "MCP · SDK · CLI · REST",
              },
            ].map((f) => (
              <div key={f.n} className="leash-feature-card">
                <div className="leash-feature-n">{f.n}</div>
                <div className="leash-feature-title">{f.title}</div>
                <div className="leash-feature-body">{f.body}</div>
                <div className="leash-feature-tag">{f.tag}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          DASHBOARD PREVIEW (full screenshot)
      ══════════════════════════════════════════ */}
      <section className="leash-section leash-section-preview">
        <div className="leash-section-inner">
          <div className="leash-section-eyebrow">Dashboard Preview</div>
          <h2 className="leash-section-title">
            This is what it looks like on your machine.
          </h2>
          <p className="leash-section-sub">
            A dark, high-signal control panel. See agent spend at a glance,
            drill into individual policies, simulate transactions before they
            happen, and audit every signed event.
          </p>

          <div className="leash-preview-wrap">
            <div className="leash-preview-chrome">
              <div className="leash-preview-bar">
                <span className="leash-dot leash-dot-red" />
                <span className="leash-dot leash-dot-yellow" />
                <span className="leash-dot leash-dot-green" />
                <span className="leash-preview-url">localhost:3847</span>
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/leash-dashboard-preview.png"
                alt="Leash dashboard running locally"
                className="leash-preview-img"
                width={1440}
                height={916}
              />
            </div>
            <div className="leash-preview-actions">
              <Link href="/dashboard" className="leash-btn-primary">
                Preview dashboard demo →
              </Link>
              <a
                href="https://docs.openwallet.sh"
                target="_blank"
                rel="noopener noreferrer"
                className="leash-btn-ghost"
              >
                Read OWS docs ↗
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          FOOTER
      ══════════════════════════════════════════ */}
      <footer className="leash-footer">
        <div className="leash-footer-inner">
          <div className="leash-footer-left">
            <span className="leash-footer-logo">LEASH</span>
            <span className="leash-footer-tagline">
              UI Dashboard for OpenWallet Standard
            </span>
            <span className="leash-footer-note">
              Local-first. Open source. Built for the agent era.
            </span>
          </div>
          <div className="leash-footer-links">
            <a href="https://openwallet.sh" target="_blank" rel="noopener noreferrer">
              openwallet.sh ↗
            </a>
            <a href="https://docs.openwallet.sh" target="_blank" rel="noopener noreferrer">
              OWS Docs ↗
            </a>
            <a href="https://github.com/Socialure" target="_blank" rel="noopener noreferrer">
              GitHub ↗
            </a>
            <Link href="/dashboard">Dashboard</Link>
          </div>
        </div>
        <div className="leash-footer-bottom">
          Built on{" "}
          <a href="https://openwallet.sh" target="_blank" rel="noopener noreferrer">
            Open Wallet Standard v1.0.0
          </a>
          {" "}· Open source · No telemetry · Keys never leave your machine
        </div>
      </footer>
    </div>
  );
}
