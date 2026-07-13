
import { User, IdentityType, UserPlan, AppNotification, Post, Comment, Story, UserStatus, Message, Conversation, Participant, Product, Community, AgroGameState, MarketPrice, PlotStatus, SharedLocation } from '../types';


const USERS_KEY = 'tribo_users_v4';
const AGRO_KEY_PREFIX = 'tribo_agro_v4_';
const POSTS_KEY = 'tribo_posts_v4';
const STORIES_KEY = 'tribo_stories_v4';
const NOTIFICATIONS_KEY_PREFIX = 'tribo_notifs_v4_';
const CONVERSATIONS_KEY = 'tribo_convs_v4';
const MESSAGES_KEY = 'tribo_msgs_v4';
const PRODUCTS_KEY = 'tribo_products_v4';
const COMMUNITIES_KEY = 'tribo_communities_v4';
const SHARED_LOCATIONS_KEY = 'tribo_shared_locations_v4';

if (typeof window !== 'undefined' && !localStorage.getItem('tribo_v5_dynamic_founder_clean')) {
  localStorage.clear();
  localStorage.setItem('tribo_seeded', 'true');
  localStorage.setItem('tribo_v5_dynamic_founder_clean', 'true');
}


export class UserDatabase {
  private static isSeeding = false;
  static onMutation?: (collection: string, item: any, action: 'create' | 'update' | 'delete') => void;
  static onDM?: (recipientId: string, message: any, conversation: any) => void;

  static getUsers(): User[] {
    const data = localStorage.getItem(USERS_KEY);
    return data ? JSON.parse(data) : [];
  }

  static getFounder(): User | undefined {
    const users = this.getUsers();
    return users.find(u => u.isFounder) || users[0];
  }

  static findById(id: string): User | undefined {
    return this.getUsers().find(u => u.id === id);
  }

  static triggerSystemNotification(title: string, body: string, icon?: string) {
    if (!("Notification" in window)) return;
    const isEnabled = localStorage.getItem('tribo_push_enabled') === 'true';
    if (Notification.permission === "granted" && isEnabled) {
      new Notification(title, {
        body: body,
        icon: icon || 'https://api.dicebear.com/7.x/avataaars/svg?seed=tribo',
        badge: 'https://api.dicebear.com/7.x/avataaars/svg?seed=tribo'
      });
    }
  }

  static authenticate(emailOrUsername: string, password?: string): User | null {
    const users = this.getUsers();
    return users.find(u => 
      (u.email === emailOrUsername || u.username === emailOrUsername) && 
      u.password === password
    ) || null;
  }

  static saveUser(userData: Partial<User>): User {
    const users = this.getUsers();
    const isFirstUser = users.length === 0;

    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      name: userData.name || '',
      username: userData.username || '',
      email: userData.email || '',
      password: userData.password,
      age: userData.age || 0,
      birthDate: userData.birthDate || '',
      gender: userData.gender as any,
      identityType: userData.identityType || IdentityType.REAL,
      reputation: isFirstUser ? 10000 : 0,
      level: isFirstUser ? 99 : 1,
      xp: isFirstUser ? 999 : 0,
      verified: isFirstUser ? true : false,
      plan: isFirstUser ? UserPlan.PREMIUM : UserPlan.FREE,
      bio: userData.bio || (isFirstUser ? 'Fundador & Administrador da TRIBO.' : 'Membro da TRIBO.'),
      avatar: userData.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.username || 'default'}`,
      location: userData.location || 'Brasil',
      friends: [],
      bookmarks: [],
      joinedCommunities: [],
      friendRequests: [],
      wishlist: [],
      privacy: { isPublic: true, showLocation: true, allowStrangersMsg: true, showOnlineStatus: true, incognitoMode: false },
      pushNotificationsEnabled: true,
      status: UserStatus.ONLINE,
      ultima_atividade: Date.now(),
      isFounder: isFirstUser,
      occupation: isFirstUser ? 'Fundador & Administrador' : (userData.occupation || 'Membro da Tribo'),
      ...userData
    };

    if (isFirstUser) {
      users.push(newUser);
      localStorage.setItem(USERS_KEY, JSON.stringify(users));

      // Criar a primeira postagem do fundador
      const welcomePost: Post = {
        id: 'welcome_post_founder',
        authorId: newUser.id,
        authorName: newUser.name,
        authorAvatar: newUser.avatar,
        authorIdentity: newUser.identityType,
        type: 'text',
        content: `Bem-vindos à TRIBO! 🚀 Esta rede social foi construída para dar às pessoas o controle total sobre sua vida digital, privacidade e livre expressão. Sinta-se livre para debater, plantar na nossa roça virtual e impulsionar nossa economia circular!`,
        timestamp: new Date().toISOString(),
        likes: 0,
        likedBy: [],
        lovedBy: [],
        comments: []
      };
      this.savePost(welcomePost);

      // Criar comunidades padrão com o fundador como dono
      const defaultComms: Community[] = [
        {
          id: 'comm_soberania',
          name: 'Soberania & Tecnologia',
          description: 'Espaço para discussão de redes distribuídas, auto-hospedagem, privacidade e software livre.',
          category: 'Tecnologia',
          icon: '🛡️',
          ownerId: newUser.id,
          members: [newUser.id],
          ranking: 100,
          isPrivate: false,
          isPremium: false,
          createdAt: Date.now()
        },
        {
          id: 'comm_agro_sintropia',
          name: 'Agroecologia Sintrópica',
          description: 'Compartilhando saberes práticos de agricultura natural, sementes crioulas e plantio de florestas.',
          category: 'Agricultura',
          icon: '🌱',
          ownerId: newUser.id,
          members: [newUser.id],
          ranking: 90,
          isPrivate: false,
          isPremium: false,
          createdAt: Date.now()
        }
      ];
      localStorage.setItem(COMMUNITIES_KEY, JSON.stringify(defaultComms));

      // Inicializar alguns produtos de demonstração do fundador
      const defaultProducts: Product[] = [
        {
          id: 'prod_sementes_001',
          name: 'Sementes de Milho Crioulas Orgânicas',
          price: 15.0,
          location: newUser.location || 'Brasil',
          category: 'Agro & Sementes',
          image: 'https://images.unsplash.com/photo-1551649001-c864c8785716?w=400&h=400&fit=crop',
          sellerId: newUser.id,
          sellerName: newUser.name,
          status: 'active',
          condition: 'Novo',
          description: 'Sementes crioulas limpas, ideais para cultivo no modo de sintropia ou roça urbana. Alta taxa de germinação.',
          views: 31,
          createdAt: Date.now()
        },
        {
          id: 'prod_livro_001',
          name: 'Manual Prático de Auto-Suficiência',
          price: 45.0,
          location: newUser.location || 'Brasil',
          category: 'Livros & Guias',
          image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=400&fit=crop',
          sellerId: newUser.id,
          sellerName: newUser.name,
          status: 'active',
          condition: 'Novo',
          description: 'Guia definitivo de soberania física e alimentar: plantio, bio-construção, filtragem de águas e redes off-grid.',
          views: 104,
          createdAt: Date.now()
        }
      ];
      localStorage.setItem(PRODUCTS_KEY, JSON.stringify(defaultProducts));

    } else {
      const founder = this.getFounder();
      if (founder) {
        newUser.friends = [founder.id];

        // Adicionar o novo usuário aos amigos do fundador
        const updatedUsers = users.map(u => {
          if (u.id === founder.id) {
            if (!u.friends.includes(newUser.id)) {
              u.friends.push(newUser.id);
            }
          }
          return u;
        });

        updatedUsers.push(newUser);
        localStorage.setItem(USERS_KEY, JSON.stringify(updatedUsers));

        // Criar conversa e mensagem de boas-vindas do fundador
        const convId = `conv_${founder.id}_${newUser.id}`;
        const convs: Conversation[] = JSON.parse(localStorage.getItem(CONVERSATIONS_KEY) || '[]');
        if (!convs.find(c => c.id === convId)) {
          convs.push({
            id: convId,
            participantes: [{ user_id: founder.id }, { user_id: newUser.id }],
            lastMessage: `Bem-vindo à TRIBO, ${newUser.name}!`
          });
          localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(convs));
        }

        const welcomeMsg: Message = {
          id: Math.random().toString(36).substr(2, 9),
          conversa_id: convId,
          remetente_id: founder.id,
          tipo: 'texto',
          conteudo: `Bem-vindo(a) à TRIBO, ${newUser.name}! Como fundador e administrador deste espaço soberano, é um prazer imenso ter você conosco. Sinta-se livre para debater ideias, plantar em sua roça virtual e interagir no Mercado livre de censura! 🚀`,
          data_envio: Date.now(),
          lida: false,
          editada: false
        };

        const msgs: Message[] = JSON.parse(localStorage.getItem(MESSAGES_KEY) || '[]');
        msgs.push(welcomeMsg);
        localStorage.setItem(MESSAGES_KEY, JSON.stringify(msgs));
      } else {
        users.push(newUser);
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
      }
    }

    if (this.onMutation) {
      this.onMutation('users', newUser, 'create');
    }

    return newUser;
  }

  static updateUser(user: User) {
    const users = this.getUsers();
    const index = users.findIndex(u => u.id === user.id);
    if (index !== -1) {
      users[index] = { ...user, ultima_atividade: Date.now() };
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
      if (user.pushNotificationsEnabled !== undefined) {
         localStorage.setItem('tribo_push_enabled', user.pushNotificationsEnabled ? 'true' : 'false');
      }
      if (this.onMutation) {
        this.onMutation('users', users[index], 'update');
      }
    }
  }

  static sendFriendRequest(fromId: string, toId: string): boolean {
    const users = this.getUsers();
    const targetIdx = users.findIndex(u => u.id === toId);
    const senderIdx = users.findIndex(u => u.id === fromId);
    if (targetIdx === -1 || senderIdx === -1) return false;
    if (users[targetIdx].friendRequests.some(r => r.fromId === fromId)) return false;
    if (users[senderIdx].friendRequests.some(r => r.fromId === toId)) {
      this.acceptFriendRequest(fromId, toId);
      return true;
    }
    users[targetIdx].friendRequests.push({ fromId, timestamp: new Date().toISOString() });
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    const notif: AppNotification = {
      id: Math.random().toString(36).substr(2, 9),
      message: `${users[senderIdx].name} enviou um pedido de conexão.`,
      senderAvatar: users[senderIdx].avatar,
      timestamp: 'Agora',
      read: false
    };
    this.addNotification(toId, notif);
    this.triggerSystemNotification("Novo Pedido de Conexão", `${users[senderIdx].name} quer se conectar com você na TRIBO.`, users[senderIdx].avatar);
    return true;
  }

  static addNotification(userId: string, notif: AppNotification) {
    const key = NOTIFICATIONS_KEY_PREFIX + userId;
    const notifs = JSON.parse(localStorage.getItem(key) || '[]');
    notifs.unshift(notif);
    localStorage.setItem(key, JSON.stringify(notifs.slice(0, 50)));
  }

  static acceptFriendRequest(userId: string, fromId: string): void {
    const users = this.getUsers();
    const userIdx = users.findIndex(u => u.id === userId);
    const senderIdx = users.findIndex(u => u.id === fromId);
    if (userIdx !== -1 && senderIdx !== -1) {
      users[userIdx].friendRequests = users[userIdx].friendRequests.filter(r => r.fromId !== fromId);
      if (!users[userIdx].friends.includes(fromId)) users[userIdx].friends.push(fromId);
      if (!users[senderIdx].friends.includes(userId)) users[senderIdx].friends.push(userId);
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
      this.triggerSystemNotification("Conexão Aceita", `Agora você e ${users[userIdx].name} são aliados na TRIBO!`, users[userIdx].avatar);
    }
  }

  static cancelFriendRequest(fromId: string, toId: string): void {
    const users = this.getUsers();
    const targetIdx = users.findIndex(u => u.id === toId);
    if (targetIdx !== -1) {
      users[targetIdx].friendRequests = users[targetIdx].friendRequests.filter(r => r.fromId !== fromId);
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
    }
  }

  static removeFriend(userId: string, targetId: string): void {
    const users = this.getUsers();
    const uIdx = users.findIndex(u => u.id === userId);
    const tIdx = users.findIndex(u => u.id === targetId);
    if (uIdx !== -1 && tIdx !== -1) {
      users[uIdx].friends = users[uIdx].friends.filter(id => id !== targetId);
      users[tIdx].friends = users[tIdx].friends.filter(id => id !== userId);
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
    }
  }

  static hasSentRequest(fromId: string, toId: string): boolean {
    const users = this.getUsers();
    const target = users.find(u => u.id === toId);
    return !!target?.friendRequests.some(r => r.fromId === fromId);
  }

  static savePost(post: Post): void {
    const posts: Post[] = JSON.parse(localStorage.getItem(POSTS_KEY) || '[]');
    posts.unshift(post);
    localStorage.setItem(POSTS_KEY, JSON.stringify(posts));
    if (this.onMutation) {
      this.onMutation('posts', post, 'create');
    }
  }

  static reactToPost(postId: string, userId: string): void {
    const posts: Post[] = JSON.parse(localStorage.getItem(POSTS_KEY) || '[]');
    const postIndex = posts.findIndex(p => p.id === postId);
    if (postIndex !== -1) {
      if (!posts[postIndex].likedBy) posts[postIndex].likedBy = [];
      const userIdx = posts[postIndex].likedBy.indexOf(userId);
      if (userIdx === -1) posts[postIndex].likedBy.push(userId);
      else posts[postIndex].likedBy.splice(userIdx, 1);
      posts[postIndex].likes = posts[postIndex].likedBy.length;
      localStorage.setItem(POSTS_KEY, JSON.stringify(posts));
      if (this.onMutation) {
        this.onMutation('posts', posts[postIndex], 'update');
      }
    }
  }

  static addComment(postId: string, comment: Comment): void {
    const posts: Post[] = JSON.parse(localStorage.getItem(POSTS_KEY) || '[]');
    const postIndex = posts.findIndex(p => p.id === postId);
    if (postIndex !== -1) {
      if (!posts[postIndex].comments) posts[postIndex].comments = [];
      posts[postIndex].comments.push(comment);
      localStorage.setItem(POSTS_KEY, JSON.stringify(posts));
      this.triggerSystemNotification("Novo Comentário", `${comment.authorName} comentou em uma postagem.`, comment.authorAvatar);
      if (this.onMutation) {
        this.onMutation('posts', posts[postIndex], 'update');
      }
    }
  }

  static reactToComment(postId: string, commentId: string, userId: string): void {
    const posts: Post[] = JSON.parse(localStorage.getItem(POSTS_KEY) || '[]');
    const postIndex = posts.findIndex(p => p.id === postId);
    if (postIndex === -1) return;
    const findAndReact = (comments: Comment[]): boolean => {
      for (const comment of comments) {
        if (comment.id === commentId) {
          if (!comment.likedBy) comment.likedBy = [];
          const idx = comment.likedBy.indexOf(userId);
          if (idx === -1) comment.likedBy.push(userId);
          else comment.likedBy.splice(idx, 1);
          return true;
        }
        if (comment.replies && findAndReact(comment.replies)) return true;
      }
      return false;
    };
    if (findAndReact(posts[postIndex].comments)) {
      localStorage.setItem(POSTS_KEY, JSON.stringify(posts));
      if (this.onMutation) {
        this.onMutation('posts', posts[postIndex], 'update');
      }
    }
  }

  static addReplyToComment(postId: string, parentCommentId: string, reply: Comment): void {
    const posts: Post[] = JSON.parse(localStorage.getItem(POSTS_KEY) || '[]');
    const postIndex = posts.findIndex(p => p.id === postId);
    if (postIndex === -1) return;
    const findAndReply = (comments: Comment[]): boolean => {
      for (const comment of comments) {
        if (comment.id === parentCommentId) {
          if (!comment.replies) comment.replies = [];
          comment.replies.push(reply);
          return true;
        }
        if (comment.replies && findAndReply(comment.replies)) return true;
      }
      return false;
    };
    if (findAndReply(posts[postIndex].comments)) {
      localStorage.setItem(POSTS_KEY, JSON.stringify(posts));
      this.triggerSystemNotification("Resposta ao seu comentário", `${reply.authorName} respondeu a você na TRIBO.`, reply.authorAvatar);
      if (this.onMutation) {
        this.onMutation('posts', posts[postIndex], 'update');
      }
    }
  }

  static getFeed(userId: string, mode: 'global' | 'tribo'): Post[] {
    let posts: Post[] = JSON.parse(localStorage.getItem(POSTS_KEY) || '[]');
    
    // Garantir que exista pelo menos um post de boas-vindas do fundador para novos usuários
    if (posts.length === 0) {
      const founder = this.getFounder();
      if (founder) {
        const welcomePost: Post = {
          id: 'welcome-001',
          authorId: founder.id,
          authorName: founder.name,
          authorAvatar: founder.avatar,
          authorIdentity: founder.identityType,
          type: 'text',
          content: 'Bem-vindos à TRIBO! 🚀 Esta é a nossa rede social livre, focada em soberania digital e conexões reais. Sinta-se em casa, explore as comunidades e comece a construir sua história aqui.',
          timestamp: new Date().toISOString(),
          likes: 1,
          likedBy: [founder.id],
          lovedBy: [],
          comments: []
        };
        posts = [welcomePost];
        localStorage.setItem(POSTS_KEY, JSON.stringify(posts));
      }
    }

    let filteredPosts = posts;

    if (mode === 'tribo') {
      const user = this.findById(userId);
      const founder = this.getFounder();
      if (user) {
        filteredPosts = posts.filter(p => 
          user.friends.includes(p.authorId) || 
          p.authorId === userId || 
          (founder && p.authorId === founder.id) ||
          (p.communityId && user.joinedCommunities.includes(p.communityId))
        );
      }
    }

    // Filtro de Privacidade: Palavras-chave bloqueadas
    const user = this.findById(userId);
    if (user && user.privacy && user.privacy.blockedKeywords && user.privacy.blockedKeywords.length > 0) {
      const keywords = user.privacy.blockedKeywords.map(k => k.trim().toLowerCase()).filter(Boolean);
      if (keywords.length > 0) {
        filteredPosts = filteredPosts.filter(p => {
          if (!p.content) return true;
          const contentLower = p.content.toLowerCase();
          return !keywords.some(kw => contentLower.includes(kw));
        });
      }
    }

    return filteredPosts;
  }

  static getStories(): Story[] {
    const stories: Story[] = JSON.parse(localStorage.getItem(STORIES_KEY) || '[]');
    const now = Date.now();
    return stories.filter(s => now - s.timestamp < 24 * 60 * 60 * 1000);
  }

  static saveStory(story: Story): void {
    const stories = this.getStories();
    stories.unshift(story);
    localStorage.setItem(STORIES_KEY, JSON.stringify(stories));
    if (this.onMutation) {
      this.onMutation('stories', story, 'create');
    }
  }

  static getNotifications(userId: string): AppNotification[] {
    return JSON.parse(localStorage.getItem(NOTIFICATIONS_KEY_PREFIX + userId) || '[]');
  }

  static uploadFile(file: File): Promise<string> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });
  }

  static searchUsers(term: string, excludeId: string): User[] {
    const lower = term.toLowerCase();
    return this.getUsers().filter(u => u.id !== excludeId && (u.name.toLowerCase().includes(lower) || u.username.toLowerCase().includes(lower)));
  }

  static getMessages(): Message[] {
    return JSON.parse(localStorage.getItem(MESSAGES_KEY) || '[]');
  }

  static getConversationsList(): Conversation[] {
    return JSON.parse(localStorage.getItem(CONVERSATIONS_KEY) || '[]');
  }

  static getConversations(userId: string): Conversation[] {
    const convs = this.getConversationsList();
    return convs.filter(c => c.participantes.some(p => p.user_id === userId));
  }

  static markMessagesAsRead(convId: string, userId: string): void {
    const msgs: Message[] = JSON.parse(localStorage.getItem(MESSAGES_KEY) || '[]');
    let updated = false;
    msgs.forEach(m => {
      if (m.conversa_id === convId && m.remetente_id !== userId && !m.lida) {
        m.lida = true;
        updated = true;
      }
    });
    if (updated) localStorage.setItem(MESSAGES_KEY, JSON.stringify(msgs));
  }

  static getMessagesPaginated(convId: string, limit: number): { messages: Message[], hasMore: boolean } {
    const msgs: Message[] = JSON.parse(localStorage.getItem(MESSAGES_KEY) || '[]');
    const filtered = msgs.filter(m => m.conversa_id === convId).sort((a, b) => a.data_envio - b.data_envio);
    return { messages: filtered.slice(-limit), hasMore: filtered.length > limit };
  }

  static sendMessage(msg: Message): void {
    const msgs: Message[] = JSON.parse(localStorage.getItem(MESSAGES_KEY) || '[]');
    msgs.push(msg);
    localStorage.setItem(MESSAGES_KEY, JSON.stringify(msgs));
    const convs: Conversation[] = JSON.parse(localStorage.getItem(CONVERSATIONS_KEY) || '[]');
    const cIdx = convs.findIndex(c => c.id === msg.conversa_id);
    if (cIdx !== -1) {
      convs[cIdx].lastMessage = msg.conteudo;
      localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(convs));
      const sender = this.findById(msg.remetente_id);
      this.triggerSystemNotification(`Mensagem de ${sender?.name}`, msg.tipo === 'texto' ? msg.conteudo : `Enviou uma ${msg.tipo}`, sender?.avatar);
      
      if (this.onDM) {
        const recipient = convs[cIdx].participantes.find(p => p.user_id !== msg.remetente_id);
        if (recipient) {
          this.onDM(recipient.user_id, msg, convs[cIdx]);
        }
      }
    }
  }

  static getAgroState(userId: string): AgroGameState {
    const data = localStorage.getItem(AGRO_KEY_PREFIX + userId);
    return data ? JSON.parse(data) : {
      credits: 5000,
      level: 1,
      xp: 0,
      water: 1000,
      wellLevel: 0,
      plots: Array(18).fill(null).map((_, i) => ({ id: i, cropId: null, plantedAt: null, status: i < 6 ? 'empty' : 'locked', quality: 1.0 })),
      pens: Array(9).fill(null).map((_, i) => ({ id: i, animalId: null, startedAt: null, status: i < 3 ? 'empty' : 'locked' })),
      inventory: {},
      lastCheck: Date.now(),
      unlockedMachines: []
    };
  }

  static saveAgroState(userId: string, state: AgroGameState): void {
    localStorage.setItem(AGRO_KEY_PREFIX + userId, JSON.stringify(state));
  }

  static getProducts(): Product[] {
    return JSON.parse(localStorage.getItem(PRODUCTS_KEY) || '[]');
  }

  static saveProduct(p: Product): void {
    const products = this.getProducts();
    products.unshift(p);
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
    if (this.onMutation) {
      this.onMutation('products', p, 'create');
    }
  }

  static incrementProductViews(id: string): void {
    const products = this.getProducts();
    const idx = products.findIndex(p => p.id === id);
    if (idx !== -1) {
      products[idx].views = (products[idx].views || 0) + 1;
      localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
    }
  }

  static updateProductStatus(id: string, status: 'active' | 'sold'): void {
    const products = this.getProducts();
    const idx = products.findIndex(p => p.id === id);
    if (idx !== -1) {
      products[idx].status = status;
      localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
      if (this.onMutation) {
        this.onMutation('products', products[idx], 'update');
      }
    }
  }

  static deleteProduct(id: string): void {
    const products = this.getProducts();
    const filtered = products.filter(p => p.id !== id);
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(filtered));
    if (this.onMutation) {
      this.onMutation('products', { id }, 'delete');
    }
  }

  static getPosts(): Post[] {
    return JSON.parse(localStorage.getItem(POSTS_KEY) || '[]');
  }

  static getPostsByAuthor(authorId: string): Post[] {
    return this.getPosts().filter(p => p.authorId === authorId);
  }

  static deletePost(id: string): void {
    const posts: Post[] = JSON.parse(localStorage.getItem(POSTS_KEY) || '[]');
    const filtered = posts.filter(p => p.id !== id);
    localStorage.setItem(POSTS_KEY, JSON.stringify(filtered));
    if (this.onMutation) {
      this.onMutation('posts', { id }, 'delete');
    }
  }

  static editPost(postId: string, newContent: string): void {
    const posts: Post[] = this.getPosts();
    const postIndex = posts.findIndex(p => p.id === postId);
    if (postIndex !== -1) {
      posts[postIndex].content = newContent;
      localStorage.setItem(POSTS_KEY, JSON.stringify(posts));
      if (this.onMutation) {
        this.onMutation('posts', posts[postIndex], 'update');
      }
    }
  }

  static deleteComment(postId: string, commentId: string): void {
    const posts: Post[] = this.getPosts();
    const postIndex = posts.findIndex(p => p.id === postId);
    if (postIndex === -1) return;

    const removeRecursive = (comments: Comment[]): Comment[] => {
      return comments
        .filter(c => c.id !== commentId)
        .map(c => {
          if (c.replies) {
            return {
              ...c,
              replies: removeRecursive(c.replies)
            };
          }
          return c;
        });
    };

    posts[postIndex].comments = removeRecursive(posts[postIndex].comments || []);
    localStorage.setItem(POSTS_KEY, JSON.stringify(posts));
    if (this.onMutation) {
      this.onMutation('posts', posts[postIndex], 'update');
    }
  }

  static editComment(postId: string, commentId: string, newContent: string): void {
    const posts: Post[] = this.getPosts();
    const postIndex = posts.findIndex(p => p.id === postId);
    if (postIndex === -1) return;

    const editRecursive = (comments: Comment[]): Comment[] => {
      return comments.map(c => {
        if (c.id === commentId) {
          return { ...c, content: newContent };
        }
        if (c.replies) {
          return {
            ...c,
            replies: editRecursive(c.replies)
          };
        }
        return c;
      });
    };

    posts[postIndex].comments = editRecursive(posts[postIndex].comments || []);
    localStorage.setItem(POSTS_KEY, JSON.stringify(posts));
    if (this.onMutation) {
      this.onMutation('posts', posts[postIndex], 'update');
    }
  }

  static deleteStory(id: string, userId?: string): void {
    const stories: Story[] = JSON.parse(localStorage.getItem(STORIES_KEY) || '[]');
    const storyToDel = stories.find(s => s.id === id);
    if (storyToDel && userId && storyToDel.userId !== userId) {
      console.warn("Tentativa não autorizada de excluir status.");
      return;
    }
    const filtered = stories.filter(s => s.id !== id);
    localStorage.setItem(STORIES_KEY, JSON.stringify(filtered));
    if (this.onMutation) {
      this.onMutation('stories', { id }, 'delete');
    }
  }

  static toggleWishlist(userId: string, productId: string): void {
    const user = this.findById(userId);
    if (user) {
      if (!user.wishlist) user.wishlist = [];
      const idx = user.wishlist.indexOf(productId);
      if (idx === -1) user.wishlist.push(productId);
      else user.wishlist.splice(idx, 1);
      this.updateUser(user);
    }
  }

  static togglePostBookmark(userId: string, postId: string): void {
    const user = this.findById(userId);
    if (user) {
      if (!user.bookmarks) user.bookmarks = [];
      const idx = user.bookmarks.indexOf(postId);
      if (idx === -1) user.bookmarks.push(postId);
      else user.bookmarks.splice(idx, 1);
      this.updateUser(user);
    }
  }

  static getCommunities(): Community[] {
    return JSON.parse(localStorage.getItem(COMMUNITIES_KEY) || '[]');
  }

  static saveCommunity(c: Community): void {
    const comms = this.getCommunities();
    comms.unshift(c);
    localStorage.setItem(COMMUNITIES_KEY, JSON.stringify(comms));
    if (this.onMutation) {
      this.onMutation('communities', c, 'create');
    }
  }

  static toggleJoinCommunity(userId: string, commId: string): void {
    const comms = this.getCommunities();
    const idx = comms.findIndex(c => c.id === commId);
    if (idx !== -1) {
      const mIdx = comms[idx].members.indexOf(userId);
      if (mIdx === -1) comms[idx].members.push(userId);
      else comms[idx].members.splice(mIdx, 1);
      localStorage.setItem(COMMUNITIES_KEY, JSON.stringify(comms));
      if (this.onMutation) {
        this.onMutation('communities', comms[idx], 'update');
      }
    }
  }

  static getSharedLocations(): SharedLocation[] {
    return JSON.parse(localStorage.getItem(SHARED_LOCATIONS_KEY) || '[]');
  }

  static saveSharedLocation(loc: SharedLocation): void {
    const locs = this.getSharedLocations();
    // Remover qualquer localização existente do mesmo usuário com o mesmo destino
    const filtered = locs.filter(l => !(l.userId === loc.userId && l.targetType === loc.targetType && l.targetId === loc.targetId));
    filtered.unshift(loc);
    localStorage.setItem(SHARED_LOCATIONS_KEY, JSON.stringify(filtered));
    if (this.onMutation) {
      this.onMutation('sharedLocations', loc, 'create');
    }
  }

  static deleteSharedLocation(id: string): void {
    const locs = this.getSharedLocations();
    const filtered = locs.filter(l => l.id !== id);
    localStorage.setItem(SHARED_LOCATIONS_KEY, JSON.stringify(filtered));
    if (this.onMutation) {
      this.onMutation('sharedLocations', { id }, 'delete');
    }
  }

  static deleteSharedLocationsForUser(userId: string): void {
    const locs = this.getSharedLocations();
    const filtered = locs.filter(l => l.userId !== userId);
    localStorage.setItem(SHARED_LOCATIONS_KEY, JSON.stringify(filtered));
  }

  static getVisibleLocationsForUser(userId: string): SharedLocation[] {
    const user = this.findById(userId);
    if (!user) return [];
    
    const locs = this.getSharedLocations();
    return locs.filter(l => {
      // Procurar configurações do dono da localização
      const owner = this.findById(l.userId);
      if (!owner) return false;
      
      // Respeitar as configurações de privacidade do modo Tribo
      if (owner.privacy.showLocation === false || owner.privacy.incognitoMode === true) {
        return false;
      }
      
      // Dono sempre vê sua própria localização compartilhada
      if (l.userId === userId) return true;
      
      if (l.targetType === 'friends') {
        // Compartilhado com amigos -> Se "user" é amigo do dono
        return owner.friends.includes(userId);
      }
      
      if (l.targetType === 'community') {
        // Compartilhado em comunidade -> Se "user" participa da comunidade
        if (!l.targetId) return false;
        return user.joinedCommunities.includes(l.targetId);
      }
      
      return false;
    });
  }

  static seedDatabase(): void {
    // Mantido limpo para permitir a criação dinâmica do fundador pelo usuário como primeiro registro
  }

  static wipeAllData(): void {
    localStorage.clear();
    localStorage.setItem('tribo_seeded', 'true');
    localStorage.setItem('tribo_v5_dynamic_founder_clean', 'true');
  }

  static bootstrapState(centralState: any) {
    if (!centralState) return;

    const mergeArrays = (localKey: string, serverArr: any[]) => {
      if (!serverArr || !Array.isArray(serverArr)) return;
      const localDataRaw = localStorage.getItem(localKey);
      const localArr: any[] = localDataRaw ? JSON.parse(localDataRaw) : [];
      
      const map = new Map();
      // Colocar itens locais primeiro
      localArr.forEach(item => {
        if (item && item.id) map.set(item.id, item);
      });

      // Mesclar itens do servidor
      serverArr.forEach(item => {
        if (item && item.id) {
          if (!map.has(item.id)) {
            map.set(item.id, item);
          } else {
            const existing = map.get(item.id);
            const getTs = (x: any) => {
              if (!x) return 0;
              const val = x.ultima_atividade || x.timestamp || x.createdAt || x.data_envio || x.date || 0;
              if (typeof val === 'number') return val;
              if (typeof val === 'string') {
                const parsed = Date.parse(val);
                return isNaN(parsed) ? 0 : parsed;
              }
              return 0;
            };
            const existingTime = getTs(existing);
            const incomingTime = getTs(item);
            if (incomingTime > existingTime) {
              map.set(item.id, { ...existing, ...item });
            }
          }
        }
      });

      localStorage.setItem(localKey, JSON.stringify(Array.from(map.values())));
    };

    mergeArrays('tribo_users_v4', centralState.users);
    mergeArrays('tribo_posts_v4', centralState.posts);
    mergeArrays('tribo_stories_v4', centralState.stories);
    mergeArrays('tribo_msgs_v4', centralState.messages);
    mergeArrays('tribo_convs_v4', centralState.conversations);
    mergeArrays('tribo_products_v4', centralState.products);
    mergeArrays('tribo_communities_v4', centralState.communities);
    mergeArrays('tribo_shared_locations_v4', centralState.sharedLocations);
  }
}

