import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { WebSocketServer, WebSocket } from "ws";
import http from "http";

// Tipagens do Servidor (simplificadas para o sincronismo)
interface SyncState {
  users: any[];
  posts: any[];
  stories: any[];
  messages: any[];
  conversations: any[];
  products: any[];
  communities: any[];
  sharedLocations: any[];
}

// Banco de dados central em memória (Relay de Internet da TRIBO)
const centralDb: SyncState = {
  users: [],
  posts: [],
  stories: [],
  messages: [],
  conversations: [],
  products: [],
  communities: [],
  sharedLocations: []
};

// Mapa para rastrear conexões ativas por ID de Usuário
const connectedClients = new Map<string, WebSocket>();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Parser JSON para endpoints de API se necessário
  app.use(express.json());

  // Endpoints da API REST para conferência ou depuração
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", clientsConnected: connectedClients.size });
  });

  app.get("/api/state", (req, res) => {
    res.json({
      usersCount: centralDb.users.length,
      postsCount: centralDb.posts.length,
      messagesCount: centralDb.messages.length,
      productsCount: centralDb.products.length,
      communitiesCount: centralDb.communities.length
    });
  });

  // Criar o servidor HTTP
  const server = http.createServer(app);

  // Criar o servidor WebSocket acoplado ao servidor HTTP (compartilhando a porta 3000)
  const wss = new WebSocketServer({ server, path: "/ws" });

  // Funções Auxiliares para Sincronismo & Resolução de Conflitos
  function mergeArraysById(serverArr: any[], clientArr: any[]): any[] {
    const map = new Map();
    // Inserir primeiro os do servidor
    serverArr.forEach(item => {
      if (item && item.id) map.set(item.id, item);
    });
    // Mesclar os do cliente (se o cliente tiver versão mais atualizada ou itens novos)
    clientArr.forEach(item => {
      if (item && item.id) {
        if (!map.has(item.id)) {
          map.set(item.id, item);
        } else {
          // Resolução simples de conflitos (última atualização ganha com base em carimbo de data/hora se existir)
          const existing = map.get(item.id);
          const existingTime = existing.timestamp || existing.createdAt || existing.data_envio || 0;
          const incomingTime = item.timestamp || item.createdAt || item.data_envio || 0;
          if (incomingTime > existingTime) {
            map.set(item.id, { ...existing, ...item });
          }
        }
      }
    });
    return Array.from(map.values());
  }

  // Gerenciamento de conexões dos aparelhos
  wss.on("connection", (ws) => {
    let authenticatedUserId: string | null = null;

    ws.on("message", (rawMessage) => {
      try {
        const data = JSON.parse(rawMessage.toString());
        const { type, payload } = data;

        switch (type) {
          case "register": {
            // Um aparelho se registra informando o ID do usuário conectado nele
            const userId = payload.userId;
            if (userId) {
              authenticatedUserId = userId;
              connectedClients.set(userId, ws);
              console.log(`[TRIBO INTERNET] Aparelho registrado para o Usuário: ${userId}`);
              
              // Confirmar registro
              ws.send(JSON.stringify({
                type: "registered",
                payload: { userId, activeUsers: Array.from(connectedClients.keys()) }
              }));

              // Notificar outros sobre a presença online deste aparelho
              broadcastToOthers(userId, {
                type: "user_presence",
                payload: { userId, status: "online" }
              });
            }
            break;
          }

          case "init_sync": {
            // O aparelho acabou de conectar e enviou seu banco de dados local para fusão na nuvem
            if (!authenticatedUserId) {
              ws.send(JSON.stringify({ type: "error", payload: "Registre-se primeiro usando o tipo 'register'" }));
              break;
            }

            console.log(`[TRIBO INTERNET] Iniciando fusão de dados enviada por ${authenticatedUserId}`);
            
            const clientState: SyncState = payload;

            // Fusão de coleções
            centralDb.users = mergeArraysById(centralDb.users, clientState.users || []);
            centralDb.posts = mergeArraysById(centralDb.posts, clientState.posts || []);
            centralDb.stories = mergeArraysById(centralDb.stories, clientState.stories || []);
            centralDb.messages = mergeArraysById(centralDb.messages, clientState.messages || []);
            centralDb.conversations = mergeArraysById(centralDb.conversations, clientState.conversations || []);
            centralDb.products = mergeArraysById(centralDb.products, clientState.products || []);
            centralDb.communities = mergeArraysById(centralDb.communities, clientState.communities || []);
            centralDb.sharedLocations = mergeArraysById(centralDb.sharedLocations, clientState.sharedLocations || []);

            // Enviar banco de dados consolidado de volta para sincronizar o aparelho
            ws.send(JSON.stringify({
              type: "sync_response",
              payload: centralDb
            }));

            // Notificar outros dispositivos que novos dados estão disponíveis
            broadcastToOthers(authenticatedUserId, {
              type: "global_sync_update",
              payload: centralDb
            });
            break;
          }

          case "mutation": {
            // O aparelho realizou uma ação (postou, comentou, curtiu, comprou, plantou, etc.)
            if (!authenticatedUserId) break;

            const { collection, item, action } = payload;
            console.log(`[TRIBO MUTATION] ${authenticatedUserId} realizou ${action} na coleção ${collection}`);

            const targetArray = (centralDb as any)[collection];
            if (targetArray) {
              if (action === "create" || action === "update") {
                const idx = targetArray.findIndex((i: any) => i.id === item.id);
                if (idx !== -1) {
                  targetArray[idx] = { ...targetArray[idx], ...item };
                } else {
                  targetArray.push(item);
                }
              } else if (action === "delete") {
                const idx = targetArray.findIndex((i: any) => i.id === item.id);
                if (idx !== -1) {
                  targetArray.splice(idx, 1);
                }
              }

              // Retransmitir a mutação em tempo real para todos os outros aparelhos na internet
              broadcastToOthers(authenticatedUserId, {
                type: "mutation_broadcast",
                payload: { collection, item, action, senderId: authenticatedUserId }
              });
            }
            break;
          }

          case "direct_message": {
            // Encaminhamento rápido de mensagem privada direta
            if (!authenticatedUserId) break;

            const { recipientId, message, conversation } = payload;
            console.log(`[TRIBO DM] Mensagem de ${authenticatedUserId} para ${recipientId}`);

            // Adicionar ao banco central
            const msgIdx = centralDb.messages.findIndex(m => m.id === message.id);
            if (msgIdx === -1) centralDb.messages.push(message);

            const convIdx = centralDb.conversations.findIndex(c => c.id === conversation.id);
            if (convIdx !== -1) {
              centralDb.conversations[convIdx] = conversation;
            } else {
              centralDb.conversations.push(conversation);
            }

            // Se o destinatário estiver online via internet, enviar em tempo real
            const recipientSocket = connectedClients.get(recipientId);
            if (recipientSocket && recipientSocket.readyState === WebSocket.OPEN) {
              recipientSocket.send(JSON.stringify({
                type: "direct_message_received",
                payload: { message, conversation, senderId: authenticatedUserId }
              }));
            }
            break;
          }

          case "ping": {
            ws.send(JSON.stringify({ type: "pong" }));
            break;
          }
        }
      } catch (err) {
        console.error("[TRIBO WS ERROR] Falha ao processar mensagem:", err);
      }
    });

    ws.on("close", () => {
      if (authenticatedUserId) {
        connectedClients.delete(authenticatedUserId);
        console.log(`[TRIBO INTERNET] Aparelho desconectado: ${authenticatedUserId}`);
        
        // Notificar outros sobre offline
        broadcastToOthers(authenticatedUserId, {
          type: "user_presence",
          payload: { userId: authenticatedUserId, status: "offline" }
        });
      }
    });
  });

  // Função para transmitir para todos os aparelhos ativos exceto o remetente
  function broadcastToOthers(senderId: string, messageObj: any) {
    const serialized = JSON.stringify(messageObj);
    connectedClients.forEach((clientWs, userId) => {
      if (userId !== senderId && clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(serialized);
      }
    });
  }

  // Configuração do Vite middleware para desenvolvimento, ou arquivos estáticos para produção
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Escutar na porta 3000 e no host 0.0.0.0 (obrigatório para containers da nuvem)
  server.listen(PORT, "0.0.0.0", () => {
    console.log(`[TRIBO INTERNET SERVER] Servidor central operando em http://0.0.0.0:${PORT}`);
  });
}

startServer();
