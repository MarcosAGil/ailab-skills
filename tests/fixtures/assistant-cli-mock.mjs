import http from 'node:http';
import fs from 'node:fs';

const logFile = process.env.AILAB_MOCK_LOG;
let assistantCalls = 0;

function json(response, status, body) {
  const encoded = JSON.stringify(body);
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(encoded),
  });
  response.end(encoded);
}

const catalog = {
  schema_version: 2,
  catalog_version: '2.0.0',
  min_cli_version: '2.2.0',
  billing: { type: 'actual_usage', max_authorized_credits: 160 },
  default_model: 'gemini-3-5-flash-lite-priority',
  assistants: {
    free: { label: 'Libre', description: 'Sin contexto.', prompt_version: 'none', prompt_sha256: null, estimated_credits: 3, max_authorized_credits: 24 },
    'image-prompter': { label: 'Image Prompter', description: 'Imagen.', prompt_version: 'test', prompt_sha256: 'a'.repeat(64), estimated_credits: 11, max_authorized_credits: 48 },
  },
  models: {
    'gemini-3-5-flash-lite-priority': {
      label: 'Gemini 3.5 Flash Lite', vendor: 'OpenRouter · Priority',
      accepts_images: true, accepts_audio: true, accepts_video: true,
    },
  },
};

const server = http.createServer((request, response) => {
  if (request.method === 'GET' && request.url === '/api/v1/skill/assistants.json') {
    json(response, 200, catalog);
    return;
  }
  let raw = '';
  request.setEncoding('utf8');
  request.on('data', (chunk) => { raw += chunk; });
  request.on('end', () => {
    if (request.url === '/api/wallet/api.php') {
      json(response, 200, { ok: true, user: { email: 'skill@test.local', tier: 'hub' }, balance: 1000 });
      return;
    }
    if (request.url === '/api/v1/skill/assistant.php') {
      assistantCalls += 1;
      const body = JSON.parse(raw || '{}');
      if (logFile) fs.appendFileSync(logFile, JSON.stringify({ call: assistantCalls, body }) + '\n');
      if (assistantCalls === 1) {
        json(response, 502, {
          ok: false,
          error: 'Respuesta inválida simulada. No se han cobrado créditos.',
          error_code: 'retryable_invalid_response',
          retry_same_request: true,
          credits_reserved: 0,
        });
        return;
      }
      json(response, 200, {
        ok: true,
        assistant_id: body.assistant_id,
        model_id: 'gemini-3-5-flash-lite-priority',
        message: { role: 'assistant', content: 'Prompt final devuelto por Gemini 3.5 Flash Lite.' },
        charged_credits: 9,
        balance: 991,
        request_id: body.client_request_id,
      });
      return;
    }
    json(response, 404, { ok: false, error: 'Ruta de test no encontrada.' });
  });
});

server.listen(0, '127.0.0.1', () => {
  process.stdout.write(String(server.address().port) + '\n');
});

for (const signal of ['SIGTERM', 'SIGINT']) {
  process.on(signal, () => server.close(() => process.exit(0)));
}
