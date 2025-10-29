<template>
  <div class="revolut-connect">
    <div v-if="!connected" class="connect-section">
      <h3>🔌 Connexion à Revolut Business</h3>
      <p>Connectez-vous à votre compte Revolut Business pour accéder à vos données en temps réel.</p>
      
      <button @click="connectWithOAuth" class="btn-connect">
        🔗 Se connecter avec Revolut
      </button>
      
      <div class="demo-mode">
        <p>Ou utilisez le <strong>mode démo</strong> pour explorer les fonctionnalités</p>
        <button @click="useDemoMode" class="btn-demo">
          🎮 Activer le mode démo
        </button>
      </div>
    </div>
    
    <div v-else class="connected-section">
      <div class="connection-status">
        <span class="status-badge connected">✅ Connecté à Revolut</span>
        <button @click="disconnect" class="btn-disconnect">
          🔓 Déconnexion
        </button>
      </div>
      
      <div class="connection-info">
        <p><strong>Environnement:</strong> {{ environment }}</p>
        <p><strong>Dernière synchro:</strong> {{ lastSync }}</p>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'RevolutConnect',
  props: {
    connected: Boolean
  },
  data() {
    return {
      environment: 'sandbox',
      lastSync: 'Jamais'
    };
  },
  methods: {
    async connectWithOAuth() {
      try {
        console.log('🔗 Lancement du flux OAuth Revolut...');
        
        // Redirection vers le backend pour l'OAuth
        window.location.href = 'https://rev-backend-rho.vercel.app/auth/revolut';
        
      } catch (error) {
        console.error('❌ Erreur connexion OAuth:', error);
        this.$emit('connection-error', error.message);
      }
    },
    
    async useDemoMode() {
      console.log('🎮 Activation du mode démo');
      this.$emit('disconnected');
    },
    
    async disconnect() {
      console.log('🔓 Déconnexion de Revolut');
      this.$emit('disconnected');
    },
    
    // Méthode pour gérer le callback OAuth
    handleOAuthCallback() {
      const urlParams = new URLSearchParams(window.location.search);
      const accessToken = urlParams.get('access_token');
      const error = urlParams.get('error');
      
      if (accessToken) {
        console.log('✅ Token OAuth reçu:', accessToken);
        this.$emit('connected', accessToken);
        
        // Nettoyer l'URL
        window.history.replaceState({}, document.title, window.location.pathname);
      } else if (error) {
        console.error('❌ Erreur OAuth:', error);
        this.$emit('connection-error', error);
      }
    }
  },
  
  mounted() {
    // Vérifier si on revient d'un callback OAuth
    this.handleOAuthCallback();
    
    // Vérifier si on a déjà un token en localStorage
    const savedConfig = localStorage.getItem('revolut-api-config');
    if (savedConfig) {
      const config = JSON.parse(savedConfig);
      if (config.apiKey) {
        console.log('🔑 Token trouvé en localStorage');
        this.$emit('connected', config.apiKey);
      }
    }
  }
};
</script>

<style scoped>
.revolut-connect {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  margin-bottom: 2rem;
}

.connect-section h3 {
  margin: 0 0 0.5rem 0;
  color: #2c3e50;
}

.connect-section p {
  margin: 0 0 1rem 0;
  color: #7f8c8d;
}

.btn-connect {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 1rem 2rem;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  margin-right: 1rem;
}

.btn-connect:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(102, 126, 234, 0.3);
}

.demo-mode {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid #f1f3f4;
}

.btn-demo {
  background: #f8f9fa;
  color: #6c757d;
  border: 2px solid #dee2e6;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-demo:hover {
  background: #e9ecef;
  border-color: #6c757d;
}

.connected-section {
  text-align: center;
}

.connection-status {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.status-badge {
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-weight: bold;
  font-size: 0.9rem;
}

.status-badge.connected {
  background: #d4edda;
  color: #155724;
}

.btn-disconnect {
  background: #f8f9fa;
  color: #dc3545;
  border: 1px solid #dc3545;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-disconnect:hover {
  background: #dc3545;
  color: white;
}

.connection-info {
  display: flex;
  justify-content: center;
  gap: 2rem;
  font-size: 0.9rem;
  color: #6c757d;
}

.connection-info p {
  margin: 0;
}

@media (max-width: 768px) {
  .connection-status {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .connection-info {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .btn-connect {
    margin-right: 0;
    margin-bottom: 1rem;
    width: 100%;
  }
}
</style>