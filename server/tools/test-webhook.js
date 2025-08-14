import dotenv from 'dotenv';
dotenv.config();

const kind = process.argv[2] || 'sanction'; // "sanction" ou "recruitment"

function getUrl() {
  if (kind === 'recruitment') {
    return process.env.DISCORD_WEBHOOK_RECRUITMENT_URL || process.env.DISCORD_WEBHOOK_URL;
  }
  return process.env.DISCORD_WEBHOOK_SANCTION_URL || process.env.DISCORD_WEBHOOK_URL;
}

async function main() {
  if (typeof fetch !== 'function') {
    const { fetch: undiciFetch } = await import('undici');
    global.fetch = undiciFetch;
  }

  const url = getUrl();
  if (!url) {
    console.error('Pas de webhook URL pour', kind);
    process.exit(1);
  }

  const payload = {
    content: 'Test webhook (' + kind + ')',
    embeds: [{
      title: 'Test Embed',
      description: 'Si tu vois ceci, le webhook fonctionne ✅',
      color: 0x5865F2,
      fields: [
        { name: 'Env', value: kind, inline: true },
        { name: 'Heure', value: new Date().toISOString(), inline: true }
      ]
    }]
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type':'application/json' },
    body: JSON.stringify(payload)
  });
  const text = await res.text();
  console.log('Status:', res.status);
  console.log('Body:', text || '(no body)');
}

main().catch(e => {
  console.error('Erreur test webhook:', e);
  process.exit(1);
});
