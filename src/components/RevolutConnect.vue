<template>
  <div class="api-connection-banner" v-if="!connected">
    <div class="connection-prompt">
      <h3>🔌 Connectez-vous à Revolut</h3>
      <p>Pour accéder à vos vraies données, connectez-vous avec votre compte Revolut Business</p>
      
      <div class="connection-options">
        <!-- Option API Key -->
        <div class="connection-option">
          <h4>🔑 Connexion par API Key</h4>
          <input 
            v-model="apiKey" 
            type="password" 
            placeholder="Collez votre clé API Revolut Sandbox"
            class="api-key-input"
          >
          <button 
            @click="testAndSaveApiConfig" 
            :disabled="!apiKey || loading"
            class="btn-primary"
          >
            {{ loading ? 'Test en cours...' : 'Tester et Sauvegarder' }}
          </button>
        </div>

        <!-- Option OAuth -->
        <div class="connection-option">
          <h4>🚀 Connexion OAuth</h4>
          <p>Connexion sécurisée via Revolut</p>
          <button @click="connectWithOAuth" class="btn-secondary">
            Se connecter avec Revolut
          </button>
        </div>
      </div>

      <!-- Résultat du test -->
      <div v-if="connectionResult" class="test-result" :class="connectionResult.type">
        {{ connectionResult.message }}
      </div>
    </div>
  </div>

  <!-- Bannière de statut quand connecté -->
  <div v-else class="connection-status connected">
    <div class="status-content">
      <span class="status-icon">✅</span>
      <span>Connecté à Revolut Sandbox</span>
      <button @click="disconnect" class="btn-sm btn-outline">Déconnecter</button>
    </div>
  </div>
</template>

<script>
import RevolutAPI from '../services/revolut-api';

export default {
  name: 'RevolutConnect',
  props: {
    connected: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      apiKey: '',
      loading: false,
      connectionResult: null
    };
  },
  methods: {
    async testAndSaveApiConfig() {
      if (!this.apiKey) return;
      
      this.loading = true;
      this.connectionResult = null;
      
      try {
        const result = await RevolutAPI.testConnection(this.apiKey);
        
        if (result.success) {
          this.connectionResult = {
            type: 'success',
            message: '✅ Connexion à Revolut réussie!'
          };
          
          // Émettre l'événement vers le parent
          this.$emit('connected', this.apiKey);
          
        } else {
          this.connectionResult = {
            type: 'error',
            message: '❌ ' + (result.error || 'Erreur de connexion')
          };
        }
      } catch (error) {
        this.connectionResult = {
          type: 'error',
          message: '❌ Erreur: ' + error.message
        };
      } finally {
        this.loading = false;
      }
    },

    connectWithOAuth() {
      window.location.href = 'https://rev-backend-rho.vercel.app/auth/revolut';
    },

    disconnect() {
      this.apiKey = '';
      this.connectionResult = null;
      this.$emit('disconnected');
    }
  }
};
</script>

<style scoped>
.api-connection-banner {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1.5rem;
  margin: 1rem;
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
}

.connection-prompt h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1.25rem;
}

.connection-prompt p {
  margin: 0 0 1rem 0;
  opacity: 0.9;
}

.connection-options {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  margin-top: 1rem;
}

.connection-option {
  background: rgba(255, 255, 255, 0.1);
  padding: 1.5rem;
  border-radius: 8px;
  backdrop-filter: blur(10px);
}

.connection-option h4 {
  margin: 0 0 1rem 0;
  font-size: 1rem;
}

.api-key-input {
  width: 100%;
  padding: 0.75rem;
  margin: 0.5rem 0;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  font-family: monospace;
}

.api-key-input::placeholder {
  color: rgba(255, 255, 255, 0.7);
}

.test-result {
  padding: 1rem;
  border-radius: 8px;
  margin-top: 1rem;
  font-weight: bold;
  text-align: center;
}

.test-result.success {
  background: rgba(212, 237, 218, 0.2);
  border: 1px solid rgba(195, 230, 203, 0.5);
}

.test-result.error {
  background: rgba(248, 215, 218, 0.2);
  border: 1px solid rgba(245, 198, 203, 0.5);
}

.connection-status {
  padding: 1rem;
  margin: 1rem;
  border-radius: 8px;
  font-weight: bold;
}

.connection-status.connected {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.status-content {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  justify-content: center;
}

.status-icon {
  font-size: 1.2rem;
}

.btn-outline {
  background: transparent;
  border: 1px solid currentColor;
  color: inherit;
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  cursor: pointer;
}

.btn-outline:hover {
  background: rgba(0, 0, 0, 0.1);
}

/* Responsive */
@media (max-width: 768px) {
  .connection-options {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .api-connection-banner {
    margin: 0.5rem;
    padding: 1rem;
  }
  
  .connection-option {
    padding: 1rem;
  }
}
</style>