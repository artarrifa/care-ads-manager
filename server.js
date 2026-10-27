// Servidor Node.js nativo (Zero-dependencies) optimizado para Hostinger con integración de Binance Pay
const http = require('http');
const https = require('https');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const url = require('url');

// Cargar variables de entorno si existe .env sin requerir paquetes externos
function loadEnv() {
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    content.split('\n').forEach(line => {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let value = match[2] || '';
        if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
        if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
        process.env[key] = value.trim();
      }
    });
  }
}

loadEnv();

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');

const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.js': 'application/javascript; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp'
};

const leads = [];
const orders = new Map(); // Registro de órdenes en memoria

// Configuración de precios por plan en USDT / USD
const PLAN_PRICING = {
  Starter: { amount: 9.90, currency: 'USDT', name: 'Care Loyalty - Plan Starter' },
  Pro: { amount: 19.90, currency: 'USDT', name: 'Care Loyalty - Plan Pro' },
  Business: { amount: 39.90, currency: 'USDT', name: 'Care Loyalty - Plan Business' }
};

// Generar Nonce aleatorio de 32 caracteres para Binance Pay
function generateNonce(length = 32) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Generar firma HMAC-SHA512 para Binance Pay
function generateBinanceSignature(timestamp, nonce, bodyString, secretKey) {
  const payload = `${timestamp}\n${nonce}\n${bodyString}\n`;
  return crypto.createHmac('sha512', secretKey).update(payload).digest('hex').toUpperCase();
}

// Llamada HTTP a la API de Binance Pay
function callBinancePayApi(endpoint, bodyData) {
  return new Promise((resolve, reject) => {
    const apiKey = process.env.BINANCE_PAY_API_KEY;
    const secretKey = process.env.BINANCE_PAY_SECRET_KEY;
    const baseUrl = process.env.BINANCE_PAY_BASE_URL || 'https://bpay.binanceapi.com';

    if (!apiKey || !secretKey) {
      return reject(new Error('BINANCE_PAY_API_KEY o BINANCE_PAY_SECRET_KEY no configuradas en .env'));
    }

    const timestamp = Date.now();
    const nonce = generateNonce(32);
    const bodyString = JSON.stringify(bodyData);
    const signature = generateBinanceSignature(timestamp, nonce, bodyString, secretKey);

    const parsedUrl = url.parse(`${baseUrl}${endpoint}`);
    const options = {
      hostname: parsedUrl.hostname,
      port: 443,
      path: parsedUrl.path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'BinancePay-Timestamp': timestamp,
        'BinancePay-Nonce': nonce,
        'BinancePay-Certificate-SN': apiKey,
        'BinancePay-Signature': signature,
        'Content-Length': Buffer.byteLength(bodyString)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const jsonRes = JSON.parse(data);
          resolve(jsonRes);
        } catch (e) {
          reject(new Error(`Respuesta inválida de Binance Pay: ${data}`));
        }
      });
    });

    req.on('error', (err) => reject(err));
    req.write(bodyString);
    req.end();
  });
}

// ==========================================
// PAYPAL CHECKOUT REST API HELPERS
// ==========================================
let cachedPayPalToken = null;
let payPalTokenExpiresAt = 0;

function getPayPalBaseUrl() {
  const mode = (process.env.PAYPAL_MODE || 'sandbox').toLowerCase().trim();
  return mode === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';
}

function getPayPalAccessToken() {
  return new Promise((resolve, reject) => {
    const clientId = process.env.PAYPAL_CLIENT_ID;
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return reject(new Error('PAYPAL_CLIENT_ID o PAYPAL_CLIENT_SECRET no configuradas en .env'));
    }

    if (cachedPayPalToken && Date.now() < payPalTokenExpiresAt) {
      return resolve(cachedPayPalToken);
    }

    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const baseUrl = getPayPalBaseUrl();
    const parsedUrl = url.parse(`${baseUrl}/v1/oauth2/token`);
    const postData = 'grant_type=client_credentials';

    const options = {
      hostname: parsedUrl.hostname,
      port: 443,
      path: parsedUrl.path,
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.access_token) {
            cachedPayPalToken = json.access_token;
            payPalTokenExpiresAt = Date.now() + ((json.expires_in || 3600) - 60) * 1000;
            resolve(cachedPayPalToken);
          } else {
            reject(new Error(json.error_description || json.error || `Error PayPal Auth: ${data}`));
          }
        } catch (e) {
          reject(new Error(`Respuesta inválida de PayPal Auth: ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

function callPayPalApi(endpoint, method = 'POST', bodyData = null) {
  return new Promise(async (resolve, reject) => {
    try {
      const token = await getPayPalAccessToken();
      const baseUrl = getPayPalBaseUrl();
      const parsedUrl = url.parse(`${baseUrl}${endpoint}`);
      const bodyString = bodyData ? JSON.stringify(bodyData) : '';

      const options = {
        hostname: parsedUrl.hostname,
        port: 443,
        path: parsedUrl.path,
        method: method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      };

      if (bodyData) {
        options.headers['Content-Length'] = Buffer.byteLength(bodyString);
      }

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', chunk => { data += chunk; });
        res.on('end', () => {
          try {
            const json = data ? JSON.parse(data) : {};
            resolve({ statusCode: res.statusCode, data: json });
          } catch (e) {
            reject(new Error(`Respuesta inválida de PayPal: ${data}`));
          }
        });
      });

      req.on('error', reject);
      if (bodyData) req.write(bodyString);
      req.end();
    } catch (err) {
      reject(err);
    }
  });
}

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  let pathname = parsedUrl.pathname;

  // Endpoint API Config
  if (pathname === '/api/config' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({
      whatsappNumber: process.env.WHATSAPP_NUMBER || '573164734660',
      supportEmail: process.env.SUPPORT_EMAIL || 'care@caretechservices.com',
      demoUrl: process.env.DEMO_URL || 'https://www.caretechapps.com/dashboard',
      appName: 'Care Loyalty',
      binancePayConfigured: Boolean(process.env.BINANCE_PAY_API_KEY && process.env.BINANCE_PAY_SECRET_KEY),
      wompiConfigured: Boolean(process.env.WOMPI_PUBLIC_KEY),
      paypalConfigured: Boolean(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET),
      paypalClientId: process.env.PAYPAL_CLIENT_ID || '',
      paypalMode: (process.env.PAYPAL_MODE || 'sandbox').toLowerCase().trim()
    }));
  }

  // Endpoint API Leads
  if (pathname === '/api/leads' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      try {
        const data = JSON.parse(body || '{}');
        const lead = {
          id: Date.now(),
          name: data.name,
          phone: data.phone,
          email: data.email || '',
          businessName: data.businessName || '',
          businessType: data.businessType || '',
          plan: data.plan || 'Starter',
          country: data.country || 'Colombia',
          createdAt: new Date().toISOString()
        };
        leads.push(lead);
        console.log('Nuevo prospecto registrado:', lead);

        res.writeHead(201, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: true, message: 'Prospecto guardado', lead }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'JSON inválido' }));
      }
    });
    return;
  }

  // Endpoint API: Crear Orden en Binance Pay
  if (pathname === '/api/binance-pay/create-order' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', async () => {
      try {
        const data = JSON.parse(body || '{}');
        const rawPlan = (data.plan || 'Starter').replace(/\s*\(.*?\)/, '').trim();
        const planKey = ['Starter', 'Pro', 'Business'].includes(rawPlan) ? rawPlan : 'Starter';
        const planInfo = PLAN_PRICING[planKey];

        const merchantTradeNo = `CL_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
        const orderAmount = data.amount || planInfo.amount;
        const currency = data.currency || planInfo.currency;

        const appBaseUrl = process.env.APP_BASE_URL || `http://${req.headers.host || 'localhost:' + PORT}`;
        const returnUrl = `${appBaseUrl}/?payment=success&tradeNo=${merchantTradeNo}`;
        const cancelUrl = `${appBaseUrl}/?payment=cancel&tradeNo=${merchantTradeNo}`;
        const webhookUrl = `${appBaseUrl}/api/binance-pay/webhook`;

        const newOrder = {
          merchantTradeNo,
          customerName: data.name || 'Cliente Care Loyalty',
          customerEmail: data.email || '',
          customerPhone: data.phone || '',
          businessName: data.businessName || '',
          plan: planKey,
          orderAmount,
          currency,
          status: 'PENDING',
          createdAt: new Date().toISOString()
        };

        orders.set(merchantTradeNo, newOrder);

        // Si existen credenciales de Binance Pay configuradas, llamamos a la API oficial
        if (process.env.BINANCE_PAY_API_KEY && process.env.BINANCE_PAY_SECRET_KEY) {
          const binancePayload = {
            env: { terminalType: 'WEB' },
            merchantTradeNo: merchantTradeNo,
            orderAmount: orderAmount,
            currency: currency,
            goods: {
              goodsType: '02', // Bienes virtuales / servicios
              goodsCategory: '6000',
              referenceGoodsId: `plan_${planKey.toLowerCase()}`,
              goodsName: planInfo.name,
              goodsDetail: `Suscripción mensual al ${planInfo.name}`
            },
            returnUrl: returnUrl,
            cancelUrl: cancelUrl,
            webhookUrl: webhookUrl
          };

          try {
            const apiRes = await callBinancePayApi('/binancepay/openapi/v2/order', binancePayload);

            if (apiRes.status === 'SUCCESS' && apiRes.data) {
              newOrder.prepayId = apiRes.data.prepayId;
              newOrder.checkoutUrl = apiRes.data.checkoutUrl;
              newOrder.qrcodeLink = apiRes.data.qrcodeLink;
              newOrder.qrContent = apiRes.data.qrContent;
              newOrder.deeplink = apiRes.data.deeplink;

              res.writeHead(200, { 'Content-Type': 'application/json' });
              return res.end(JSON.stringify({
                success: true,
                mode: 'live',
                merchantTradeNo,
                orderAmount,
                currency,
                plan: planKey,
                data: apiRes.data
              }));
            } else {
              console.error('Binance Pay API Error:', apiRes);
              res.writeHead(400, { 'Content-Type': 'application/json' });
              return res.end(JSON.stringify({
                success: false,
                error: apiRes.errorMessage || 'Error creando orden en Binance Pay',
                details: apiRes
              }));
            }
          } catch (apiErr) {
            console.error('Error llamando a Binance Pay:', apiErr.message);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({
              success: false,
              error: 'Error de comunicación con Binance Pay API: ' + apiErr.message
            }));
          }
        } else {
          // Modo Sandbox / Demo interactivo si aún no se han colocado las credenciales en .env
          const demoQrContent = `https://pay.binance.com/checkout/demo?tradeNo=${merchantTradeNo}&amount=${orderAmount}&currency=${currency}`;
          const demoQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(demoQrContent)}`;

          newOrder.prepayId = `DEMO_PREPAY_${merchantTradeNo}`;
          newOrder.checkoutUrl = demoQrContent;
          newOrder.qrcodeLink = demoQrUrl;
          newOrder.qrContent = demoQrContent;

          res.writeHead(200, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({
            success: true,
            mode: 'sandbox_ready',
            message: 'Orden creada en modo preparación/sandbox. Para producción, agrega BINANCE_PAY_API_KEY y BINANCE_PAY_SECRET_KEY en el archivo .env',
            merchantTradeNo,
            orderAmount,
            currency,
            plan: planKey,
            data: {
              prepayId: newOrder.prepayId,
              checkoutUrl: demoQrContent,
              qrcodeLink: demoQrUrl,
              qrContent: demoQrContent,
              expireTime: Date.now() + 1000 * 60 * 60 // 1 hora
            }
          }));
        }
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'Datos de orden inválidos: ' + err.message }));
      }
    });
    return;
  }

  // Endpoint API: Consultar estado de una orden
  if (pathname === '/api/binance-pay/order-status' && req.method === 'GET') {
    const tradeNo = parsedUrl.query.tradeNo || parsedUrl.query.merchantTradeNo;
    if (!tradeNo) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'Parámetro tradeNo requerido' }));
    }

    const order = orders.get(tradeNo);
    if (!order) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'Orden no encontrada' }));
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ success: true, order }));
  }

  // Endpoint API: Webhook para notificaciones de Binance Pay
  if (pathname === '/api/binance-pay/webhook' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      try {
        const timestamp = req.headers['binancepay-timestamp'] || '';
        const nonce = req.headers['binancepay-nonce'] || '';
        const receivedSignature = req.headers['binancepay-signature'] || '';
        const secretKey = process.env.BINANCE_PAY_SECRET_KEY;

        // Verificar firma si está configurada la clave secreta
        if (secretKey && timestamp && nonce && receivedSignature) {
          const expectedSig = generateBinanceSignature(timestamp, nonce, body, secretKey);
          if (expectedSig !== receivedSignature.toUpperCase()) {
            console.warn('⚠️ Webhook de Binance Pay: Firma inválida');
            res.writeHead(400, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ returnCode: 'FAIL', returnMessage: 'Invalid signature' }));
          }
        }

        const notifyData = JSON.parse(body || '{}');
        console.log('✅ Webhook recibido de Binance Pay:', notifyData);

        if (notifyData.data) {
          let parsedData = notifyData.data;
          if (typeof parsedData === 'string') {
            try { parsedData = JSON.parse(parsedData); } catch (e) {}
          }

          const tradeNo = parsedData.merchantTradeNo;
          if (tradeNo && orders.has(tradeNo)) {
            const existing = orders.get(tradeNo);
            existing.status = parsedData.status || 'PAID';
            existing.paidAt = new Date().toISOString();
            existing.binanceTransactionId = parsedData.transactionId || '';
            orders.set(tradeNo, existing);
            console.log(`🎉 Pago confirmado con éxito para la orden ${tradeNo} (${existing.plan})`);
          }
        }

        // Respuesta estándar requerida por Binance Pay
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ returnCode: 'SUCCESS', returnMessage: null }));
      } catch (e) {
        console.error('Error procesando webhook:', e);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ returnCode: 'SUCCESS', returnMessage: null }));
      }
    });
    return;
  }

  // ==========================================
  // RUTAS PAYPAL CHECKOUT (REST API v2)
  // ==========================================

  // Endpoint API: Crear Orden en PayPal Checkout
  if (pathname === '/api/paypal/create-order' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', async () => {
      try {
        const data = JSON.parse(body || '{}');
        const rawPlan = (data.plan || 'Starter').replace(/\s*\(.*?\)/, '').trim();
        const planKey = ['Starter', 'Pro', 'Business'].includes(rawPlan) ? rawPlan : 'Starter';
        const planInfo = PLAN_PRICING[planKey];

        const merchantTradeNo = `PP_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
        const orderAmount = Number(data.amount || planInfo.amount).toFixed(2);
        const currency = data.currency || 'USD';

        const appBaseUrl = process.env.APP_BASE_URL || `http://${req.headers.host || 'localhost:' + PORT}`;
        const returnUrl = `${appBaseUrl}/?payment=paypal_success&tradeNo=${merchantTradeNo}`;
        const cancelUrl = `${appBaseUrl}/?payment=paypal_cancel&tradeNo=${merchantTradeNo}`;

        const newOrder = {
          merchantTradeNo,
          customerName: data.name || 'Cliente Care Loyalty',
          customerEmail: data.email || '',
          customerPhone: data.phone || '',
          businessName: data.businessName || '',
          plan: planKey,
          orderAmount: parseFloat(orderAmount),
          currency,
          paymentMethod: 'paypal',
          status: 'PENDING',
          createdAt: new Date().toISOString()
        };

        orders.set(merchantTradeNo, newOrder);

        // Si existen credenciales de PayPal configuradas, llamamos a la API REST v2 de PayPal
        if (process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET) {
          const paypalPayload = {
            intent: 'CAPTURE',
            purchase_units: [
              {
                reference_id: merchantTradeNo,
                custom_id: merchantTradeNo,
                description: `Care Loyalty - Plan ${planKey}`,
                amount: {
                  currency_code: currency,
                  value: orderAmount
                }
              }
            ],
            application_context: {
              brand_name: 'Care Loyalty',
              landing_page: 'BILLING',
              user_action: 'PAY_NOW',
              return_url: returnUrl,
              cancel_url: cancelUrl
            }
          };

          try {
            const apiRes = await callPayPalApi('/v2/checkout/orders', 'POST', paypalPayload);

            if ((apiRes.statusCode === 200 || apiRes.statusCode === 201) && apiRes.data && apiRes.data.id) {
              const paypalOrderId = apiRes.data.id;
              newOrder.paypalOrderId = paypalOrderId;
              const approveLink = (apiRes.data.links || []).find(l => l.rel === 'approve');

              res.writeHead(200, { 'Content-Type': 'application/json' });
              return res.end(JSON.stringify({
                success: true,
                mode: 'live',
                merchantTradeNo,
                orderId: paypalOrderId,
                approvalUrl: approveLink ? approveLink.href : null,
                orderAmount: parseFloat(orderAmount),
                currency,
                plan: planKey,
                data: apiRes.data
              }));
            } else {
              console.error('PayPal Order Create Error:', apiRes);
              res.writeHead(400, { 'Content-Type': 'application/json' });
              return res.end(JSON.stringify({
                success: false,
                error: apiRes.data?.message || 'Error creando orden en PayPal API',
                details: apiRes.data
              }));
            }
          } catch (apiErr) {
            console.error('Error llamando a PayPal API:', apiErr.message);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({
              success: false,
              error: 'Error de comunicación con PayPal API: ' + apiErr.message
            }));
          }
        } else {
          // Modo Sandbox / Demo interactivo si aún no se han colocado las credenciales en .env
          const demoOrderId = `DEMO_PP_${merchantTradeNo}`;
          newOrder.paypalOrderId = demoOrderId;

          res.writeHead(200, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({
            success: true,
            mode: 'sandbox_ready',
            message: 'Orden creada en modo preparación. Configura PAYPAL_CLIENT_ID y PAYPAL_CLIENT_SECRET en .env obtenidas en https://www.paypal.com/mep/merchantapps/setup/checkout/apicredentials',
            merchantTradeNo,
            orderId: demoOrderId,
            orderAmount: parseFloat(orderAmount),
            currency,
            plan: planKey,
            data: {
              id: demoOrderId,
              status: 'CREATED'
            }
          }));
        }
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'Datos de orden inválidos: ' + err.message }));
      }
    });
    return;
  }

  // Endpoint API: Capturar Pago en PayPal Checkout
  if (pathname === '/api/paypal/capture-order' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', async () => {
      try {
        const data = JSON.parse(body || '{}');
        const orderId = data.orderId;
        const merchantTradeNo = data.merchantTradeNo;

        let existingOrder = null;
        if (merchantTradeNo && orders.has(merchantTradeNo)) {
          existingOrder = orders.get(merchantTradeNo);
        } else {
          // Buscar por orderId
          for (const ord of orders.values()) {
            if (ord.paypalOrderId === orderId) {
              existingOrder = ord;
              break;
            }
          }
        }

        if (process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET) {
          try {
            const apiRes = await callPayPalApi(`/v2/checkout/orders/${orderId}/capture`, 'POST', {});
            if ((apiRes.statusCode === 200 || apiRes.statusCode === 201) && (apiRes.data?.status === 'COMPLETED' || apiRes.data?.status === 'APPROVED')) {
              const capture = apiRes.data.purchase_units?.[0]?.payments?.captures?.[0];
              if (existingOrder) {
                existingOrder.status = 'PAID';
                existingOrder.paidAt = new Date().toISOString();
                existingOrder.paypalOrderId = orderId;
                existingOrder.captureId = capture ? capture.id : '';
                existingOrder.payerEmail = apiRes.data.payer?.email_address || '';
                existingOrder.payerName = `${apiRes.data.payer?.name?.given_name || ''} ${apiRes.data.payer?.name?.surname || ''}`.trim();
                orders.set(existingOrder.merchantTradeNo, existingOrder);
              }

              console.log(`🎉 Pago de PayPal confirmado exitosamente para orden ${orderId}`);
              res.writeHead(200, { 'Content-Type': 'application/json' });
              return res.end(JSON.stringify({
                success: true,
                status: 'COMPLETED',
                order: existingOrder,
                details: apiRes.data
              }));
            } else {
              console.error('PayPal Capture Error:', apiRes);
              res.writeHead(400, { 'Content-Type': 'application/json' });
              return res.end(JSON.stringify({
                success: false,
                error: apiRes.data?.message || 'No se pudo completar la captura del pago',
                details: apiRes.data
              }));
            }
          } catch (captureErr) {
            console.error('Error al capturar orden PayPal:', captureErr.message);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({
              success: false,
              error: 'Error de comunicación con PayPal: ' + captureErr.message
            }));
          }
        } else {
          // Modo demo / simulación
          if (existingOrder) {
            existingOrder.status = 'PAID';
            existingOrder.paidAt = new Date().toISOString();
            existingOrder.captureId = `DEMO_CAPTURE_${Date.now()}`;
            orders.set(existingOrder.merchantTradeNo, existingOrder);
          }

          res.writeHead(200, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({
            success: true,
            mode: 'sandbox_demo',
            status: 'COMPLETED',
            message: 'Pago simulado con éxito (Modo preparación sin credenciales en vivo).',
            order: existingOrder || { merchantTradeNo, status: 'PAID', plan: 'Pro' }
          }));
        }
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'Error procesando captura: ' + err.message }));
      }
    });
    return;
  }

  // Endpoint API: Consultar estado de orden PayPal
  if (pathname === '/api/paypal/order-status' && req.method === 'GET') {
    const tradeNo = parsedUrl.query.tradeNo || parsedUrl.query.merchantTradeNo || parsedUrl.query.orderId;
    if (!tradeNo) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'Parámetro tradeNo o orderId requerido' }));
    }

    let order = orders.get(tradeNo);
    if (!order) {
      for (const ord of orders.values()) {
        if (ord.paypalOrderId === tradeNo) {
          order = ord;
          break;
        }
      }
    }

    if (!order) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'Orden no encontrada' }));
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ success: true, order }));
  }

  // Endpoint API: Webhook para eventos de PayPal
  if (pathname === '/api/paypal/webhook' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      try {
        const event = JSON.parse(body || '{}');
        console.log('✅ Webhook recibido de PayPal:', event.event_type);

        if (event.event_type === 'PAYMENT.CAPTURE.COMPLETED' || event.event_type === 'CHECKOUT.ORDER.APPROVED') {
          const resource = event.resource || {};
          const customId = resource.custom_id || resource.purchase_units?.[0]?.custom_id;
          if (customId && orders.has(customId)) {
            const ord = orders.get(customId);
            ord.status = 'PAID';
            ord.paidAt = new Date().toISOString();
            ord.webhookEvent = event.event_type;
            orders.set(customId, ord);
            console.log(`🎉 Webhook PayPal: Pago confirmado para orden ${customId}`);
          }
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ received: true }));
      } catch (e) {
        console.error('Error procesando webhook PayPal:', e);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ received: true }));
      }
    });
    return;
  }

  // Health Check API
  if (pathname === '/api/health' || pathname === '/health-check') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({
      status: 'healthy',
      binancePay: Boolean(process.env.BINANCE_PAY_API_KEY),
      timestamp: new Date()
    }));
  }

  // Servir archivos estáticos
  if (pathname === '/') {
    pathname = '/index.html';
  }

  const safePath = path.normalize(pathname).replace(/^(\.\.[\/\\])+/, '');
  let filePath = path.join(PUBLIC_DIR, safePath);

  fs.stat(filePath, (err, stats) => {
    if (!err && stats.isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    }

    fs.stat(filePath, (statErr, finalStats) => {
      if (statErr || !finalStats.isFile()) {
        // Fallback a index.html para SPA
        filePath = path.join(PUBLIC_DIR, 'index.html');
      }

      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';

      fs.readFile(filePath, (readErr, content) => {
        if (readErr) {
          res.writeHead(500, { 'Content-Type': 'text/plain' });
          return res.end('Error interno del servidor');
        }

        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content);
      });
    });
  });
});

server.listen(PORT, () => {
  console.log(`========================================`);
  console.log(`Care Loyalty Web App iniciada`);
  console.log(`Puerto: ${PORT}`);
  console.log(`URL Local: http://localhost:${PORT}`);
  console.log(`WhatsApp configurado: ${process.env.WHATSAPP_NUMBER || '573164734660'}`);
  console.log(`Binance Pay: ${process.env.BINANCE_PAY_API_KEY ? '✅ Configurado (Live)' : '🟡 Modo Preparación / Sandbox Ready'}`);
  console.log(`PayPal: ${process.env.PAYPAL_CLIENT_ID ? '✅ Configurado (' + (process.env.PAYPAL_MODE || 'sandbox') + ')' : '🟡 Modo Preparación / Sandbox Ready'}`);
  console.log(`========================================`);
});
