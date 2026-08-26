export default function HomePage() {
  return (
    <main style={{ padding: '4rem', fontFamily: 'system-ui, sans-serif' }}>
      <h1>LA Mattress ERP</h1>
      <p>Phase 0 bootstrap is live. Web app is running on Next.js 15.</p>
      <ul>
        <li>
          <a href="/health">API /health</a>
        </li>
        <li>
          <a href="/ready">API /ready</a>
        </li>
      </ul>
    </main>
  );
}
