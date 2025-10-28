<template>
  <div class="callback-page">
    <h2>🔗 Connexion Revolut</h2>
    <p v-if="success">✅ Connexion réussie !</p>
    <p v-else-if="error">❌ Erreur: {{ error }}</p>
    <p v-else>⏳ Traitement en cours...</p>
  </div>
</template>

<script>
export default {
  name: 'Callback',
  data() {
    return {
      success: false,
      error: null
    }
  },
  mounted() {
    // Gérer le callback OAuth si nécessaire
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const error = urlParams.get('error');
    
    if (code) {
      this.success = true;
      console.log('Code OAuth reçu:', code);
      // Rediriger vers la page principale après 2 secondes
      setTimeout(() => {
        this.$router.push('/');
      }, 2000);
    } else if (error) {
      this.error = error;
    }
  }
}
</script>