// TRIBO - Gerenciador de Service Workers e Notificações Push

export interface ServiceWorkerState {
  isSupported: boolean;
  isRegistered: boolean;
  permission: NotificationPermission;
  activeRegistration: ServiceWorkerRegistration | null;
  subscription: PushSubscription | null;
}

export class SWManager {
  private static swUrl = '/sw.js';

  /**
   * Verifica se Service Workers e Notificações são suportados no navegador atual.
   */
  static isSupported(): boolean {
    return typeof window !== 'undefined' && 'serviceWorker' in navigator && 'Notification' in window;
  }

  /**
   * Obtém o estado atual das notificações e registro do Service Worker.
   */
  static async getState(): Promise<ServiceWorkerState> {
    const supported = this.isSupported();
    if (!supported) {
      return {
        isSupported: false,
        isRegistered: false,
        permission: 'default',
        activeRegistration: null,
        subscription: null
      };
    }

    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      // Encontrar registro correspondente à url do nosso sw
      const activeReg = registrations.find(reg => reg.active && reg.active.scriptURL.includes(this.swUrl)) || registrations[0] || null;
      const isRegistered = !!activeReg;
      const permission = Notification.permission;
      
      let subscription: PushSubscription | null = null;
      if (activeReg) {
        try {
          subscription = await activeReg.pushManager.getSubscription();
        } catch (e) {
          console.warn('Falha ao obter subscrição de push:', e);
        }
      }

      return {
        isSupported: true,
        isRegistered,
        permission,
        activeRegistration: activeReg || null,
        subscription
      };
    } catch (error) {
      console.error('Erro ao obter estado do Service Worker:', error);
      return {
        isSupported: true,
        isRegistered: false,
        permission: Notification.permission,
        activeRegistration: null,
        subscription: null
      };
    }
  }

  /**
   * Registra o Service Worker do aplicativo.
   */
  static async register(): Promise<ServiceWorkerRegistration | null> {
    if (!this.isSupported()) return null;

    try {
      // Registrar o sw.js localizado na raiz do servidor (servido da pasta public)
      const registration = await navigator.serviceWorker.register(this.swUrl, {
        scope: '/'
      });
      console.log('Service Worker registrado com sucesso:', registration);
      return registration;
    } catch (error) {
      console.error('Falha ao registrar Service Worker:', error);
      return null;
    }
  }

  /**
   * Desregistra o Service Worker do aplicativo.
   */
  static async unregister(): Promise<boolean> {
    if (!this.isSupported()) return false;

    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      let success = false;
      for (const reg of registrations) {
        const result = await reg.unregister();
        if (result) success = true;
      }
      return success;
    } catch (error) {
      console.error('Erro ao desregistrar Service Worker:', error);
      return false;
    }
  }

  /**
   * Solicita permissão para exibir notificações.
   */
  static async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported()) return 'default';

    try {
      const permission = await Notification.requestPermission();
      console.log('Permissão de notificação atualizada:', permission);
      return permission;
    } catch (error) {
      console.error('Erro ao solicitar permissão de notificação:', error);
      return 'default';
    }
  }

  /**
   * Envia uma mensagem para o Service Worker ativo para disparar uma notificação em segundo plano após um delay.
   * Isso permite que o usuário minimize o navegador e receba a notificação real vinda do Service Worker (background).
   */
  static async scheduleBackgroundNotification(title: string, body: string, delayMs: number = 3000): Promise<boolean> {
    if (!this.isSupported()) return false;

    try {
      const state = await this.getState();
      
      // Se não estiver registrado, tenta registrar
      let reg = state.activeRegistration;
      if (!reg) {
        reg = await this.register();
      }

      if (!reg || !reg.active) {
        console.warn('Nenhum Service Worker ativo encontrado para enviar mensagem.');
        // Fallback local se não puder usar SW
        if (Notification.permission === 'granted') {
          setTimeout(() => {
            new Notification(title, { body });
          }, delayMs);
          return true;
        }
        return false;
      }

      // Envia os dados da notificação agendada para o Service Worker rodando em background
      reg.active.postMessage({
        action: 'schedule-notification',
        title,
        body,
        delay: delayMs,
        url: window.location.origin + window.location.pathname
      });

      return true;
    } catch (error) {
      console.error('Erro ao agendar notificação de background:', error);
      return false;
    }
  }

  /**
   * Simula a criação de uma subscrição push real e a associa ao usuário.
   */
  static async subscribeToPush(): Promise<PushSubscription | { endpoint: string } | null> {
    if (!this.isSupported()) return null;

    try {
      const state = await this.getState();
      let reg = state.activeRegistration;
      
      if (!reg) {
        reg = await this.register();
      }

      if (!reg) return null;

      // Garantir permissão
      if (Notification.permission !== 'granted') {
        const perm = await this.requestPermission();
        if (perm !== 'granted') return null;
      }

      // Em um ambiente de produção real, usaríamos chaves VAPID públicas.
      // Tentaremos fazer uma subscrição real se possível, senão simulamos para garantir usabilidade total offline/sandbox.
      try {
        // Exemplo fictício de chave VAPID para fins de demonstração
        const vapidPublicKey = 'BEl62Vv7s-4z-EABZ46m09t8z6D...'; // opcional
        
        let sub = await reg.pushManager.getSubscription();
        if (!sub) {
          // Subscrever de forma simulada ou real
          sub = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            // applicationServerKey: vapidPublicKey
          });
        }
        return sub;
      } catch (pushErr) {
        console.warn('Não foi possível assinar o PushManager do navegador de forma nativa (comum em iframes ou sem chaves VAPID configuradas). Usando canal de comunicação secundário simulado:', pushErr);
        
        // Retornar um objeto de subscrição simulado para manter o fluxo funcional do usuário
        return {
          endpoint: `https://push.tribo.org/v1/send/simulated_${Math.random().toString(36).substr(2, 9)}`,
          keys: {
            p256dh: 'simulated_p256dh_key',
            auth: 'simulated_auth_key'
          }
        } as any;
      }
    } catch (error) {
      console.error('Erro na subscrição push:', error);
      return null;
    }
  }
}
