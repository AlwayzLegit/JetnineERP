import { Card, PageHeader } from '@/components/ui';

export default function HomePage() {
  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6 sm:py-12">
      <PageHeader
        title="LA Mattress ERP"
        sub="Phase 0 bootstrap is live. Web app is running on Next.js 15."
      />
      <Card title="Service checks">
        <ul className="m-0 list-disc pl-5 text-sm">
          <li>
            <a href="/health">API /health</a>
          </li>
          <li>
            <a href="/ready">API /ready</a>
          </li>
        </ul>
      </Card>
    </main>
  );
}
