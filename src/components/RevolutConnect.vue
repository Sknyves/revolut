<template>
  <div class="api-connection">
    <!-- Bannière de statut -->
    <div class="status-banner" :class="apiStatus">
      <div class="status-content">
        <span class="status-icon">
          {{ statusIcon }}
        </span>
        <div class="status-info">
          <strong>{{ statusTitle }}</strong>
          <span>{{ statusMessage }}</span>
        </div>
        <div class="status-actions">
          <button 
            v-if="apiStatus === 'demo'" 
            @click="connectToRevolut" 
            class="btn-primary"
          >
            🔗 Se connecter à Revolut
          </button>
          <button 
            v-if="apiStatus === 'connected'" 
            @click="disconnect" 
            class="btn-secondary"
          >
            🔓 Déconnecter
          </button>
          <button 
            v-if="apiStatus === 'error'" 
            @click="retryConnection" 
            class="btn-primary"
          >
            🔄 Réessayer
          </button>
        </div>
      </div>
    </div>

    <!-- Configuration manuelle (optionnel) -->
    <div v-if="showManualConfig" class="manual-config">
      <h3>Configuration manuelle de l'API</h3>
      <div class="config-form">
        <div class="form-group">
          <label>Token d'accès Revolut</label>
          <input 
            v-model="manualToken" 
            type="password" 
            placeholder="Coller votre token d'accès ici"
            class="token-input"
          >
        </div>
        <div class="form-actions">
          <button @click="useManualToken" class="btn-primary">
            Utiliser ce token
          </button>
          <button @click="showManualConfig = false" class="btn-secondary">
            Annuler
          </button>
        </div>
      </div>
    </div>

    <!-- Chargement -->
    <div v-if="loading" class="loading-overlay">
      <div class="loading-spinner">
        <div class="spinner"></div>
        <p>{{ loadingMessage }}</p>
      </div>
    </div>
  </div>
</template>

<script>
import RevolutAPI from '../services/revolut-api';

export default {
  name: 'ApiConnection',
  props: {
    onApiConnected: {
      type: Function,
      required: true
    },
    onApiDisconnected: {
      type: Function,
      required: true
    }
  },
  data() {
    return {
      apiStatus: 'demo', // 'demo', 'connected', 'error', 'loading'
      loading: false,
      loadingMessage: '',
      showManualConfig: false,
      manualToken: '',
      connectionError: ''
    };
  },
  computed: {
    statusIcon() {
      const icons = {
        demo: '🔌',
        connected: '✅',
        error: '❌',
        loading: '⏳'
      };
      return icons[this.apiStatus];
    },
    statusTitle() {
      const titles = {
        demo: 'Mode Démo',
        connected: 'Connecté à Revolut',
        error: 'Erreur de Connexion',
        loading: 'Connexion en cours...'
      };
      return titles[this.apiStatus];
    },
    statusMessage() {
      const messages = {
        demo: 'Vous utilisez des données de démo. Connectez-vous à Revolut pour accéder à vos vraies données.',
        connected: 'Données synchronisées avec votre compte Revolut Business.',
        error: this.connectionError || 'Impossible de se connecter à Revolut.',
        loading: this.loadingMessage
      };
      return messages[this.apiStatus];
    }
  },
  methods: {
    async connectToRevolut() {
      try {
        console.log('🚀 Lancement du flux OAuth...');
        RevolutAPI.launchOAuth();
      } catch (error) {
        console.error('❌ Erreur connexion OAuth:', error);
        this.apiStatus = 'error';
        this.connectionError = error.message;
      }
    },

    async handleOAuthCallback() {
      try {
        this.loading = true;
        this.loadingMessage = 'Finalisation de la connexion...';
        
        const accessToken = RevolutAPI.handleOAuthCallback();
        
        if (accessToken) {
          console.log('✅ Token OAuth reçu:', accessToken.substring(0, 20) + '...');
          await this.testAndConnect(accessToken);
        }
      } catch (error) {
        console.error('❌ Erreur callback OAuth:', error);
        this.apiStatus = 'error';
        this.connectionError = error.message;
      } finally {
        this.loading = false;
      }
    },

    async testAndConnect(accessToken) {
      try {
        this.loading = true;
        this.loadingMessage = 'Test de connexion à Revolut...';
        
        const api = new RevolutAPI(accessToken);
        const testResult = await api.testConnection();
        
        if (testResult.success) {
          console.log('✅ Connexion Revolut réussie');
          this.apiStatus = 'connected';
          this.onApiConnected(accessToken);
        } else {
          throw new Error(testResult.error);
        }
      } catch (error) {
        console.error('❌ Test connexion échoué:', error);
        this.apiStatus = 'error';
        this.connectionError = error.message;
        // Nettoyer le token invalide
        localStorage.removeItem('revolut-access-token');
      } finally {
        this.loading = false;
      }
    },

    async useManualToken() {
      if (!this.manualToken.trim()) {
        alert('Veuillez entrer un token valide');
        return;
      }

      await this.testAndConnect(this.manualToken.trim());
      this.showManualConfig = false;
      this.manualToken = '';
    },

    disconnect() {
      this.apiStatus = 'demo';
      this.onApiDisconnected();
    },

    retryConnection() {
      const savedToken = localStorage.getItem('revolut-access-token');
      if (savedToken) {
        this.testAndConnect(savedToken);
      } else {
        this.connectToRevolut();
      }
    },

    checkExistingConnection() {
      const savedToken = localStorage.getItem('revolut-access-token');
      if (savedToken) {
        console.log('🔍 Token existant trouvé, test de connexion...');
        this.testAndConnect(savedToken);
      }
    }
  },
  mounted() {
    // Vérifier si on est dans un callback OAuth
    if (RevolutAPI.isOAuthCallback()) {
      this.handleOAuthCallback();
    } else {
      // Vérifier une connexion existante
      this.checkExistingConnection();
    }
  }
};
</script>

<style scoped>
.api-connection {
  margin-bottom: 2rem;
}

.status-banner {
  padding: 1rem 1.5rem;
  border-radius: 12px;
  margin-bottom: 1rem;
}

.status-banner.demo {
  background: linear-gradient(135deg, #fff3cd, #ffeaa7);
  border: 2px solid #fdcb6e;
  color: #856404;
}

.status-banner.connected {
  background: linear-gradient(135deg, #d4edda, #c8e6c9);
  border: 2px solid #27ae60;
  color: #155724;
}

.status-banner.error {
  background: linear-gradient(135deg, #f8d7da, #f5c6cb);
  border: 2px solid #e74c3c;
  color: #721c24;
}

.status-banner.loading {
  background: linear-gradient(135deg, #cce7ff, #b3d9ff);
  border: 2px solid #3498db;
  color: #004085;
}

.status-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.status-icon {
  font-size: 2rem;
}

.status-info {
  flex: 1;
}

.status-info strong {
  display: block;
  margin-bottom: 0.25rem;
  font-size: 1.1rem;
}

.status-info span {
  font-size: 0.9rem;
  opacity: 0.9;
}

.status-actions {
  display: flex;
  gap: 0.5rem;
}

.manual-config {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  margin-top: 1rem;
}

.manual-config h3 {
  margin: 0 0 1rem 0;
  color: #2c3e50;
}

.config-form {
  display: flex;
  gap: 1rem;
  align-items: flex-end;
}

.token-input {
  flex: 1;
  padding: 0.75rem;
  border: 2px solid #ddd;
  border-radius: 8px;
  font-family: monospace;
}

.form-actions {
  display: flex;
  gap: 0.5rem;
}

.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.loading-spinner {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  text-align: center;
  box-shadow: 0 8px 25px rgba(0,0,0,0.3);
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Responsive */
@media (max-width: 768px) {
  .status-content {
    flex-direction: column;
    text-align: center;
    gap: 1rem;
  }
  
  .config-form {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>