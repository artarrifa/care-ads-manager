// Care Loyalty Multi-Language, Multi-Currency, Binance Pay, Wompi & PayPal Client Engine

let config = {
  whatsappNumber: '573164734660',
  supportEmail: 'care@caretechservices.com',
  demoUrl: 'https://www.caretechapps.com/dashboard',
  binancePayConfigured: false,
  wompiConfigured: false,
  paypalConfigured: false,
  paypalClientId: '',
  paypalMode: 'sandbox'
};

// Translations Dictionary
const TRANSLATIONS = {
  es: {
    topBarAnnouncement: '🚀 Empieza en minutos sin hardware especial. <strong>¡Prueba la demo hoy!</strong>',
    logoSubtitle: 'Fidelidad Digital',
    navBenefits: 'Beneficios',
    navHowItWorks: 'Cómo Funciona',
    navDashboard: 'Panel',
    navPricing: 'Planes y Precios',
    navDemo: 'Demo',
    btnChatWhatsApp: 'WhatsApp',
    heroBadge: 'Programa de fidelidad digital para negocios',
    heroTitle: 'Haz que tus clientes <span class="gradient-text">vuelvan más.</span>',
    heroDesc: 'Crea tu programa de sellos o puntos, entrégalo directamente en <strong>Apple Wallet</strong> o <strong>Google Wallet</strong> y convierte cada visita en una nueva oportunidad de venta recurrente.',
    highlight1: 'Sin app para el cliente',
    highlight2: 'QR para registrar visitas',
    highlight3: 'Premios y recompensas',
    highlight4: 'Campañas por Wallet, WhatsApp & SMS',
    btnTryDemo: 'Probar Demo Gratis',
    btnChatAdvisor: 'Chatear con un Asesor',
    btnEmailUs: 'Escribir por Email',
    heroFootnote: 'Empieza en minutos. <strong>Sin hardware especial</strong>, funciona desde cualquier celular o tablet.',
    walletStampsLabel: 'Sellos acumulados',
    walletMemberLabel: 'MIEMBRO',
    walletRewardLabel: 'RECOMPENSA',
    walletRewardVal: 'Café Gratis',
    walletBusinessLabel: 'NEGOCIO',
    walletScanText: '<i class="fa-solid fa-qrcode"></i> Escanear tarjeta en caja',
    walletSimulatePrompt: '¡Simula sellar tarjeta!',
    btnAddStamp: '+ Añadir Sello',
    howSubBadge: 'Paso a paso',
    howTitle: '¿Cómo funciona Care Loyalty?',
    howSubtitle: 'Tres sencillos pasos para fidelizar y disparar tus ventas sin fricción.',
    step1Title: 'Crea',
    step1Desc: 'Define tu esquema de sellos o puntos, las recompensas para tus clientes y personaliza los colores y logotipo con la identidad de tu marca.',
    step2Title: 'Entrega',
    step2Desc: 'Tus clientes solo escanean un código QR físico en tu mostrador o mesa y guardan al instante la tarjeta en Apple Wallet o Google Wallet. ¡Cero descargas!',
    step3Title: 'Recupera',
    step3Desc: 'Premia la recurrencia en caja con un escaneo rápido y vuelve a contactar a tus clientes con campañas push en Wallet, WhatsApp y SMS con su permiso.',
    dashSubBadge: 'Control Total',
    dashTitle: 'Todo el programa desde un solo panel',
    dashSubtitle: 'Configura tu negocio, recompensas, clientes, campañas y personal con reportes en tiempo real.',
    dashFeat1: 'Métricas de visitas y retorno de clientes en tiempo real.',
    dashFeat2: 'Gestión de empleados y permisos de cajero.',
    dashFeat3: 'Enlace directo a WhatsApp y Email para soporte y campañas.',
    dashFeat4: 'Notificaciones automáticas cuando estén cerca de su recompensa.',
    btnDashDemo: 'Ver Demo del Panel',
    mockupBizNameLabel: 'Nombre del Negocio',
    mockupSlugLabel: 'Slug Público',
    mockupCategoryLabel: 'Categoría',
    mockupCategoryVal: 'Cafetería & Restaurante',
    mockupColorLabel: 'Color de Marca',
    mockupRewardLabel: 'Descripción de la Recompensa',
    mockupRewardVal: '¡Acumula 10 sellos y reclama un café de especialidad gratis!',
    mockupStatusVal: 'Programa Activo & Conectado a Wallet',
    pricingSubBadge: 'Transparente y sin sorpresas',
    planStarterSub: 'Para comenzar',
    featStarter1: '1 Programa de sellos o puntos',
    featStarter2: 'Tarjetas Apple & Google Wallet',
    featStarter3: 'Código QR para mostrador',
    featStarter4: 'Panel de control para 1 usuario',
    featStarter5: 'Soporte por WhatsApp & Email',
    btnSelectPlanStarter: 'Elegir Plan Starter',
    btnSelectPlanPro: 'Elegir Plan Pro',
    btnSelectPlanBusiness: 'Elegir Plan Business',
    btnQuestionsChat: '¿Tienes dudas? Chatea con un asesor',
    btnChooseStarter: 'Hablar con Asesor',
    badgePopular: 'MÁS POPULAR',
    planProSub: 'Para crecer y acelerar ventas',
    featPro1: 'Todo lo de Starter',
    featPro2: 'Clientes y visitas ilimitadas',
    featPro3: 'Campañas automatizadas por Wallet',
    featPro4: 'Integración y recordatorios por WhatsApp',
    featPro5: 'Hasta 3 usuarios / cajeros',
    featPro6: 'Reportes avanzados de recurrencia',
    btnChoosePro: 'Hablar con Asesor',
    planBusinessSub: 'Para varios equipos y sucursales',
    featBusiness1: 'Todo lo de Pro',
    featBusiness2: 'Multi-sucursal y multi-cajas',
    featBusiness3: 'Campañas masivas por SMS, Email y WhatsApp',
    featBusiness4: 'Usuarios y cajeros ilimitados',
    featBusiness5: 'API & Webhooks personalizados',
    featBusiness6: 'Asesor dedicado y soporte prioritario',
    btnChooseBusiness: 'Hablar con Asesor',
    trustPaymentsTitle: '<i class="fa-solid fa-shield-halved text-cyan"></i> Medios de Pago Globales & Locales Aceptados:',
    supportWapTitle: 'Soporte por WhatsApp',
    supportEmailTitle: 'Contacto por Email',
    ctaTitle: 'Convierte una visita en la próxima.',
    ctaSubtitle: 'Solicita una demo o prueba el panel de Care Loyalty ahora mismo.',
    btnCtaLiveDemo: 'Abrir Demo en Vivo',
    btnCtaWapDemo: 'Solicitar Demo por WhatsApp',
    btnCtaEmailDemo: 'Solicitar por Email',
    qrScanHint: 'Escanear con tu móvil',
    footerDesc: 'La plataforma digital de fidelización para negocios que quieren crecer su frecuencia de compra con Apple Wallet y Google Wallet.',
    footerRegionsTitle: 'Enlaces por Región',
    footerContactTitle: 'Contacto & Soporte',
    footerContactText: '¿Tienes dudas o necesitas ayuda configurando tu cuenta en cualquier país?',
    btnFooterContact: 'Escríbenos directamente',
    footerCopyright: '© 2026 Care Loyalty · Care Tech Services. Todos los derechos reservados. Compatible con Apple Wallet & Google Wallet en todo el mundo.',
    checkoutModalTitle: 'Elige tu Forma de Pago',
    checkoutModalSubtitle: 'Selecciona el método de tu preferencia para activar tu plan de Care Loyalty:',
    bpOptionDesc: 'Paga en USDT, BTC o BNB al instante desde tu app de Binance o escaneando QR. (0% de comisión).',
    btnPayWithBinance: 'Pagar con Binance Pay (Preview)',
    wompiOptionDesc: 'Paga seguro en Colombia con PSE, Nequi, Bancolombia o Tarjeta de Crédito/Débito.',
    btnPayWithWompi: 'Pagar con Wompi / PSE',
    wapOptionDesc: '¿Tienes dudas sobre el plan o prefieres coordinar tu activación y factura directamente con nuestro equipo?',
    btnChatWithAdvisorNow: 'Chatear y Activar por WhatsApp',
    checkoutOrEmail: '¿Prefieres escribirnos por correo?',
    wompiModalTitle: 'Pasarela Wompi en Construcción',
    wompiModalSubtitle: 'Estamos terminando de enlazar las credenciales de comercio para procesar pagos automáticos con PSE, Bancolombia, Nequi y Tarjetas.',
    btnWompiContinueWap: 'Coordinar Pago por WhatsApp',
    btnWompiEmail: 'Escribir por Email',
    modalTitle: 'Impulsa tu negocio con Care Loyalty',
    modalSubtitle: 'Déjanos tus datos y te redirigiremos de inmediato a WhatsApp con un asesor:',
    modalLabelCountry: 'País de tu Negocio',
    modalLabelName: 'Tu Nombre Completo',
    modalLabelPhone: 'Número de WhatsApp (con código de país)',
    modalLabelEmail: 'Correo Electrónico (opcional)',
    modalLabelBizName: 'Nombre de tu Negocio / Local',
    modalLabelBizType: 'Tipo de Negocio',
    modalBtnSubmit: 'Continuar a WhatsApp',
    modalOrEmail: 'O si prefieres, escríbenos directamente a:',
    modalPrivacy: '🔒 Tus datos son confidenciales y solo se usan para la atención comercial.',
    binanceModalTitle: 'Pago con Binance Pay',
    binanceModalSubtitle: 'Paga tu suscripción en USDT / Cripto con 0% de comisión y activación instantánea.',
    summaryPlan: 'Plan Seleccionado:',
    summaryTotal: 'Total a Pagar:',
    bpLabelEmail: 'Correo Electrónico para Factura & Licencia',
    bpLabelPhone: 'Teléfono / WhatsApp',
    btnGenerateBinanceQR: 'Generar Código de Pago Binance Pay',
    binanceScanTitle: 'Escanea con tu App de Binance',
    binanceScanSubtitle: 'Abre la app de Binance, pulsa en el icono de escanear y confirma el pago:',
    bpAmountToPay: 'Monto exacto:',
    bpTradeNo: 'Orden ID:',
    bpTimer: 'Tiempo restante:',
    bpStatusWaiting: 'Esperando confirmación del pago en Binance...',
    btnOpenBinanceApp: 'Abrir Binance Pay en Web / App',
    btnCheckStatus: 'Ya realicé el pago, verificar',
    bpSuccessTitle: '¡Pago Confirmado con Éxito!',
    bpSuccessDesc: 'Hemos recibido tu pago en Binance Pay. Tu cuenta y programa de fidelidad de Care Loyalty están listos para activarse.',
    btnGoDashboard: 'Ir al Panel de Care Loyalty',
    btnNotifyWhatsApp: 'Notificar activación por WhatsApp',
    paypalOptionDesc: 'Paga seguro a nivel global con cualquier tarjeta de crédito o débito internacional (Visa, Mastercard, Amex) o tu saldo PayPal.',
    btnPayWithPayPal: 'Pagar con PayPal & Tarjetas',
    paypalModalTitle: 'Pago Seguro con PayPal',
    paypalModalSubtitle: 'Activa tu suscripción de Care Loyalty al instante con tarjeta o saldo PayPal.',
    btnProceedToPayPal: 'Continuar a Pago con PayPal',
    paypalSuccessTitle: '¡Pago con PayPal Confirmado!',
    paypalSuccessDesc: 'Hemos verificado tu pago exitosamente. Tu plan de Care Loyalty ha sido activado.'
  },
  en: {
    topBarAnnouncement: '🚀 Launch in minutes with zero special hardware. <strong>Try the demo today!</strong>',
    logoSubtitle: 'Digital Loyalty',
    navBenefits: 'Features',
    navHowItWorks: 'How It Works',
    navDashboard: 'Dashboard',
    navPricing: 'Pricing & Plans',
    navDemo: 'Demo',
    btnChatWhatsApp: 'WhatsApp',
    heroBadge: 'Digital loyalty program for modern businesses',
    heroTitle: 'Make your customers <span class="gradient-text">come back more.</span>',
    heroDesc: 'Create your digital stamp or points program, deliver it directly inside <strong>Apple Wallet</strong> or <strong>Google Wallet</strong> and turn every visit into a repeat sale.',
    highlight1: 'Zero customer app downloads',
    highlight2: 'Instant QR code visit tracking',
    highlight3: 'Custom rewards & perks',
    highlight4: 'Campaigns via Wallet, WhatsApp & SMS',
    btnTryDemo: 'Try Live Demo',
    btnChatAdvisor: 'Chat with an Advisor',
    btnEmailUs: 'Send Us an Email',
    heroFootnote: 'Get started in minutes. <strong>No special hardware needed</strong> — works on any phone or tablet.',
    walletStampsLabel: 'Collected Stamps',
    walletMemberLabel: 'MEMBER',
    walletRewardLabel: 'REWARD',
    walletRewardVal: 'Free Specialty Coffee',
    walletBusinessLabel: 'BUSINESS',
    walletScanText: '<i class="fa-solid fa-qrcode"></i> Scan card at register',
    walletSimulatePrompt: 'Simulate stamp card!',
    btnAddStamp: '+ Add Stamp',
    howSubBadge: 'Step by Step',
    howTitle: 'How does Care Loyalty work?',
    howSubtitle: 'Three effortless steps to build loyalty and boost repeat sales.',
    step1Title: 'Create',
    step1Desc: 'Define your stamp or points rules, choose rewards, and customize cards with your brand logos and colors.',
    step2Title: 'Deliver',
    step2Desc: 'Customers simply scan a QR code at your counter and immediately save the pass into Apple Wallet or Google Wallet.',
    step3Title: 'Retain',
    step3Desc: 'Reward return visits with a fast scan at checkout and re-engage customers via Wallet push, WhatsApp & SMS.',
    dashSubBadge: 'Full Control',
    dashTitle: 'Your entire loyalty program from one dashboard',
    dashSubtitle: 'Manage your stores, rewards, customers, campaigns, and staff with real-time analytics.',
    dashFeat1: 'Real-time customer visit and retention metrics.',
    dashFeat2: 'Staff and cashier permissions management.',
    dashFeat3: 'Direct WhatsApp and Email integration for support & campaigns.',
    dashFeat4: 'Automated push notifications when customers are close to rewards.',
    btnDashDemo: 'Open Dashboard Demo',
    mockupBizNameLabel: 'Business Name',
    mockupSlugLabel: 'Public URL Slug',
    mockupCategoryLabel: 'Category',
    mockupCategoryVal: 'Coffee Shop & Bakery',
    mockupColorLabel: 'Brand Color',
    mockupRewardLabel: 'Reward Description',
    mockupRewardVal: 'Collect 10 stamps and claim a free specialty coffee!',
    mockupStatusVal: 'Program Active & Connected to Wallet',
    pricingSubBadge: 'Transparent & No Hidden Fees',
    planStarterSub: 'For getting started',
    featStarter1: '1 Stamp or points program',
    featStarter2: 'Apple & Google Wallet passes',
    featStarter3: 'Countertop QR code stand',
    featStarter4: 'Admin dashboard for 1 user',
    featStarter5: 'Support via WhatsApp & Email',
    btnSelectPlanStarter: 'Choose Starter Plan',
    btnSelectPlanPro: 'Choose Pro Plan',
    btnSelectPlanBusiness: 'Choose Business Plan',
    btnQuestionsChat: 'Questions? Chat with an advisor',
    btnChooseStarter: 'Talk with Advisor',
    badgePopular: 'MOST POPULAR',
    planProSub: 'For growing & accelerating sales',
    featPro1: 'Everything in Starter',
    featPro2: 'Unlimited customers and visits',
    featPro3: 'Automated push campaigns via Wallet',
    featPro4: 'WhatsApp integration and smart reminders',
    featPro5: 'Up to 3 users / cashiers',
    featPro6: 'Advanced customer return reports',
    btnChoosePro: 'Talk with Advisor',
    planBusinessSub: 'For multiple teams & branches',
    featBusiness1: 'Everything in Pro',
    featBusiness2: 'Multi-store and multi-cashier setup',
    featBusiness3: 'Mass campaigns via SMS, Email & WhatsApp',
    featBusiness4: 'Unlimited users and cashiers',
    featBusiness5: 'Custom APIs & Webhooks',
    featBusiness6: 'Dedicated advisor & priority support',
    btnChooseBusiness: 'Talk with Advisor',
    trustPaymentsTitle: '<i class="fa-solid fa-shield-halved text-cyan"></i> Global & Local Accepted Payment Methods:',
    supportWapTitle: 'WhatsApp Support',
    supportEmailTitle: 'Email Contact',
    ctaTitle: 'Turn every visit into the next one.',
    ctaSubtitle: 'Request a demo or explore the Care Loyalty dashboard right now.',
    btnCtaLiveDemo: 'Open Live Demo',
    btnCtaWapDemo: 'Request Demo on WhatsApp',
    btnCtaEmailDemo: 'Request via Email',
    qrScanHint: 'Scan with your smartphone',
    footerDesc: 'The digital loyalty platform for businesses that want to increase purchase frequency with Apple Wallet & Google Wallet.',
    footerRegionsTitle: 'Regional Plans',
    footerContactTitle: 'Contact & Support',
    footerContactText: 'Questions or need assistance setting up your account anywhere in the world?',
    btnFooterContact: 'Message us directly',
    footerCopyright: '© 2026 Care Loyalty · Care Tech Services. All rights reserved. Compatible with Apple Wallet & Google Wallet globally.',
    checkoutModalTitle: 'Choose Your Payment Method',
    checkoutModalSubtitle: 'Select your preferred method to activate your Care Loyalty subscription:',
    bpOptionDesc: 'Pay instantly in USDT, BTC, or BNB with 0% fees via your Binance App or QR code.',
    btnPayWithBinance: 'Pay with Binance Pay (Preview)',
    wompiOptionDesc: 'Secure payments in Colombia with PSE, Nequi, Bancolombia, and Credit/Debit Cards.',
    btnPayWithWompi: 'Pay with Wompi / PSE',
    wapOptionDesc: 'Have questions about the plan or prefer direct setup and billing assistance from our team?',
    btnChatWithAdvisorNow: 'Chat & Activate via WhatsApp',
    checkoutOrEmail: 'Prefer to reach us by email?',
    wompiModalTitle: 'Wompi Payment Gateway in Setup',
    wompiModalSubtitle: 'We are completing merchant API verification for automated PSE, Bancolombia, Nequi and card payments.',
    btnWompiContinueWap: 'Arrange Payment on WhatsApp',
    btnWompiEmail: 'Send Email',
    modalTitle: 'Boost your business with Care Loyalty',
    modalSubtitle: 'Leave your details and we will connect you immediately with an advisor on WhatsApp:',
    modalLabelCountry: 'Your Business Country',
    modalLabelName: 'Your Full Name',
    modalLabelPhone: 'WhatsApp Number (with country code)',
    modalLabelEmail: 'Email Address (optional)',
    modalLabelBizName: 'Business / Store Name',
    modalLabelBizType: 'Business Type',
    modalBtnSubmit: 'Continue to WhatsApp',
    modalOrEmail: 'Or if you prefer, email us directly at:',
    modalPrivacy: '🔒 Your details are confidential and used solely for business assistance.',
    binanceModalTitle: 'Pay with Binance Pay',
    binanceModalSubtitle: 'Pay your subscription in USDT / Crypto with 0% fees and instant activation.',
    summaryPlan: 'Selected Plan:',
    summaryTotal: 'Total to Pay:',
    bpLabelEmail: 'Email for Invoice & Pass License',
    bpLabelPhone: 'Phone / WhatsApp',
    btnGenerateBinanceQR: 'Generate Binance Pay QR Code',
    binanceScanTitle: 'Scan with your Binance App',
    binanceScanSubtitle: 'Open Binance App, tap the scan icon and confirm payment:',
    bpAmountToPay: 'Exact amount:',
    bpTradeNo: 'Order ID:',
    bpTimer: 'Time remaining:',
    bpStatusWaiting: 'Waiting for payment confirmation on Binance...',
    btnOpenBinanceApp: 'Open Binance Pay Web / App',
    btnCheckStatus: 'I have already paid, check status',
    bpSuccessTitle: 'Payment Confirmed Successfully!',
    bpSuccessDesc: 'We have received your payment via Binance Pay. Your Care Loyalty account and loyalty program are ready for activation.',
    btnGoDashboard: 'Go to Care Loyalty Dashboard',
    btnNotifyWhatsApp: 'Notify activation on WhatsApp',
    paypalOptionDesc: 'Pay securely worldwide with any international credit/debit card (Visa, Mastercard, Amex) or PayPal balance.',
    btnPayWithPayPal: 'Pay with PayPal & Cards',
    paypalModalTitle: 'Secure Payment with PayPal',
    paypalModalSubtitle: 'Activate your Care Loyalty subscription instantly with credit/debit card or PayPal.',
    btnProceedToPayPal: 'Proceed to PayPal Checkout',
    paypalSuccessTitle: 'Payment Confirmed with PayPal!',
    paypalSuccessDesc: 'We have verified your payment successfully. Your Care Loyalty plan is active.'
  }
};

// Regional Pricing Database
const REGIONS_DATA = {
  colombia: {
    name: 'Colombia',
    flag: '🇨🇴',
    title: { es: 'Planes para Colombia', en: 'Plans for Colombia' },
    subtitle: {
      es: 'Precios en Pesos Colombianos (COP). Cancela en cualquier momento sin permanencia.',
      en: 'Prices in Colombian Pesos (COP). Cancel anytime without lock-in.'
    },
    currency: 'COP',
    period: { es: '/ mes', en: '/ mo' },
    starter: '39.900',
    pro: '69.900',
    business: '149.900',
    starterFull: 'COP $39.900/mes',
    proFull: 'COP $69.900/mes',
    businessFull: 'COP $149.900/mes',
    cryptoStarter: '9.90 USDT',
    cryptoPro: '19.90 USDT',
    cryptoBusiness: '39.90 USDT'
  },
  europa: {
    name: 'España / Europa',
    flag: '🇪🇺',
    title: { es: 'Planes para España y Europa', en: 'Plans for Spain & Europe' },
    subtitle: {
      es: 'Precios en Euros (€ EUR). Solución europea para Apple Wallet y Google Wallet.',
      en: 'Prices in Euros (€ EUR). European digital solution for Apple Wallet & Google Wallet.'
    },
    currency: '€',
    period: { es: '/ mes', en: '/ mo' },
    starter: '9,90',
    pro: '19,90',
    business: '39,90',
    starterFull: '€9,90 EUR/mes',
    proFull: '€19,90 EUR/mes',
    businessFull: '€39,90 EUR/mes',
    cryptoStarter: '9.90 USDT',
    cryptoPro: '19.90 USDT',
    cryptoBusiness: '39.90 USDT'
  },
  usa: {
    name: 'Estados Unidos / Global',
    flag: '🇺🇸',
    title: { es: 'Planes para Estados Unidos y Global', en: 'Plans for USA & Global' },
    subtitle: {
      es: 'Precios en Dólares ($ USD). Programa digital de fidelización sin descargas de app.',
      en: 'Prices in USD ($). Digital loyalty program with zero app download friction.'
    },
    currency: '$',
    period: { es: 'USD / mes', en: 'USD / mo' },
    starter: '9.90',
    pro: '19.90',
    business: '39.90',
    starterFull: '$9.90 USD/mo',
    proFull: '$19.90 USD/mo',
    businessFull: '$39.90 USD/mo',
    cryptoStarter: '9.90 USDT',
    cryptoPro: '19.90 USDT',
    cryptoBusiness: '39.90 USDT'
  },
  mexico: {
    name: 'México',
    flag: '🇲🇽',
    title: { es: 'Planes para México', en: 'Plans for Mexico' },
    subtitle: {
      es: 'Precios en Pesos Mexicanos (MXN). Fideliza clientes directo en su Wallet.',
      en: 'Prices in Mexican Pesos (MXN). Retain customers directly in their digital wallet.'
    },
    currency: '$',
    period: { es: 'MXN / mes', en: 'MXN / mo' },
    starter: '199',
    pro: '399',
    business: '799',
    starterFull: '$199 MXN/mes',
    proFull: '$399 MXN/mes',
    businessFull: '$799 MXN/mes',
    cryptoStarter: '9.90 USDT',
    cryptoPro: '19.90 USDT',
    cryptoBusiness: '39.90 USDT'
  }
};

const CRYPTO_PRICES = {
  Starter: { amount: 9.90, currency: 'USDT', display: '9.90 USDT' },
  Pro: { amount: 19.90, currency: 'USDT', display: '19.90 USDT' },
  Business: { amount: 39.90, currency: 'USDT', display: '39.90 USDT' }
};

const USD_PRICES = {
  Starter: { amount: 9.90, currency: 'USD', display: '$9.90 USD' },
  Pro: { amount: 19.90, currency: 'USD', display: '$19.90 USD' },
  Business: { amount: 39.90, currency: 'USD', display: '$39.90 USD' }
};

let currentLanguage = 'es';
let currentRegion = 'colombia';
let currentOrderPollingInterval = null;
let currentCountdownInterval = null;
let activeTradeNo = null;
let activePlanName = 'Pro';

// Switch Language Engine
function changeLanguage(langKey) {
  if (langKey !== 'es' && langKey !== 'en') langKey = 'es';
  currentLanguage = langKey;
  const dict = TRANSLATIONS[langKey];

  // Update all elements with data-i18n
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (dict[key]) {
      el.innerHTML = dict[key];
    }
  });

  // Update Hero Titles
  const heroTitleEl = document.getElementById('heroTitle');
  if (heroTitleEl && dict.heroTitle) {
    heroTitleEl.innerHTML = dict.heroTitle;
  }
  const heroDescEl = document.getElementById('heroDesc');
  if (heroDescEl && dict.heroDesc) {
    heroDescEl.innerHTML = dict.heroDesc;
  }

  // Update Language Buttons Active State
  document.querySelectorAll('.lang-btn, .lang-pill').forEach(btn => {
    if (btn.dataset.lang === langKey) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  // Re-apply Region Pricing with current language texts
  changeRegion(currentRegion);
}

// Switch Region & Currency
function changeRegion(regionKey) {
  if (!REGIONS_DATA[regionKey]) regionKey = 'colombia';
  currentRegion = regionKey;
  const data = REGIONS_DATA[regionKey];

  // Update Section Title & Subtitle with current language
  const titleEl = document.getElementById('pricingTitle');
  const subEl = document.getElementById('pricingSubtitle');
  if (titleEl) titleEl.innerText = data.title[currentLanguage] || data.title.es;
  if (subEl) subEl.innerText = data.subtitle[currentLanguage] || data.subtitle.es;

  // Update Currencies & Amounts
  const starterCur = document.getElementById('starterCurrency');
  const starterPr = document.getElementById('starterPrice');
  const starterPeriod = document.getElementById('starterPeriod');

  const proCur = document.getElementById('proCurrency');
  const proPr = document.getElementById('proPrice');
  const proPeriod = document.getElementById('proPeriod');

  const busCur = document.getElementById('businessCurrency');
  const busPr = document.getElementById('businessPrice');
  const busPeriod = document.getElementById('businessPeriod');

  const periodText = data.period[currentLanguage] || data.period.es;

  if (starterCur) starterCur.innerText = data.currency;
  if (starterPr) starterPr.innerText = data.starter;
  if (starterPeriod) starterPeriod.innerText = periodText;

  if (proCur) proCur.innerText = data.currency;
  if (proPr) proPr.innerText = data.pro;
  if (proPeriod) proPeriod.innerText = periodText;

  if (busCur) busCur.innerText = data.currency;
  if (busPr) busPr.innerText = data.business;
  if (busPeriod) busPeriod.innerText = periodText;

  // Update Crypto badges
  const stC = document.getElementById('starterCrypto');
  const prC = document.getElementById('proCrypto');
  const bsC = document.getElementById('businessCrypto');
  if (stC) stC.innerText = data.cryptoStarter;
  if (prC) prC.innerText = data.cryptoPro;
  if (bsC) bsC.innerText = data.cryptoBusiness;

  // Update Dropdown Select
  const select = document.getElementById('countrySelect');
  if (select && select.value !== regionKey) {
    select.value = regionKey;
  }

  // Update Modal Country Select
  const modalCountry = document.getElementById('leadCountry');
  if (modalCountry) {
    if (regionKey === 'colombia') modalCountry.value = 'Colombia';
    else if (regionKey === 'europa') modalCountry.value = 'España / Europa';
    else if (regionKey === 'usa') modalCountry.value = 'Estados Unidos';
    else if (regionKey === 'mexico') modalCountry.value = 'México';
  }

  // Update Active States on Header Pills
  document.querySelectorAll('.pill-btn').forEach(btn => {
    if (btn.dataset.region === regionKey) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  // Update Active States on Pricing Country Tabs
  document.querySelectorAll('.country-tab').forEach(tab => {
    if (tab.dataset.tab === regionKey) {
      tab.classList.add('active');
    } else {
      tab.classList.remove('active');
    }
  });
}

// Fetch config from server if available
async function loadConfig() {
  try {
    const res = await fetch('/api/config');
    if (res.ok) {
      const data = await res.json();
      config = { ...config, ...data };
      if (config.paypalConfigured && config.paypalClientId) {
        loadPayPalSdk(config.paypalClientId);
      }
    }
  } catch (err) {
    console.log('Using default client config');
  }
}

// ==========================================
// MASTER PLAN CHECKOUT & PAYMENT SELECTOR
// ==========================================

function openPlanCheckoutModal(planName = 'Pro', directMethod = null) {
  activePlanName = planName;
  const reg = REGIONS_DATA[currentRegion] || REGIONS_DATA.colombia;
  const crypto = CRYPTO_PRICES[planName] || CRYPTO_PRICES.Pro;

  let fiatStr = '';
  if (planName === 'Starter') fiatStr = reg.starterFull;
  else if (planName === 'Pro') fiatStr = reg.proFull;
  else if (planName === 'Business') fiatStr = reg.businessFull;

  // If directly clicking a specific method
  if (directMethod === 'paypal') {
    openPayPalModal(planName);
    return;
  }
  if (directMethod === 'binance') {
    openBinancePayModal(planName);
    return;
  }
  if (directMethod === 'wompi') {
    showWompiNotice(planName);
    return;
  }

  const modal = document.getElementById('planCheckoutModal');
  const planNameEl = document.getElementById('chkPlanName');
  const planPriceEl = document.getElementById('chkPlanPrice');
  const cryptoPriceEl = document.getElementById('chkCryptoPrice');

  if (planNameEl) planNameEl.innerText = `Plan ${planName}`;
  if (planPriceEl) planPriceEl.innerText = fiatStr;
  if (cryptoPriceEl) cryptoPriceEl.innerText = `(${crypto.display})`;

  if (modal) modal.classList.add('active');
}

function closePlanCheckoutModal() {
  const modal = document.getElementById('planCheckoutModal');
  if (modal) modal.classList.remove('active');
}

function proceedToPayPalFromCheckout() {
  closePlanCheckoutModal();
  openPayPalModal(activePlanName);
}

function proceedToBinanceFromCheckout() {
  closePlanCheckoutModal();
  openBinancePayModal(activePlanName);
}

function proceedToWhatsAppFromCheckout(paymentMethod = 'WhatsApp') {
  closePlanCheckoutModal();
  closeWompiNotice();
  const reg = REGIONS_DATA[currentRegion];
  let priceStr = '';
  if (activePlanName === 'Starter') priceStr = reg.starterFull;
  else if (activePlanName === 'Pro') priceStr = reg.proFull;
  else if (activePlanName === 'Business') priceStr = reg.businessFull;

  openWhatsAppModal(`${activePlanName} (${priceStr}) - Vía ${paymentMethod}`);
}

function showWompiNotice(planName = null) {
  if (planName) activePlanName = planName;
  closePlanCheckoutModal();
  const modal = document.getElementById('wompiNoticeModal');
  if (modal) modal.classList.add('active');
}

function closeWompiNotice() {
  const modal = document.getElementById('wompiNoticeModal');
  if (modal) modal.classList.remove('active');
}

function handlePlanClick(planType) {
  openPlanCheckoutModal(planType);
}

// ==========================================
// BINANCE PAY CHECKOUT MODAL ENGINE
// ==========================================

function openBinancePayModal(planName = 'Pro') {
  activePlanName = planName;
  const modal = document.getElementById('binancePayModal');
  const planInput = document.getElementById('bpPlanInput');
  const planSummary = document.getElementById('bpSelectedPlan');
  const amountSummary = document.getElementById('bpOrderAmount');

  const priceObj = CRYPTO_PRICES[planName] || CRYPTO_PRICES.Pro;

  if (planInput) planInput.value = planName;
  if (planSummary) planSummary.innerText = `Plan ${planName}`;
  if (amountSummary) amountSummary.innerText = priceObj.display;

  // Reset steps
  document.getElementById('binanceStepForm').style.display = 'block';
  document.getElementById('binanceStepPayment').style.display = 'none';
  document.getElementById('binanceStepSuccess').style.display = 'none';

  if (modal) modal.classList.add('active');
}

function closeBinancePayModal() {
  const modal = document.getElementById('binancePayModal');
  if (modal) modal.classList.remove('active');
  if (currentOrderPollingInterval) clearInterval(currentOrderPollingInterval);
  if (currentCountdownInterval) clearInterval(currentCountdownInterval);
}

async function processBinancePayOrder(event) {
  event.preventDefault();

  const plan = document.getElementById('bpPlanInput').value;
  const name = document.getElementById('bpCustomerName').value.trim();
  const email = document.getElementById('bpCustomerEmail').value.trim();
  const phone = document.getElementById('bpCustomerPhone').value.trim();
  const businessName = document.getElementById('bpBusinessName').value.trim();
  const btn = document.getElementById('btnSubmitBinance');

  const priceObj = CRYPTO_PRICES[plan] || CRYPTO_PRICES.Pro;

  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Generando orden...';

  try {
    const res = await fetch('/api/binance-pay/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        plan,
        name,
        email,
        phone,
        businessName,
        currency: 'USDT',
        amount: priceObj.amount
      })
    });

    const result = await res.json();

    if (result.success && result.data) {
      activeTradeNo = result.merchantTradeNo;
      renderBinancePaymentScreen(result);
    } else {
      alert('Error creando la orden de Binance Pay: ' + (result.error || 'Por favor intenta nuevamente.'));
    }
  } catch (err) {
    console.error('Error in Binance Pay checkout:', err);
    alert('No se pudo conectar con el servidor de pagos. Revisa tu conexión.');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fa-solid fa-qrcode"></i> <span data-i18n="btnGenerateBinanceQR">Generar Código de Pago Binance Pay</span>';
  }
}

function renderBinancePaymentScreen(orderResult) {
  document.getElementById('binanceStepForm').style.display = 'none';
  document.getElementById('binanceStepPayment').style.display = 'block';

  const data = orderResult.data;
  const qrImg = document.getElementById('bpQrImage');
  const qrLoader = document.getElementById('bpQrLoader');
  const displayAmount = document.getElementById('bpDisplayAmount');
  const displayTradeNo = document.getElementById('bpDisplayTradeNo');
  const directBtn = document.getElementById('bpDirectPayBtn');

  displayAmount.innerText = `${orderResult.orderAmount} ${orderResult.currency}`;
  displayTradeNo.innerText = orderResult.merchantTradeNo;

  // Use Binance generated QR or fallback to dynamic QR
  let qrUrl = data.qrcodeLink;
  if (!qrUrl && data.qrContent) {
    qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(data.qrContent)}`;
  } else if (!qrUrl && data.checkoutUrl) {
    qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(data.checkoutUrl)}`;
  }

  qrImg.onload = () => {
    qrLoader.style.display = 'none';
    qrImg.style.display = 'block';
  };
  qrImg.src = qrUrl;

  if (directBtn && data.checkoutUrl) {
    directBtn.href = data.checkoutUrl;
  }

  // Start 15 minute countdown
  startBinanceCountdown(15 * 60);

  // Start polling backend for payment confirmation
  startOrderStatusPolling(orderResult.merchantTradeNo);
}

function startBinanceCountdown(durationSeconds) {
  if (currentCountdownInterval) clearInterval(currentCountdownInterval);
  let remaining = durationSeconds;
  const countdownEl = document.getElementById('bpCountdown');

  currentCountdownInterval = setInterval(() => {
    if (remaining <= 0) {
      clearInterval(currentCountdownInterval);
      if (countdownEl) countdownEl.innerText = 'Expirado';
      document.getElementById('bpStatusText').innerText = 'El tiempo de la orden ha expirado. Por favor genera una nueva.';
      return;
    }
    const mins = Math.floor(remaining / 60);
    const secs = remaining % 60;
    if (countdownEl) {
      countdownEl.innerText = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    remaining--;
  }, 1000);
}

function startOrderStatusPolling(tradeNo) {
  if (currentOrderPollingInterval) clearInterval(currentOrderPollingInterval);

  currentOrderPollingInterval = setInterval(async () => {
    try {
      const res = await fetch(`/api/binance-pay/order-status?tradeNo=${tradeNo}`);
      if (res.ok) {
        const result = await res.json();
        if (result.success && result.order && (result.order.status === 'PAID' || result.order.status === 'SUCCESS')) {
          clearInterval(currentOrderPollingInterval);
          if (currentCountdownInterval) clearInterval(currentCountdownInterval);
          renderBinanceSuccessScreen(result.order);
        }
      }
    } catch (e) {
      console.log('Polling Binance Pay status...');
    }
  }, 4000);
}

async function checkBinanceOrderStatusManual() {
  if (!activeTradeNo) return;
  const statusBox = document.getElementById('bpStatusText');
  statusBox.innerText = 'Verificando con Binance Pay...';

  try {
    const res = await fetch(`/api/binance-pay/order-status?tradeNo=${activeTradeNo}`);
    const result = await res.json();
    if (result.success && result.order && (result.order.status === 'PAID' || result.order.status === 'SUCCESS')) {
      renderBinanceSuccessScreen(result.order);
    } else {
      setTimeout(() => {
        statusBox.innerText = 'Aún no se ha detectado el pago. Si ya enviaste los fondos, tardará unos segundos en confirmarse.';
      }, 1000);
    }
  } catch (e) {
    statusBox.innerText = 'Error verificando estado. Intenta en unos momentos.';
  }
}

function renderBinanceSuccessScreen(order) {
  document.getElementById('binanceStepForm').style.display = 'none';
  document.getElementById('binanceStepPayment').style.display = 'none';
  document.getElementById('binanceStepSuccess').style.display = 'block';

  document.getElementById('bpSuccessTradeNo').innerText = order.merchantTradeNo;
  document.getElementById('bpSuccessPlan').innerText = order.plan;
}

function openWhatsAppSuccessContact() {
  const textMsg = `Hola Care Loyalty! 👋 Acabo de realizar el pago en Binance Pay de mi orden *${activeTradeNo}* para el *Plan ${activePlanName}*. ¿Podrían confirmar mi activación?`;
  const cleanPhone = config.whatsappNumber.replace(/[^0-9]/g, '');
  window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(textMsg)}`, '_blank');
}

// ==========================================
// PAYPAL CHECKOUT ENGINE
// ==========================================

let activePayPalTradeNo = null;

function loadPayPalSdk(clientId, currency = 'USD') {
  if (document.getElementById('paypal-sdk-script')) return;
  const script = document.createElement('script');
  script.id = 'paypal-sdk-script';
  script.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(clientId)}&currency=${currency}`;
  script.async = true;
  script.onload = () => {
    console.log('PayPal SDK cargado exitosamente');
    if (document.getElementById('paypalModal')?.classList.contains('active')) {
      renderPayPalButtons();
    }
  };
  document.head.appendChild(script);
}

function openPayPalModal(planName = 'Pro') {
  activePlanName = planName;
  const modal = document.getElementById('paypalModal');
  const planInput = document.getElementById('ppPlanInput');
  const planSummary = document.getElementById('ppSelectedPlan');
  const amountSummary = document.getElementById('ppOrderAmount');
  const banner = document.getElementById('paypalCredentialsBanner');
  const fallbackCta = document.getElementById('paypalFallbackCta');
  const btnContainer = document.getElementById('paypal-button-container');

  const priceObj = USD_PRICES[planName] || USD_PRICES.Pro;

  if (planInput) planInput.value = planName;
  if (planSummary) planSummary.innerText = `Plan ${planName}`;
  if (amountSummary) amountSummary.innerText = priceObj.display;

  // Reset steps
  const stepForm = document.getElementById('paypalStepForm');
  const stepSuccess = document.getElementById('paypalStepSuccess');
  if (stepForm) stepForm.style.display = 'block';
  if (stepSuccess) stepSuccess.style.display = 'none';

  if (!config.paypalConfigured || !config.paypalClientId) {
    if (banner) banner.style.display = 'flex';
    if (fallbackCta) fallbackCta.style.display = 'block';
    if (btnContainer) btnContainer.style.display = 'none';
  } else {
    if (banner) banner.style.display = 'none';
    if (fallbackCta) fallbackCta.style.display = 'none';
    if (btnContainer) {
      btnContainer.style.display = 'block';
      renderPayPalButtons();
    }
  }

  if (modal) modal.classList.add('active');
}

function closePayPalModal() {
  const modal = document.getElementById('paypalModal');
  if (modal) modal.classList.remove('active');
}

function renderPayPalButtons() {
  const btnContainer = document.getElementById('paypal-button-container');
  if (!btnContainer) return;
  btnContainer.innerHTML = '';

  if (window.paypal && window.paypal.Buttons) {
    window.paypal.Buttons({
      style: {
        layout: 'vertical',
        color: 'gold',
        shape: 'rect',
        label: 'pay'
      },
      createOrder: async function(data, actions) {
        const plan = document.getElementById('ppPlanInput')?.value || activePlanName;
        const name = document.getElementById('ppCustomerName')?.value.trim() || 'Cliente Care Loyalty';
        const email = document.getElementById('ppCustomerEmail')?.value.trim() || '';
        const phone = document.getElementById('ppCustomerPhone')?.value.trim() || '';
        const businessName = document.getElementById('ppBusinessName')?.value.trim() || '';
        const priceObj = USD_PRICES[plan] || USD_PRICES.Pro;

        const res = await fetch('/api/paypal/create-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            plan,
            name,
            email,
            phone,
            businessName,
            currency: 'USD',
            amount: priceObj.amount
          })
        });

        const result = await res.json();
        if (result.success && result.orderId) {
          activePayPalTradeNo = result.merchantTradeNo;
          return result.orderId;
        } else {
          alert('Error creando orden en PayPal: ' + (result.error || 'Intenta nuevamente.'));
          throw new Error(result.error || 'Error al crear orden PayPal');
        }
      },
      onApprove: async function(data, actions) {
        try {
          const res = await fetch('/api/paypal/capture-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              orderId: data.orderID,
              merchantTradeNo: activePayPalTradeNo
            })
          });

          const captureRes = await res.json();
          if (captureRes.success) {
            renderPayPalSuccessScreen(captureRes.order || {
              merchantTradeNo: activePayPalTradeNo,
              plan: activePlanName,
              captureId: data.orderID
            });
          } else {
            alert('Error capturando pago: ' + (captureRes.error || 'Verifica tu cuenta PayPal.'));
          }
        } catch (err) {
          console.error('Error capturing PayPal payment:', err);
          alert('Error procesando la confirmación de pago.');
        }
      },
      onError: function(err) {
        console.error('PayPal Buttons Error:', err);
      }
    }).render('#paypal-button-container');
  }
}

async function handlePayPalFormSubmit(event) {
  event.preventDefault();
  const btn = document.getElementById('btnSubmitPayPal');
  const plan = document.getElementById('ppPlanInput')?.value || activePlanName;
  const name = document.getElementById('ppCustomerName')?.value.trim() || 'Cliente Care Loyalty';
  const email = document.getElementById('ppCustomerEmail')?.value.trim() || '';
  const phone = document.getElementById('ppCustomerPhone')?.value.trim() || '';
  const businessName = document.getElementById('ppBusinessName')?.value.trim() || '';
  const priceObj = USD_PRICES[plan] || USD_PRICES.Pro;

  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Procesando...';
  }

  try {
    const res = await fetch('/api/paypal/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        plan,
        name,
        email,
        phone,
        businessName,
        currency: 'USD',
        amount: priceObj.amount
      })
    });

    const result = await res.json();
    if (result.success) {
      activePayPalTradeNo = result.merchantTradeNo;
      if (result.approvalUrl) {
        // Redireccionar al portal de pago seguro de PayPal
        window.location.href = result.approvalUrl;
      } else {
        // En modo Sandbox Demo sin credenciales en vivo
        const captureRes = await fetch('/api/paypal/capture-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: result.orderId,
            merchantTradeNo: result.merchantTradeNo
          })
        });
        const captureData = await captureRes.json();
        renderPayPalSuccessScreen(captureData.order || {
          merchantTradeNo: result.merchantTradeNo,
          plan: plan,
          captureId: result.orderId
        });
      }
    } else {
      alert('Error en checkout PayPal: ' + (result.error || 'Revisa tus datos.'));
    }
  } catch (err) {
    console.error('Error in PayPal submit:', err);
    alert('No se pudo conectar con el servidor de pagos.');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<i class="fa-brands fa-paypal"></i> <span data-i18n="btnProceedToPayPal">Continuar a Pago con PayPal</span>';
    }
  }
}

function renderPayPalSuccessScreen(order) {
  const stepForm = document.getElementById('paypalStepForm');
  const stepSuccess = document.getElementById('paypalStepSuccess');
  if (stepForm) stepForm.style.display = 'none';
  if (stepSuccess) stepSuccess.style.display = 'block';

  const tradeEl = document.getElementById('ppSuccessTradeNo');
  const planEl = document.getElementById('ppSuccessPlan');
  const capEl = document.getElementById('ppSuccessCaptureId');

  if (tradeEl) tradeEl.innerText = order.merchantTradeNo || activePayPalTradeNo || '-';
  if (planEl) planEl.innerText = order.plan || activePlanName || 'Pro';
  if (capEl) capEl.innerText = order.captureId || order.paypalOrderId || 'PP_COMPLETED';
}

function openWhatsAppPayPalSuccessContact() {
  const trade = document.getElementById('ppSuccessTradeNo')?.innerText || activePayPalTradeNo;
  const plan = document.getElementById('ppSuccessPlan')?.innerText || activePlanName;
  const textMsg = `Hola Care Loyalty! 👋 Acabo de realizar mi pago con PayPal de la orden *${trade}* para el *Plan ${plan}*. ¿Podrían confirmarme la activación?`;
  const cleanPhone = (config.whatsappNumber || '573164734660').replace(/[^0-9]/g, '');
  window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(textMsg)}`, '_blank');
}

// Modal WhatsApp Controls
function openWhatsAppModal(planName = 'General') {
  const modal = document.getElementById('whatsappModal');
  const planInput = document.getElementById('selectedPlan');
  if (planInput) planInput.value = planName;
  if (modal) modal.classList.add('active');
}

function closeWhatsAppModal() {
  const modal = document.getElementById('whatsappModal');
  if (modal) modal.classList.remove('active');
}

function onModalCountryChange(countryVal) {
  const countryHidden = document.getElementById('selectedCountry');
  if (countryHidden) countryHidden.value = countryVal;
}

// Close modals when clicking outside
window.addEventListener('click', (e) => {
  const wapModal = document.getElementById('whatsappModal');
  const binModal = document.getElementById('binancePayModal');
  const chkModal = document.getElementById('planCheckoutModal');
  const womModal = document.getElementById('wompiNoticeModal');

  if (e.target === wapModal) closeWhatsAppModal();
  if (e.target === binModal) closeBinancePayModal();
  if (e.target === chkModal) closePlanCheckoutModal();
  if (e.target === womModal) closeWompiNotice();
});

// Form Submission & Redirect to WhatsApp
async function submitLeadForm(event) {
  event.preventDefault();

  const country = document.getElementById('leadCountry').value;
  const name = document.getElementById('leadName').value.trim();
  const phone = document.getElementById('leadPhone').value.trim();
  const email = document.getElementById('leadEmail') ? document.getElementById('leadEmail').value.trim() : '';
  const business = document.getElementById('leadBusiness').value.trim();
  const businessType = document.getElementById('leadBusinessType').value;
  const plan = document.getElementById('selectedPlan').value;

  // Save lead in backend API
  try {
    fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, phone, email, businessName: business, businessType, plan, country })
    });
  } catch (e) {
    console.error('Error saving lead', e);
  }

  // Build WhatsApp Message in active language
  let textMsg = '';
  if (currentLanguage === 'en') {
    textMsg = `Hello Care Loyalty! 👋\n\nMy name is *${name}*.\nI would like more information about the digital loyalty program.\n\n🌍 *Country / Region:* ${country}\n📌 *Plan of interest:* ${plan}\n🏪 *Business:* ${business || 'TBD'}\n🏷️ *Category:* ${businessType}\n📱 *Phone:* ${phone}\n✉️ *Email:* ${email || 'Not provided'}\n\nCould you help me set it up for my business?`;
  } else {
    textMsg = `Hola Care Loyalty! 👋\n\nMi nombre es *${name}*.\nQuiero información sobre el programa de fidelidad.\n\n🌍 *País / Región:* ${country}\n📌 *Plan de interés:* ${plan}\n🏪 *Negocio:* ${business || 'Por definir'}\n🏷️ *Categoría:* ${businessType}\n📱 *Teléfono:* ${phone}\n✉️ *Email:* ${email || 'No especificado'}\n\n¿Me pueden ayudar a configurarlo para mi negocio?`;
  }

  const encodedMsg = encodeURIComponent(textMsg);
  const cleanPhone = config.whatsappNumber.replace(/[^0-9]/g, '');
  const waUrl = `https://wa.me/${cleanPhone}?text=${encodedMsg}`;

  // Close modal and redirect
  closeWhatsAppModal();
  window.open(waUrl, '_blank');
}

// Interactive Stamp Simulator
let currentStamps = 7;
const maxStamps = 10;

function initStampSimulator() {
  const btn = document.getElementById('btnSimulateStamp');
  const counter = document.getElementById('stampCounter');
  const grid = document.getElementById('stampsGrid');

  if (!btn || !counter || !grid) return;

  btn.addEventListener('click', () => {
    if (currentStamps < maxStamps) {
      currentStamps++;
    } else {
      currentStamps = 1; // Reset loop for demo
    }

    // Update Counter Text
    counter.innerHTML = `${currentStamps}<span>/10</span>`;

    // Re-render stamps
    const circles = grid.querySelectorAll('.stamp-circle');
    circles.forEach((circle, index) => {
      if (index < currentStamps) {
        circle.classList.add('active');
        if (index === maxStamps - 1) {
          circle.innerHTML = '<i class="fa-solid fa-gift"></i>';
        } else {
          circle.innerHTML = '<i class="fa-solid fa-check"></i>';
        }
      } else {
        circle.classList.remove('active');
        if (index === maxStamps - 1) {
          circle.innerHTML = '<i class="fa-solid fa-gift"></i>';
        } else {
          circle.innerHTML = '<i class="fa-solid fa-coffee"></i>';
        }
      }
    });

    // If completed 10
    if (currentStamps === maxStamps) {
      const msg = currentLanguage === 'en'
        ? '🎉 Congratulations! You completed 10 stamps. Reward unlocked: Free Specialty Coffee!'
        : '🎉 ¡Felicidades! Has completado 10 sellos. Tu cliente recibe: Café Gratis.';
      setTimeout(() => { alert(msg); }, 200);
    }
  });
}

// Mobile Menu Toggle
function initMobileMenu() {
  const toggle = document.getElementById('mobileToggle');
  const menu = document.getElementById('navMenu');
  if (toggle && menu) {
    toggle.addEventListener('click', () => {
      menu.style.display = menu.style.display === 'flex' ? 'none' : 'flex';
      menu.style.flexDirection = 'column';
      menu.style.position = 'absolute';
      menu.style.top = '100%';
      menu.style.left = '0';
      menu.style.width = '100%';
      menu.style.background = '#070d19';
      menu.style.padding = '20px';
      menu.style.borderBottom = '1px solid rgba(255,255,255,0.1)';
    });
  }
}

// Auto detect initial language & region from URL parameter or Path
function detectInitialState() {
  const urlParams = new URLSearchParams(window.location.search);
  const langParam = urlParams.get('lang') || urlParams.get('idioma');
  const regionParam = urlParams.get('region') || urlParams.get('country') || urlParams.get('pais');
  const currentPath = window.location.pathname.toLowerCase();

  // Language
  if (langParam === 'en' || currentPath.includes('/en') || currentPath.includes('usa')) {
    changeLanguage('en');
  } else {
    changeLanguage('es');
  }

  // Region
  if (regionParam && REGIONS_DATA[regionParam.toLowerCase()]) {
    changeRegion(regionParam.toLowerCase());
  } else if (currentPath.includes('europa') || currentPath.includes('espana') || currentPath.includes('europe')) {
    changeRegion('europa');
  } else if (currentPath.includes('usa') || currentPath.includes('global') || currentPath.includes('us')) {
    changeRegion('usa');
  } else if (currentPath.includes('mexico') || currentPath.includes('mx')) {
    changeRegion('mexico');
  } else {
    changeRegion('colombia');
  }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  loadConfig();
  detectInitialState();
  initStampSimulator();
  initMobileMenu();
});


/* ==========================================================================
   INTEGRACIÓN INTERACTIVA: CAREGAMES, PUBLICIDAD B2B & DONACIONES
   ========================================================================== */

let currentDonationAmount = 3;

// Simulación de interacción con los 3 botones del Banner B2B
function previewBannerClick(actionType) {
  const toast = document.getElementById('bannerFeedbackToast');
  const msgEl = document.getElementById('bannerFeedbackMsg');
  const iconEl = document.getElementById('bannerFeedbackIcon');
  if (!toast || !msgEl || !iconEl) return;

  toast.style.display = 'flex';

  if (actionType === 'web') {
    iconEl.className = 'fa-solid fa-globe';
    iconEl.style.color = '#3b82f6';
    msgEl.innerHTML = '<strong>Acción Web:</strong> Redirige al sitio web oficial o landing page del anunciante en una pestaña nueva sin interrumpir la partida.';
  } else if (actionType === 'donar') {
    iconEl.className = 'fa-solid fa-heart';
    iconEl.style.color = '#ec4899';
    msgEl.innerHTML = '<strong>Acción Donación:</strong> Conecta a causas sociales, voluntariado o recaudación de fondos corporativa de la marca.';
  } else if (actionType === 'tienda') {
    iconEl.className = 'fa-solid fa-cart-shopping';
    iconEl.style.color = '#10b981';
    msgEl.innerHTML = '<strong>Acción Tienda / Ofertas:</strong> Lleva al catálogo de productos, promociones especiales o reserva de citas médicas.';
  } else if (actionType === 'close') {
    iconEl.className = 'fa-solid fa-clock';
    iconEl.style.color = '#f59e0b';
    msgEl.innerHTML = '<strong>Cierre de Cortesía:</strong> El jugador puede ocultar el banner por 60 segundos si desea máxima concentración visual.';
  }

  // Animación de pulso leve
  toast.style.transform = 'scale(1.02)';
  setTimeout(() => {
    toast.style.transform = 'scale(1)';
  }, 200);
}

// Selector de Tiers en el Widget Principal de Donaciones
function selectDonationTier(amount, element) {
  currentDonationAmount = amount;

  // Actualizar clases activas en los items
  document.querySelectorAll('.donation-tier-item').forEach(item => {
    item.classList.remove('active');
  });
  if (element) {
    element.classList.add('active');
  }

  // Limpiar input custom si se seleccionó un tier predefinido
  const customInput = document.getElementById('customDonationInput');
  if (customInput) customInput.value = '';

  updateDonationUI();
}

// Actualizar cantidad desde el input personalizado
function onCustomDonationInput(value) {
  const num = parseFloat(value);
  if (!isNaN(num) && num > 0) {
    currentDonationAmount = num;
    document.querySelectorAll('.donation-tier-item').forEach(item => {
      item.classList.remove('active');
    });
    updateDonationUI();
  }
}

// Actualizar valores en UI y enlaces de PayPal
function updateDonationUI() {
  const displayAmount = currentDonationAmount % 1 === 0 ? currentDonationAmount.toFixed(0) : currentDonationAmount.toFixed(2);
  
  // Botón principal de la sección
  const btnLabel = document.getElementById('btnDonationAmountLabel');
  if (btnLabel) {
    btnLabel.innerText = `$${displayAmount} USD`;
  }

  // Modal
  const modalSum = document.getElementById('modalSelectedAmount');
  if (modalSum) {
    modalSum.innerText = `$${displayAmount} USD`;
  }

  // Conversión aproximada según región
  const approxEl = document.getElementById('modalApproxCurrency');
  if (approxEl) {
    let rate = 4000;
    let symbol = 'COP';
    if (currentRegion === 'europa') {
      rate = 0.92;
      symbol = 'EUR (€)';
      approxEl.innerText = `≈ ${(currentDonationAmount * rate).toFixed(2)} ${symbol}`;
    } else if (currentRegion === 'mexico') {
      rate = 18.5;
      symbol = 'MXN';
      approxEl.innerText = `≈ $${Math.round(currentDonationAmount * rate).toLocaleString()} ${symbol}`;
    } else if (currentRegion === 'colombia') {
      rate = 4000;
      symbol = 'COP';
      approxEl.innerText = `≈ $${Math.round(currentDonationAmount * rate).toLocaleString()} ${symbol}`;
    } else {
      approxEl.innerText = 'Transacción global protegida con PayPal';
    }
  }

  // Botón modal de PayPal
  const modalPayBtn = document.getElementById('btnModalPayPalAction');
  if (modalPayBtn) {
    modalPayBtn.href = `https://paypal.me/caretechservices/${displayAmount}`;
  }
}

// Abrir Modal Rápido de Aportes
function openDonationModal(amount) {
  if (amount) {
    currentDonationAmount = amount;
  }
  updateDonationUI();
  
  // Sincronizar botones dentro del modal
  document.querySelectorAll('.modal-tier-btn').forEach(btn => {
    if (parseFloat(btn.dataset.amount) === currentDonationAmount) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  const modal = document.getElementById('quickDonationModal');
  if (modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

// Cerrar Modal Rápido de Aportes
function closeDonationModal() {
  const modal = document.getElementById('quickDonationModal');
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
}

// Selección de Tier dentro del Modal
function selectModalTier(amount, element) {
  currentDonationAmount = amount;
  document.querySelectorAll('.modal-tier-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  if (element) {
    element.classList.add('active');
  }

  const customField = document.getElementById('modalCustomAmount');
  if (customField) customField.value = '';

  updateDonationUI();
}

function onModalCustomAmount(val) {
  const num = parseFloat(val);
  if (!isNaN(num) && num > 0) {
    currentDonationAmount = num;
    document.querySelectorAll('.modal-tier-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    updateDonationUI();
  }
}

// Redirección directa a PayPal desde el widget o modal
function proceedToDonationPayPal() {
  const displayAmount = currentDonationAmount % 1 === 0 ? currentDonationAmount.toFixed(0) : currentDonationAmount.toFixed(2);
  const paypalUrl = `https://paypal.me/caretechservices/${displayAmount}`;
  window.open(paypalUrl, '_blank', 'noopener,noreferrer');
}

// Cerrar modal con ESC o clic en overlay
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeDonationModal();
    closeWeCareBuyModal();
  }
});

/* ==========================================================================
   MODAL DE COMPRA Y LICENCIAMIENTO WECARE
   ========================================================================== */
function openWeCareBuyModal() {
  const modal = document.getElementById('wecareBuyModal');
  if (modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

function closeWeCareBuyModal() {
  const modal = document.getElementById('wecareBuyModal');
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
}

// Global exposure
window.openDonationModal = openDonationModal;
window.closeDonationModal = closeDonationModal;
window.selectModalTier = selectModalTier;
window.onModalCustomAmount = onModalCustomAmount;
window.proceedToDonationPayPal = proceedToDonationPayPal;
window.openWeCareBuyModal = openWeCareBuyModal;
window.closeWeCareBuyModal = closeWeCareBuyModal;
