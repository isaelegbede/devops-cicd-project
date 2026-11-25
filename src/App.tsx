import { useState } from "react";
import { releases, services, type ServiceState } from "./data";

const stateClass: Record<ServiceState, string> = {
  Operational: "status-good",
  Degraded: "status-warn",
  Maintenance: "status-muted",
};

function App() {
  const [query, setQuery] = useState("");
  const today = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date());
  const filteredServices = services.filter((service) =>
    `${service.name} ${service.team} ${service.region}`
      .toLowerCase()
      .includes(query.toLowerCase().trim()),
  );

  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label="Main navigation">
        <a className="brand" href="#overview" aria-label="Northstar home">
          <span className="brand-mark" aria-hidden="true">N</span>
          <span>northstar<span className="brand-dot">.</span></span>
        </a>
        <div className="workspace-label">WORKSPACE</div>
        <button className="workspace-switcher" type="button" aria-label="Current workspace: Acme Platform">
          <span className="workspace-avatar">A</span>
          <span className="workspace-copy"><strong>Acme Platform</strong><small>Enterprise plan</small></span>
          <span className="chevron" aria-hidden="true">⌄</span>
        </button>
        <nav className="nav-links">
          <a className="nav-link active" href="#overview"><span aria-hidden="true">◫</span> Overview</a>
          <a className="nav-link" href="#services"><span aria-hidden="true">▦</span> Services</a>
          <a className="nav-link" href="#releases"><span aria-hidden="true">↗</span> Deployments</a>
          <a className="nav-link" href="#incidents"><span aria-hidden="true">◇</span> Incidents <span className="nav-count">2</span></a>
        </nav>
        <div className="sidebar-bottom">
          <div className="help-card">
            <div className="help-icon" aria-hidden="true">?</div>
            <strong>Need a hand?</strong>
            <p>Visit the platform docs for setup guides and runbooks.</p>
            <a href="#help">Open documentation <span aria-hidden="true">→</span></a>
          </div>
          <button className="profile-button" type="button" aria-label="Signed in as Alex Morgan">
            <span className="profile-avatar">AM</span>
            <span className="profile-copy"><strong>Alex Morgan</strong><small>Platform admin</small></span>
            <span className="chevron" aria-hidden="true">···</span>
          </button>
        </div>
      </aside>

      <main id="overview" className="main-content">
        <header className="topbar">
          <div className="breadcrumb">Workspace <span>/</span> <strong>Overview</strong></div>
          <div className="topbar-actions">
            <span className="updated-label"><span className="live-dot live-dot-warn" /> 2 services need attention</span>
            <button type="button" className="icon-button" aria-label="Notifications">♧<span className="notification-dot" /></button>
            <button type="button" className="icon-button avatar-small" aria-label="Account menu">AM</button>
          </div>
        </header>

        <div className="page-content">
          <section className="page-heading">
            <div>
              <p className="eyebrow">{today.toUpperCase()}</p>
              <h1>Good morning, Alex <span aria-hidden="true">✦</span></h1>
              <p className="subheading">Here&apos;s what&apos;s happening across your platform today.</p>
            </div>
            <button className="button button-primary" type="button"><span aria-hidden="true">＋</span> New deployment</button>
          </section>

          <section className="metrics-grid" aria-label="Platform metrics">
            <article className="metric-card">
              <div className="metric-heading"><span>Service health</span><span className="metric-icon mint" aria-hidden="true">⌁</span></div>
              <div className="metric-value">98.6<span className="metric-unit">%</span></div>
              <div className="metric-foot"><span className="trend-positive">↗ 2.4%</span><span> vs. last month</span></div>
              <div className="sparkline sparkline-green" aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /></div>
            </article>
            <article className="metric-card">
              <div className="metric-heading"><span>Active services</span><span className="metric-icon blue" aria-hidden="true">▦</span></div>
              <div className="metric-value">24<span className="metric-unit">/ 26</span></div>
              <div className="metric-foot"><span className="trend-positive">↗ 2 added</span><span> this quarter</span></div>
              <div className="sparkline sparkline-blue" aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /></div>
            </article>
            <article className="metric-card">
              <div className="metric-heading"><span>Deployments</span><span className="metric-icon purple" aria-hidden="true">↗</span></div>
              <div className="metric-value">38</div>
              <div className="metric-foot"><span className="trend-positive">↗ 12.8%</span><span> vs. last week</span></div>
              <div className="sparkline sparkline-purple" aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /></div>
            </article>
            <article className="metric-card">
              <div className="metric-heading"><span>Open incidents</span><span className="metric-icon amber" aria-hidden="true">◇</span></div>
              <div className="metric-value">02</div>
              <div className="metric-foot"><span className="trend-neutral">— No change</span><span> from yesterday</span></div>
              <div className="sparkline sparkline-amber" aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /></div>
            </article>
          </section>

          <section className="content-grid">
            <article id="services" className="panel services-panel">
              <div className="panel-heading">
                <div><h2>Service health</h2><p>Monitor the status of your critical services.</p></div>
                <a className="text-link" href="#services">View all <span aria-hidden="true">→</span></a>
              </div>
              <label className="search-field">
                <span aria-hidden="true">⌕</span>
                <span className="visually-hidden">Filter services</span>
                <input
                  type="search"
                  placeholder="Filter services..."
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
                <kbd>/</kbd>
              </label>
              <div className="table-scroll">
                <table>
                  <thead><tr><th>Service</th><th>Status</th><th>Uptime (30d)</th><th>Latency</th><th>Region</th></tr></thead>
                  <tbody>
                    {filteredServices.map((service) => (
                      <tr key={service.name}>
                        <td><span className="service-badge">{service.name.slice(0, 1)}</span><span className="service-name">{service.name}<small>{service.team}</small></span></td>
                        <td><span className={`status-pill ${stateClass[service.state]}`}><i />{service.state}</span></td>
                        <td className="table-number">{service.uptime}</td>
                        <td className="table-number">{service.latency}</td>
                        <td className="region-cell">{service.region}</td>
                      </tr>
                    ))}
                    {filteredServices.length === 0 && (
                      <tr><td className="empty-state" colSpan={5}>No services match &quot;{query}&quot;.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="table-footer"><span>Showing {filteredServices.length} of {services.length} services</span><a href="#services">Service directory <span aria-hidden="true">→</span></a></div>
            </article>

            <article id="releases" className="panel releases-panel">
              <div className="panel-heading">
                <div><h2>Recent deployments</h2><p>Latest releases across environments.</p></div>
                <button className="more-button" type="button" aria-label="More deployment options">···</button>
              </div>
              <div className="release-list">
                {releases.map((release) => (
                  <div className="release-item" key={release.app}>
                    <span className="release-icon" aria-hidden="true">↗</span>
                    <div className="release-main"><strong>{release.app}</strong><span>{release.version} <i /> {release.environment}</span></div>
                    <div className="release-meta"><span className="release-user">{release.initials}</span><small>{release.time}</small></div>
                  </div>
                ))}
              </div>
              <a className="all-releases" href="#releases">Deployment history <span aria-hidden="true">→</span></a>
            </article>
          </section>

          <section id="incidents" className="incident-banner">
            <span className="incident-symbol" aria-hidden="true">!</span>
            <div><strong>2 incidents need your attention</strong><p>Identity platform latency is elevated in eu-west-1. Analytics maintenance is scheduled.</p></div>
            <a href="#incidents">Review incidents <span aria-hidden="true">→</span></a>
          </section>
          <footer className="page-footer"><span>© 2025 Northstar Platform</span><span>Sample dashboard · Connect an API before using operationally</span></footer>
        </div>
      </main>
    </div>
  );
}

export default App;
