// TRIBO - Service Worker de Notificações Soberanas
const CACHE_NAME = 'tribo-cache-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/index.css',
  '/index.tsx',
  '/App.tsx'
];

// Instalação do Service Worker e Caching básico
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// Ativação do Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Manipulador do evento PUSH (Notificações Push Reais)
self.addEventListener('push', (event) => {
  let data = {
    title: 'TRIBO Soberana',
    body: 'Você recebeu uma nova atualização descentralizada!',
    icon: 'https://api.dicebear.com/7.x/avataaars/svg?seed=tribo',
    badge: 'https://api.dicebear.com/7.x/avataaars/svg?seed=tribo-badge',
    url: '/'
  };

  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/'
    },
    actions: [
      { action: 'open', title: 'Abrir Tribo' },
      { action: 'close', title: 'Fechar' }
    ],
    tag: 'tribo-push-notification',
    renotify: true
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Manipulador do evento de CLICK na Notificação
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Tentar focar em uma aba existente com a mesma URL
      for (const client of clientList) {
        if (client.url.includes(targetUrl) && 'focus' in client) {
          return client.focus();
        }
      }
      // Se não houver aba aberta, abre uma nova
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

// Escuta mensagens do aplicativo para agendamento local de notificações em segundo plano (Simulação Real)
self.addEventListener('message', (event) => {
  const data = event.data;
  
  if (data && data.action === 'schedule-notification') {
    const delay = data.delay || 5000;
    
    // Agendar usando setTimeout no escopo do Service Worker que roda em segundo plano!
    setTimeout(() => {
      const options = {
        body: data.body || 'Nova notificação da Tribo!',
        icon: data.icon || 'https://api.dicebear.com/7.x/avataaars/svg?seed=tribo',
        badge: 'https://api.dicebear.com/7.x/avataaars/svg?seed=tribo-badge',
        vibrate: [100, 50, 100],
        data: {
          url: data.url || '/'
        },
        actions: [
          { action: 'open', title: 'Ver Agora' }
        ],
        tag: 'tribo-scheduled-notification',
        renotify: true
      };

      self.registration.showNotification(data.title || 'TRIBO Alerta', options);
    }, delay);
  }
});
