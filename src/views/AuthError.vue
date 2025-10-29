<template>
  <div class="auth-error-page">
    <div class="error-container">
      <div class="error-icon">❌</div>
      <h1>Erreur de Connexion</h1>
      <p class="error-message">{{ errorMessage }}</p>
      
      <div class="actions">
        <button @click="retry" class="btn-primary">
          🔄 Réessayer
        </button>
        <button @click="goHome" class="btn-secondary">
          🏠 Retour à l'accueil
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AuthError',
  data() {
    return {
      errorMessage: 'Une erreur est survenue lors de la connexion'
    };
  },
  mounted() {
    const urlParams = new URLSearchParams(window.location.search);
    const message = urlParams.get('message');
    
    if (message) {
      this.errorMessage = decodeURIComponent(message);
    }
    
    // Nettoyer l'URL
    window.history.replaceState({}, document.title, window.location.pathname);
  },
  methods: {
    retry() {
      // Rediriger vers le flux OAuth
      window.location.href = 'https://rev-backend-rho.vercel.app/auth/revolut';
    },
    
    goHome() {
      this.$router.push('/');
    }
  }
};
</script>

<style scoped>
.auth-error-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f5576c 0%, #f093fb 100%);
  padding: 2rem;
}

.error-container {
  background: white;
  padding: 3rem;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  text-align: center;
  max-width: 500px;
  width: 100%;
}

.error-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

h1 {
  color: #e74c3c;
  margin-bottom: 1rem;
}

.error-message {
  color: #7f8c8d;
  margin-bottom: 2rem;
  font-size: 1.1rem;
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 8px;
  border-left: 4px solid #e74c3c;
}

.actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

@media (max-width: 768px) {
  .auth-error-page {
    padding: 1rem;
  }
  
  .error-container {
    padding: 2rem;
  }
  
  .actions {
    flex-direction: column;
  }
}
</style>