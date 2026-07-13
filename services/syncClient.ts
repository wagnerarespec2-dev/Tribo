// TRIBO - Cliente de Sincronismo e Comunicação em Rede via Internet
import { UserDatabase } from './db';

type OnUpdateCallback = () => void;

export class SyncClient {
  private static socket: WebSocket | null = null;
  private static userId: string | null = null;
  private static updateCallbacks: Set<OnUpdateCallback> = new Set();
  private static reconnectTimer: any = null;
  private static isConnecting = false;

  /**
   * Registra um callback para ser notificado sempre que novos dados chegarem da rede/internet.
   */
  static addUpdateCallback(callback: OnUpdateCallback) {
    this.updateCallbacks.add(callback);
    return () => {
      this.updateCallbacks.delete(callback);
    };
  }

  /**
   * Aciona todos os ouvintes após alterações ou sincronismo.
   */
  private static triggerCallbacks() {
    this.updateCallbacks.forEach(cb => {
      try {
        cb();
      } catch (e) {
        console.warn('Erro ao invocar callback de sincronismo:', e);
      }
    });
  }

  /**
   * Inicia a conexão com o servidor de sincronismo via internet.
   */
  static connect(userId: string) {
    if (typeof window === 'undefined') return;
    
    // Se o usuário mudou, desconecta a sessão anterior
    if (this.userId && this.userId !== userId) {
      this.disconnect();
    }

    this.userId = userId;

    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      return;
    }

    if (this.isConnecting) return;
    this.isConnecting = true;

    // Determinar protocolo (ws ou wss) com base na URL do aplicativo
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/ws`;

    console.log(`[TRIBO SYNC] Conectando ao relay de internet: ${wsUrl}`);

    try {
      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        console.log('[TRIBO SYNC] Conectado com sucesso ao servidor de internet!');
        this.isConnecting = false;
        if (this.reconnectTimer) {
          clearInterval(this.reconnectTimer);
          this.reconnectTimer = null;
        }

        // 1. Registrar o aparelho para o usuário atual
        this.send({
          type: 'register',
          payload: { userId: this.userId }
        });

        // 2. Enviar base local para fusão e sincronismo inicial na nuvem
        this.performInitialSync();
      };

      this.socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          this.handleIncomingMessage(message);
        } catch (e) {
          console.warn('[TRIBO SYNC] Erro ao parsear mensagem recebida:', e);
        }
      };

      this.socket.onclose = () => {
        console.log('[TRIBO SYNC] Conexão de internet encerrada.');
        this.isConnecting = false;
        this.socket = null;
        this.scheduleReconnect();
      };

      this.socket.onerror = (err) => {
        console.warn('[TRIBO SYNC] Erro no socket de sincronismo:', err);
        this.isConnecting = false;
      };
    } catch (e) {
      console.warn('[TRIBO SYNC] Falha crítica ao iniciar conexão socket:', e);
      this.isConnecting = false;
      this.scheduleReconnect();
    }
  }

  /**
   * Envia uma mensagem estruturada ao servidor.
   */
  static send(messageObj: { type: string; payload?: any }) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(messageObj));
      return true;
    }
    return false;
  }

  /**
   * Agenda tentativa de reconexão automática caso o sinal caia.
   */
  private static scheduleReconnect() {
    if (this.reconnectTimer) return;
    
    console.log('[TRIBO SYNC] Agendando reconexão em 5 segundos...');
    this.reconnectTimer = setInterval(() => {
      if (this.userId) {
        this.connect(this.userId);
      }
    }, 5000);
  }

  /**
   * Envia a base local completa para unificação com outros aparelhos na internet.
   */
  private static performInitialSync() {
    // Carregar todas as chaves do banco local
    const users = UserDatabase.getUsers();
    const posts = UserDatabase.getPosts();
    const stories = UserDatabase.getStories();
    const messages = UserDatabase.getMessages();
    const conversations = UserDatabase.getConversationsList();
    const products = UserDatabase.getProducts();
    const communities = UserDatabase.getCommunities();
    const sharedLocations = UserDatabase.getSharedLocations();

    console.log('[TRIBO SYNC] Enviando banco de dados local para fusão e sincronização inicial...');

    this.send({
      type: 'init_sync',
      payload: {
        users,
        posts,
        stories,
        messages,
        conversations,
        products,
        communities,
        sharedLocations
      }
    });
  }

  /**
   * Processa mensagens recebidas do servidor de sincronismo da internet.
   */
  private static handleIncomingMessage(msg: { type: string; payload?: any }) {
    const { type, payload } = msg;

    switch (type) {
      case 'registered':
        console.log('[TRIBO SYNC] Registro de aparelho confirmado pelo servidor central.');
        break;

      case 'sync_response':
      case 'global_sync_update': {
        console.log('[TRIBO SYNC] Base de dados de internet recebida. Atualizando tabelas locais...');
        const syncState = payload;

        if (syncState) {
          // Gravar dados consolidados de volta ao localStorage
          if (syncState.users) localStorage.setItem('tribo_users_v4', JSON.stringify(syncState.users));
          if (syncState.posts) localStorage.setItem('tribo_posts_v4', JSON.stringify(syncState.posts));
          if (syncState.stories) localStorage.setItem('tribo_stories_v4', JSON.stringify(syncState.stories));
          if (syncState.messages) localStorage.setItem('tribo_msgs_v4', JSON.stringify(syncState.messages));
          if (syncState.conversations) localStorage.setItem('tribo_convs_v4', JSON.stringify(syncState.conversations));
          if (syncState.products) localStorage.setItem('tribo_products_v4', JSON.stringify(syncState.products));
          if (syncState.communities) localStorage.setItem('tribo_communities_v4', JSON.stringify(syncState.communities));
          if (syncState.sharedLocations) localStorage.setItem('tribo_shared_locations_v4', JSON.stringify(syncState.sharedLocations));
          
          this.triggerCallbacks();
        }
        break;
      }

      case 'mutation_broadcast': {
        const { collection, item, action, senderId } = payload;
        console.log(`[TRIBO SYNC] Mutação recebida da rede: ${action} na coleção ${collection}`);

        const getLocalStorageKey = (col: string) => {
          if (col === 'sharedLocations') return 'tribo_shared_locations_v4';
          if (col === 'conversations') return 'tribo_convs_v4';
          if (col === 'messages') return 'tribo_msgs_v4';
          return `tribo_${col}_v4`;
        };
        const localKey = getLocalStorageKey(collection);
        const localDataRaw = localStorage.getItem(localKey);
        let localArray: any[] = localDataRaw ? JSON.parse(localDataRaw) : [];

        if (action === 'create' || action === 'update') {
          const idx = localArray.findIndex((i: any) => i.id === item.id);
          if (idx !== -1) {
            localArray[idx] = { ...localArray[idx], ...item };
          } else {
            localArray.push(item);
          }
        } else if (action === 'delete') {
          localArray = localArray.filter((i: any) => i.id !== item.id);
        }

        localStorage.setItem(localKey, JSON.stringify(localArray));
        this.triggerCallbacks();
        break;
      }

      case 'direct_message_received': {
        const { message, conversation, senderId } = payload;
        console.log(`[TRIBO SYNC] Nova mensagem de bate-papo recebida de: ${senderId}`);

        // Salvar mensagem localmente
        const msgs = UserDatabase.getMessages();
        if (!msgs.find((m: any) => m.id === message.id)) {
          msgs.push(message);
          localStorage.setItem('tribo_msgs_v4', JSON.stringify(msgs));
        }

        // Salvar conversa localmente
        const convs = UserDatabase.getConversationsList();
        const convIdx = convs.findIndex((c: any) => c.id === conversation.id);
        if (convIdx !== -1) {
          convs[convIdx] = conversation;
        } else {
          convs.push(conversation);
        }
        localStorage.setItem('tribo_convs_v4', JSON.stringify(convs));

        // Acionar callbacks para atualização em tempo real na tela de Chat
        this.triggerCallbacks();

        // Se o usuário não estiver com o documento em foco ou estiver com o aplicativo minimizado, emitir Alerta push / SW!
        if (document.hidden || !document.hasFocus()) {
          const senderUser = UserDatabase.findById(senderId);
          const senderName = senderUser ? senderUser.name : 'Outro Membro';
          
          if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            // Mandar para o Service Worker lidar em segundo plano
            navigator.serviceWorker.controller.postMessage({
              action: 'schedule-notification',
              title: `Mensagem de ${senderName} 💬`,
              body: message.conteudo || 'Enviou uma mídia na Tribo',
              delay: 0,
              icon: senderUser?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=tribo'
            });
          } else if (Notification.permission === 'granted') {
            // Fallback nativo
            new Notification(`Mensagem de ${senderName} 💬`, {
              body: message.conteudo || 'Enviou uma mídia na Tribo',
              icon: senderUser?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=tribo'
            });
          }
        }
        break;
      }
    }
  }

  /**
   * Notifica a rede inteira sobre uma criação, edição ou exclusão local de dados.
   */
  static notifyMutation(collection: string, item: any, action: 'create' | 'update' | 'delete') {
    return this.send({
      type: 'mutation',
      payload: { collection, item, action }
    });
  }

  /**
   * Envia uma mensagem direta e sincroniza com o destinatário sobre a internet em tempo real.
   */
  static notifyDM(recipientId: string, message: any, conversation: any) {
    return this.send({
      type: 'direct_message',
      payload: { recipientId, message, conversation }
    });
  }

  /**
   * Desconecta o socket atual.
   */
  static disconnect() {
    if (this.reconnectTimer) {
      clearInterval(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.socket) {
      this.socket.onclose = null;
      this.socket.close();
      this.socket = null;
    }
    this.userId = null;
    this.isConnecting = false;
    console.log('[TRIBO SYNC] Desconectado do servidor de internet.');
  }
}

// Vincular os gatilhos do Banco de Dados para envio automático à Internet
UserDatabase.onMutation = (collection, item, action) => {
  SyncClient.notifyMutation(collection, item, action);
};
UserDatabase.onDM = (recipientId, message, conversation) => {
  SyncClient.notifyDM(recipientId, message, conversation);
};

