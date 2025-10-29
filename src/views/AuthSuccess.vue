<template>
  <div class="auth-success-page">
    <div class="success-container">
      <div class="success-icon">✅</div>
      <h1>Connexion Réussie !</h1>
      <p>Vous êtes maintenant connecté à Revolut Business</p>
      
      <div class="token-info" v-if="accessToken">
        <p>Token d'accès reçu avec succès</p>
        <div class="actions">
          <button @click="goToDashboard" class="btn-primary">
            🏠 Aller au Dashboard
          </button>
          <button @click="testConnection" class="btn-secondary">
            🔌 Tester la connexion
          </button>
        </div>
      </div>

      <div v-else class="loading">
        <p>Chargement...</p>
      </div>
    </div>
  </div>
</template>

<script>
import RevolutAPI from '../services/revolut-api';

export default {
  name: 'AuthSuccess',
  data() {
    return {
      accessToken: null,
      loading: false
    };
  },
  mounted() {
    this.handleOAuthCallback();
  },
  methods: {
    handleOAuthCallback() {
      const urlParams = new URLSearchParams(window.location.search);
      this.accessToken = urlParams.get('access_token');
      
      if (this.accessToken) {
        // Sauvegarder le token
        localStorage.setItem('revolut_access_token', this.accessToken);
        
        // Nettoyer l'URL
        window.history.replaceState({}, document.title, window.location.pathname);
        
        // Émettre un événement global pour informer l'application
        window.dispatchEvent(new CustomEvent('revolut-connected', {
          detail: { accessToken: this.accessToken }
        }));
        
        console.log('Token OAuth reçu et sauvegardé');
      } else {
        console.error('Aucun token reçu dans l\'URL');
      }
    },
    
    goToDashboard() {
      this.$router.push('/');
    },
    
    async testConnection() {
      if (!this.accessToken) return;
      
      this.loading = true;
      
      try {
        const revolutAPI = new RevolutAPI(this.accessToken);
        const result = await revolutAPI.testConnection();
        
        if (result.success) {
          alert('✅ Connexion API réussie !');
        } else {
          alert('❌ Erreur de connexion: ' + (result.error || 'Unknown error'));
        }
      } catch (error) {
        alert('❌ Erreur: ' + error.message);
      } finally {
        this.loading = false;
      }
    }
  }
};
</script>

<style scoped>
.auth-success-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 2rem;
}

.success-container {
  background: white;
  padding: 3rem;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  text-align: center;
  max-width: 500px;
  width: 100%;
}

.success-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

h1 {
  color: #2c3e50;
  margin-bottom: 1rem;
}

p {
  color: #7f8c8d;
  margin-bottom: 2rem;
  font-size: 1.1rem;
}

.token-info {
  border-top: 1px solid #f1f3f4;
  padding-top: 2rem;
}

.actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.loading {
  padding: 2rem;
}

@media (max-width: 768px) {
  .auth-success-page {
    padding: 1rem;
  }
  
  .success-container {
    padding: 2rem;
  }
  
  .actions {
    flex-direction: column;
  }
}
</style>