"use client";
import Link from "next/link";
import { CopyButton } from "./components/CopyButton";
import { useEffect, useState, useRef } from "react";

const ROTATING_WORDS = ["cool", "dope", "clean", "sharp", "slick"];

function RotatingWord() {
  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIdx((i) => (i + 1) % ROTATING_WORDS.length);
        setVisible(true);
      }, 200);
    }, 2200);
    return () => clearInterval(interval);
  }, []);

  return (
    <span
      className="leash-rotating-word"
      style={{ opacity: visible ? 1 : 0, transition: "opacity 0.2s ease" }}
    >
      {ROTATING_WORDS[idx]}
    </span>
  );
}

const AGENT_PROMPT = `You are about to set up and use LEASH — the local dashboard for Open Wallet Standard (OWS). Follow every step in order.

STEP 1 — Check if LEASH is already running:
Try fetching http://localhost:3847/api/agents. If you get a valid JSON response, skip to STEP 3.

STEP 2 — Install and start LEASH (only if Step 1 failed):
Run these commands in your terminal:
  git clone https://github.com/Socialure/leash
  cd leash/app
  npm install
  npm run dev
Wait until you see "Ready on http://localhost:3847". Then confirm with: curl http://localhost:3847/api/agents

STEP 3 — Register yourself as an agent:
POST to http://localhost:3847/api/agents with JSON body:
  { "name": "<your agent name>", "role": "<your role>", "spendLimit": 100, "chains": ["eip155:8453"] }
Save the "apiKey" field from the response — this is your OWS signing key.

STEP 4 — Use your wallet:
To sign a transaction, POST to http://localhost:3847/api/simulate:
  { "agentId": "<your agent id>", "chain": "eip155:8453", "amount": 10, "action": "swap" }
LEASH will approve or deny based on your spend policy. Raw keys never leave the vault.

STEP 5 — Report back:
Confirm: your agent name, wallet ID, spend limit, allowed chains, and API key (first 8 chars only). If any step failed, report the exact error message.`.trim();

const INSTALL_CMD = `git clone https://github.com/Socialure/leash
cd leash/app
npm install
npm run dev`;

const INSTALL_CMD_GLOBAL = `# Then open localhost:3847 in your browser`;

export default function LandingPage() {
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const onScroll = () => {
      if (!headerRef.current) return;
      const scrolled = window.scrollY;
      // Header stays solid — increase opacity slightly on scroll
      const opacity = Math.min(0.98, 0.92 + (scrolled / 80) * 0.06);
      headerRef.current.style.setProperty("--header-bg-opacity", String(opacity));
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="leash-landing">
      {/* ── Ambient background ── */}
      <div className="leash-ambient" aria-hidden="true" />

      {/* ══════════════════════════════════════════
          HEADER
      ══════════════════════════════════════════ */}
      <header className="leash-header" ref={headerRef}>
        {/* Animated gradient bar at top of header */}
        <div className="leash-header-gradient" aria-hidden="true" />
        <div className="leash-header-inner">
          {/* Logo */}
          <div className="leash-logo-wrap">
            <span className="leash-logo">LEASH</span>
            <span className="leash-logo-sep">·</span>
            <span className="leash-logo-tag">Dashboard for Open Wallet Standard 🐕</span>
          </div>

          {/* Nav */}
          <nav className="leash-nav" aria-label="Main navigation">
            <a href="#install" className="leash-nav-link">Install</a>
            <a href="#how-it-works" className="leash-nav-link">How it works</a>
            <a href="#features" className="leash-nav-link">Features</a>
            <a
              href="https://openwallet.sh"
              target="_blank"
              rel="noopener noreferrer"
              className="leash-nav-link leash-nav-external"
            >
              OWS ↗
            </a>
            <Link href="/dashboard" className="leash-btn-sm">
              Demo Dashboard →
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
            <span className="leash-badge-dot" aria-hidden="true" />
            Built on Open Wallet Standard v1.0.0
          </div>
          <h1 className="leash-hero-title">
            A <RotatingWord /> <span className="leash-hero-word-stable">dashboard</span>
            <br />
            <span className="leash-hero-accent"> for Open Wallet Standard.</span>
          </h1>
          <p className="leash-hero-sub">
            OWS handles the policy engine, key management, and signing.
            LEASH gives it a face — register your agents, configure spend
            limits, restrict chains, and watch every transaction in real time.
            Keys never leave{" "}
            <code className="leash-inline-code">~/.ows/</code>.
          </p>

          <div className="leash-hero-ctas">
            <a href="#install" className="leash-btn-primary">
              Get started in 30 seconds →
            </a>
            <Link href="/dashboard" className="leash-btn-ghost">
              Preview dashboard
            </Link>
          </div>

          {/* Agent connect pill — direct, no question */}
          <div className="leash-agent-pill">
            <span className="leash-agent-pill-label" aria-label="For AI agents">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="3" y="3" width="18" height="18" rx="3" />
                <circle cx="9" cy="10" r="1.5" fill="currentColor" />
                <circle cx="15" cy="10" r="1.5" fill="currentColor" />
                <path d="M9 15 Q12 17.5 15 15" />
              </svg>
              Agents
            </span>
            <span className="leash-agent-pill-text">
              Use the <strong>Copy for Agent</strong> button below — it gives you a structured
              prompt to connect, read state, and start managing wallets.
            </span>
          </div>
        </div>

        {/* Dashboard mockup */}
        <div className="leash-mockup-wrap" aria-hidden="true">
          <div className="leash-mockup-chrome">
            <div className="leash-mockup-bar">
              <span className="leash-dot leash-dot-red" />
              <span className="leash-dot leash-dot-yellow" />
              <span className="leash-dot leash-dot-green" />
              <span className="leash-mockup-url">localhost:3847</span>
            </div>
            <div className="leash-mockup-content">
              <div className="lm-header">
                <span className="lm-logo">LEASH</span>
                <span className="lm-tagline">OWS Dashboard</span>
                <span className="lm-btn">+ Register Agent</span>
              </div>
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
            LEASH running at localhost:3847
          </p>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          HOW IT WORKS
      ══════════════════════════════════════════ */}
      <section id="how-it-works" className="leash-section">
        <div className="leash-section-inner">
          <div className="leash-section-eyebrow">How it works</div>
          <h2 className="leash-section-title">
            OWS does the heavy lifting.<br />LEASH makes it visible.
          </h2>
          <p className="leash-section-sub">
            OpenWallet Standard handles policy enforcement, key security, and
            transaction signing. LEASH is the dashboard that lets you configure
            and observe all of it — no terminal required.
          </p>

          <div className="leash-steps">
            {[
              {
                n: "01",
                title: "Register your agents",
                body: "Add each agent to LEASH. It gets its own OWS wallet and a scoped API key — no raw keys ever leave your machine.",
              },
              {
                n: "02",
                title: "Configure spend rules",
                body: "Set a daily budget per agent. Restrict which chains it can use. Add vendor allowlists. OWS enforces every rule before any key is touched.",
              },
              {
                n: "03",
                title: "Connect your agents",
                body: "Drop the API key into your agent's environment. When it needs to transact, it calls your local LEASH instance — OWS signs and returns the transaction.",
              },
              {
                n: "04",
                title: "Watch and control",
                body: "Every transaction attempt appears in real time. See what was approved, what got blocked, and why. Pause any agent instantly from the dashboard.",
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
            Clone the repo, install, and run. No accounts. No cloud.
            Everything runs locally on your machine.
          </p>

          {/* Copy for Agent block — on top, most common use-case */}
          <div className="leash-agent-install-box">
            <div className="leash-agent-install-header">
              <div className="leash-agent-install-title">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="3" y="3" width="18" height="18" rx="3" />
                  <circle cx="9" cy="10" r="1.5" fill="currentColor" />
                  <circle cx="15" cy="10" r="1.5" fill="currentColor" />
                  <path d="M9 15 Q12 17.5 15 15" />
                </svg>
                Bring your agent into LEASH
              </div>
              <CopyButton
                text={AGENT_PROMPT}
                label="Copy prompt"
                successLabel="Copied!"
                className="leash-copy-for-agent-btn"
              />
            </div>
            <p className="leash-agent-install-desc">
              Your Claw, Claude Code, Codex, or any other agent can manage wallets here.
              Copy one prompt that tells it to connect first, read wallet state next,
              and install only if needed.
            </p>
            <div className="leash-agent-prompt-preview">
              <pre><code>{AGENT_PROMPT}</code></pre>
            </div>
          </div>

          <div className="leash-install-steps leash-install-steps-spaced">
            {/* Step 1 */}
            <div className="leash-install-step">
              <div className="leash-install-step-n">1</div>
              <div className="leash-install-step-content">
                <div className="leash-install-step-title">Clone and start LEASH</div>
                <div className="leash-install-step-desc">
                  LEASH and OWS core install together. Dashboard opens on{" "}
                  <code className="leash-inline-code">localhost:3847</code>.
                </div>
                <div className="leash-code-block">
                  <pre><code>{INSTALL_CMD}</code></pre>
                  <CopyButton
                    text={INSTALL_CMD}
                    label="Copy"
                    successLabel="Copied!"
                    className="leash-code-copy-btn"
                  />
                </div>
                <div className="leash-code-block leash-code-block-comment">
                  <pre><code>{INSTALL_CMD_GLOBAL}</code></pre>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="leash-install-step">
              <div className="leash-install-step-n">2</div>
              <div className="leash-install-step-content">
                <div className="leash-install-step-title">Register your first agent</div>
                <div className="leash-install-step-desc">
                  Click <strong>&ldquo;Register Agent&rdquo;</strong> in the LEASH dashboard.
                  Set a name, daily spend limit, and chain allowlist. LEASH creates
                  an OWS wallet and issues a scoped API key.
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
                <div className="leash-install-step-title">Connect your agent</div>
                <div className="leash-install-step-desc">
                  Add the API key to your agent&apos;s environment. It signs through
                  your local LEASH instance — raw keys never leave the vault.
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
        </div>
      </section>

      {/* ══════════════════════════════════════════
          FEATURES
      ══════════════════════════════════════════ */}
      <section id="features" className="leash-section">
        <div className="leash-section-inner">
          <div className="leash-section-eyebrow">Features</div>
          <h2 className="leash-section-title">
            Every OWS capability.<br />One clean interface.
          </h2>
          <p className="leash-section-sub">
            LEASH doesn&apos;t replace OWS — it exposes it. Every feature you see
            maps directly to an OWS primitive. The standard does the work;
            LEASH makes it accessible.
          </p>

          <div className="leash-features">
            {[
              {
                n: "01",
                title: "Local-first",
                body: "LEASH runs on your machine. Your OWS keys stay in ~/.ows/ — not in a browser extension, not in the cloud.",
                tag: "~/.ows/wallets/",
              },
              {
                n: "02",
                title: "Visual spend tracking",
                body: "See exactly what each agent spent, which transactions were blocked, and why — all without touching a terminal.",
                tag: "Real-time dashboard",
              },
              {
                n: "03",
                title: "Per-agent policies",
                body: "Each agent gets its own spend limit, chain allowlist, and API key. Change or revoke any of them in two clicks.",
                tag: "Per-agent keys",
              },
              {
                n: "04",
                title: "Instant pause",
                body: "Something looks wrong? Freeze any agent immediately from the dashboard. Transactions stop at the policy layer — no on-chain action required.",
                tag: "One-click control",
              },
              {
                n: "05",
                title: "Multi-chain",
                body: "One LEASH instance manages wallets across ETH, Base, Solana, and more. Configure which chains each agent is allowed to use.",
                tag: "8 chains",
              },
              {
                n: "06",
                title: "Composable by design",
                body: "LEASH adds a UI layer — the OWS CLI, MCP server, SDK, and REST interfaces still work exactly as documented.",
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
          FOOTER
      ══════════════════════════════════════════ */}
      <footer className="leash-footer">
        <div className="leash-footer-inner">
          <div className="leash-footer-left">
            <span className="leash-footer-logo">LEASH</span>
            <span className="leash-footer-tagline">
              Dashboard for Open Wallet Standard 🐕
            </span>
            <span className="leash-footer-note">
              Local-first · Open source
            </span>
          </div>
          <div className="leash-footer-links">
            <a href="https://openwallet.sh" target="_blank" rel="noopener noreferrer">
              openwallet.sh ↗
            </a>
            <a href="https://docs.openwallet.sh" target="_blank" rel="noopener noreferrer">
              OWS Docs ↗
            </a>
            <a href="https://github.com/Socialure/leash" target="_blank" rel="noopener noreferrer">
              GitHub ↗
            </a>
            <Link href="/dashboard">Dashboard</Link>
          </div>
        </div>
        <div className="leash-footer-bottom">
          Dashboard for Open Wallet Standard 🐕
        </div>
      </footer>
    </div>
  );
}
