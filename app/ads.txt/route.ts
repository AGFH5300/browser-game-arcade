// Google AdSense seller authorization. No publisher is advertised until a real
// ca-pub account ID is configured. Do not accept arbitrary visitor-provided IDs.
export const dynamic = 'force-dynamic';

export function GET() {
  const client = process.env.ADSENSE_CLIENT?.trim() ?? '';
  const authorized = /^ca-pub-\d{16}$/.test(client);
  const body = authorized
    ? `google.com, pub-${client.slice('ca-pub-'.length)}, DIRECT, f08c47fec0942fa0\n`
    : '# Sidequest: AdSense publisher has not yet been configured.\n';
  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=300'
    }
  });
}
