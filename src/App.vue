<template>
  <div id="app">
    <header class="header">
      <h1>🏦 Mon Dashboard Revolut Business</h1>
      <div class="header-info">
        <p>Solde total: <strong>{{ formattedTotalBalance }}</strong></p>
        <p>{{ currentDate }}</p>
        <div class="api-status" :class="apiStatus">
          {{ apiStatus === 'connected' ? '✅ Connecté à Revolut' : '🔌 Mode démo' }}
        </div>
      </div>
    </header>
    
    <main class="main-content">
      <!-- Navigation -->
      <nav class="main-nav">
        <button 
          v-for="tab in tabs" 
          :key="tab.id"
          @click="currentSection = tab.id"
          :class="{ active: currentSection === tab.id }"
        >
          {{ tab.icon }} {{ tab.name }}
        </button>
      </nav>

      <!-- Section Dashboard -->
      <section v-if="currentSection === 'dashboard'" class="section">
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon">💰</div>
            <div class="stat-info">
              <h3>Solde Total</h3>
              <p class="stat-value">{{ formattedTotalBalance }}</p>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon">📊</div>
            <div class="stat-info">
              <h3>Nombre de comptes</h3>
              <p class="stat-value">{{ accounts.length }}</p>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon">🔢</div>
            <div class="stat-info">
              <h3>Transactions</h3>
              <p class="stat-value">{{ transactions.length }}</p>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon">👥</div>
            <div class="stat-info">
              <h3>Bénéficiaires</h3>
              <p class="stat-value">{{ counterparties.length }}</p>
            </div>
          </div>
        </div>

        <!-- Liste des comptes -->
        <div class="accounts-preview">
          <h3>Mes Comptes</h3>
          <div class="accounts-list">
            <div 
              v-for="account in accounts" 
              :key="account.id"
              class="account-item"
            >
              <div class="account-header">
                <h4>{{ account.name }}</h4>
                <span class="currency-badge">{{ account.currency }}</span>
              </div>
              <p class="balance">{{ formatBalance(account.balance, account.currency) }}</p>
              <span class="account-state" :class="account.state">{{ account.state }}</span>
            </div>
          </div>
        </div>

        <!-- Dernières transactions -->
        <div class="recent-transactions">
          <h3>Dernières Transactions</h3>
          <div class="transactions-list">
            <div 
              v-for="transaction in recentTransactions" 
              :key="transaction.id"
              class="transaction-item"
            >
              <div class="transaction-icon" :class="transaction.type">
                {{ getTransactionIcon(transaction.type) }}
              </div>
              <div class="transaction-details">
                <strong>{{ transaction.description }}</strong>
                <small>{{ formatDate(transaction.date) }}</small>
              </div>
              <div class="transaction-amount" :class="transaction.amount >= 0 ? 'positive' : 'negative'">
                {{ formatBalance(transaction.amount, transaction.currency) }}
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Section Comptes -->
      <section v-if="currentSection === 'accounts'" class="section">
        <div class="section-header">
          <h2>Mes Comptes Revolut</h2>
          <button @click="loadAccounts" class="btn-primary">
            🔄 Actualiser
          </button>
        </div>

        <div class="accounts-grid">
          <div 
            v-for="account in accounts" 
            :key="account.id"
            class="account-card"
          >
            <div class="account-header">
              <h3>{{ account.name }}</h3>
              <span class="currency-badge">{{ account.currency }}</span>
            </div>
            
            <div class="account-balance">
              <p class="balance">{{ formatBalance(account.balance, account.currency) }}</p>
              <p class="available-balance" v-if="account.availableBalance">
                Disponible: {{ formatBalance(account.availableBalance, account.currency) }}
              </p>
            </div>
            
            <div class="account-details">
              <div class="detail-item">
                <span>Statut:</span>
                <span class="account-state" :class="account.state">{{ account.state }}</span>
              </div>
              <div class="detail-item" v-if="account.createdAt">
                <span>Créé le:</span>
                <span>{{ formatDate(account.createdAt) }}</span>
              </div>
            </div>
          </div>
        </div>

        <div v-if="accounts.length === 0" class="empty-state">
          <p>💰 Aucun compte trouvé</p>
          <button @click="loadAccounts" class="btn-primary">
            Charger les comptes
          </button>
        </div>
      </section>

      <!-- Section Transactions -->
      <section v-if="currentSection === 'transactions'" class="section">
        <div class="section-header">
          <h2>Transactions Revolut</h2>
          <button @click="loadTransactions" class="btn-primary">
            🔄 Actualiser
          </button>
        </div>

        <div class="transactions-container">
          <div 
            v-for="transaction in transactions" 
            :key="transaction.id"
            class="transaction-item"
          >
            <div class="transaction-icon" :class="transaction.type">
              {{ getTransactionIcon(transaction.type) }}
            </div>
            <div class="transaction-details">
              <strong>{{ transaction.description }}</strong>
              <small>{{ formatDate(transaction.date) }}</small>
              <span v-if="transaction.reference" class="transaction-reference">
                Réf: {{ transaction.reference }}
              </span>
              <span class="counterparty">{{ transaction.counterparty }}</span>
            </div>
            <div 
              class="transaction-amount"
              :class="transaction.amount >= 0 ? 'positive' : 'negative'"
            >
              {{ formatBalance(transaction.amount, transaction.currency) }}
              <div class="transaction-status" :class="transaction.status">
                {{ getStatusText(transaction.status) }}
              </div>
            </div>
          </div>
        </div>

        <div v-if="transactions.length === 0" class="empty-state">
          <p>📝 Aucune transaction trouvée</p>
          <button @click="loadTransactions" class="btn-primary">
            Charger les transactions
          </button>
        </div>
      </section>

      <!-- Section Connexion API -->
      <section v-if="currentSection === 'api'" class="section">
        <div class="api-config">
          <h2>Connexion à l'API Revolut</h2>
          
          <div class="form-group">
            <label>Token d'accès Revolut</label>
            <input 
              v-model="apiConfig.apiKey" 
              type="password" 
              placeholder="Collez votre token d'accès ici"
              class="token-input"
            >
            <small>Obtenez un token via: 
              <a href="https://rev-backend-rho.vercel.app/auth/revolut" target="_blank">
                https://rev-backend-rho.vercel.app/auth/revolut
              </a>
            </small>
          </div>
          
          <div class="api-actions">
            <button @click="testConnection" class="btn-primary" :disabled="!apiConfig.apiKey">
              🔌 Tester la connexion
            </button>
            <button @click="saveApiConfig" class="btn-secondary" :disabled="!apiConfig.apiKey">
              💾 Sauvegarder
            </button>
            <button @click="clearApiConfig" class="btn-danger" v-if="apiConfig.apiKey">
              🗑️ Effacer
            </button>
          </div>
          
          <div v-if="connectionTestResult" class="test-result" :class="connectionTestResult.type">
            {{ connectionTestResult.message }}
          </div>
        </div>
        
        <div class="api-info">
          <h3>Informations de connexion</h3>
          <div class="info-grid">
            <div class="info-item">
              <span>Statut:</span>
              <strong>{{ apiStatusText }}</strong>
            </div>
            <div class="info-item">
              <span>Dernière synchronisation:</span>
              <strong>{{ lastSync || 'Jamais' }}</strong>
            </div>
            <div class="info-item">
              <span>Backend URL:</span>
              <strong>https://rev-backend-rho.vercel.app</strong>
            </div>
          </div>
        </div>

        <!-- Actions rapides -->
        <div class="quick-actions">
          <h3>Actions rapides</h3>
          <div class="actions-grid">
            <button @click="loadAccounts" class="btn-secondary" :disabled="apiStatus !== 'connected'">
              📊 Charger les comptes
            </button>
            <button @click="loadTransactions" class="btn-secondary" :disabled="apiStatus !== 'connected'">
              📝 Charger les transactions
            </button>
            <button @click="loadCounterparties" class="btn-secondary" :disabled="apiStatus !== 'connected'">
              👥 Charger les bénéficiaires
            </button>
            <button @click="loadAllData" class="btn-primary" :disabled="apiStatus !== 'connected'">
              🔄 Tout synchroniser
            </button>
          </div>
        </div>
      </section>
    </main>

    <!-- Loading overlay -->
    <div v-if="loading" class="loading-overlay">
      <div class="loading-spinner">
        <div class="spinner"></div>
        <p>{{ loadingMessage }}</p>
      </div>
    </div>
  </div>
</template>

<script>
import RevolutAPI from './services/revolut-api';

export default {
  name: 'App',
  data() {
    return {
      currentSection: 'dashboard',
      loading: false,
      loadingMessage: 'Chargement...',
      apiStatus: 'demo', // 'demo', 'connected', 'error'
      connectionTestResult: null,
      lastSync: null,
      
      // Données
      accounts: [],
      transactions: [],
      counterparties: [],
      
      // Configuration API
      apiConfig: {
        apiKey: '',
        environment: 'sandbox'
      },
      
      tabs: [
        { id: 'dashboard', name: 'Dashboard', icon: '📊' },
        { id: 'accounts', name: 'Comptes', icon: '💰' },
        { id: 'transactions', name: 'Transactions', icon: '📝' },
        { id: 'api', name: 'Connexion API', icon: '🔌' }
      ]
    };
  },
  computed: {
    totalBalance() {
      return this.accounts.reduce((total, account) => total + account.balance, 0);
    },
    
    formattedTotalBalance() {
      return this.formatBalance(this.totalBalance, 'EUR');
    },
    
    currentDate() {
      return new Date().toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    },
    
    recentTransactions() {
      return this.transactions.slice(0, 5);
    },
    
    apiStatusText() {
      const statusMap = {
        demo: 'Mode démo',
        connected: 'Connecté à Revolut',
        error: 'Erreur de connexion'
      };
      return statusMap[this.apiStatus];
    }
  },
  methods: {
    // Formatage
    formatBalance(amount, currency) {
      return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: currency
      }).format(amount);
    },
    
    formatDate(dateString) {
      if (!dateString) return '';
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR', { 
        day: '2-digit', 
        month: 'short', 
        year: 'numeric' 
      });
    },
    
    getTransactionIcon(type) {
      switch (type) {
        case 'incoming': return '⬆️';
        case 'outgoing': return '⬇️';
        case 'transfer': return '🔁';
        case 'exchange': return '💱';
        case 'fee': return '💸';
        default: return '🧾';
      }
    },
    
    getStatusText(status) {
      const map = {
        completed: 'Complétée',
        pending: 'En attente',
        failed: 'Échouée'
      };
      return map[status] || status;
    },

    // Gestion API
    async testConnection() {
      if (!this.apiConfig.apiKey) {
        this.connectionTestResult = {
          type: 'error',
          message: '❌ Veuillez entrer un token d\'accès'
        };
        return;
      }
      
      this.loading = true;
      this.loadingMessage = 'Test de connexion...';
      
      try {
        const api = new RevolutAPI(this.apiConfig.apiKey);
        const result = await api.testConnection();
        
        if (result.success) {
          this.connectionTestResult = {
            type: 'success',
            message: '✅ Connexion réussie au backend Revolut!'
          };
          this.apiStatus = 'connected';
        } else {
          this.connectionTestResult = {
            type: 'error',
            message: `❌ ${result.error}`
          };
          this.apiStatus = 'error';
        }
      } catch (error) {
        this.connectionTestResult = {
          type: 'error',
          message: '❌ Erreur de connexion au backend'
        };
        this.apiStatus = 'error';
      } finally {
        this.loading = false;
      }
    },
    
    saveApiConfig() {
      if (!this.apiConfig.apiKey) return;
      
      localStorage.setItem('revolut-api-config', JSON.stringify(this.apiConfig));
      this.connectionTestResult = {
        type: 'success',
        message: '✅ Configuration sauvegardée!'
      };
    },
    
    clearApiConfig() {
      this.apiConfig.apiKey = '';
      this.apiStatus = 'demo';
      this.connectionTestResult = null;
      localStorage.removeItem('revolut-api-config');
      this.accounts = [];
      this.transactions = [];
      this.counterparties = [];
    },
    
    // Chargement des données
    async loadAccounts() {
      if (this.apiStatus !== 'connected') {
        alert('Veuillez d\'abord vous connecter à l\'API Revolut');
        return;
      }
      
      this.loading = true;
      this.loadingMessage = 'Chargement des comptes...';
      
      try {
        const api = new RevolutAPI(this.apiConfig.apiKey);
        this.accounts = await api.getAccounts();
        this.lastSync = new Date().toLocaleTimeString('fr-FR');
      } catch (error) {
        console.error('Erreur chargement comptes:', error);
        alert('Erreur lors du chargement des comptes: ' + error.message);
      } finally {
        this.loading = false;
      }
    },
    
    async loadTransactions() {
      if (this.apiStatus !== 'connected') {
        alert('Veuillez d\'abord vous connecter à l\'API Revolut');
        return;
      }
      
      this.loading = true;
      this.loadingMessage = 'Chargement des transactions...';
      
      try {
        const api = new RevolutAPI(this.apiConfig.apiKey);
        this.transactions = await api.getTransactions();
        this.lastSync = new Date().toLocaleTimeString('fr-FR');
      } catch (error) {
        console.error('Erreur chargement transactions:', error);
        alert('Erreur lors du chargement des transactions: ' + error.message);
      } finally {
        this.loading = false;
      }
    },
    
    async loadCounterparties() {
      if (this.apiStatus !== 'connected') {
        alert('Veuillez d\'abord vous connecter à l\'API Revolut');
        return;
      }
      
      this.loading = true;
      this.loadingMessage = 'Chargement des bénéficiaires...';
      
      try {
        const api = new RevolutAPI(this.apiConfig.apiKey);
        this.counterparties = await api.getCounterparties();
        this.lastSync = new Date().toLocaleTimeString('fr-FR');
      } catch (error) {
        console.error('Erreur chargement bénéficiaires:', error);
        alert('Erreur lors du chargement des bénéficiaires: ' + error.message);
      } finally {
        this.loading = false;
      }
    },
    
    async loadAllData() {
      if (this.apiStatus !== 'connected') {
        alert('Veuillez d\'abord vous connecter à l\'API Revolut');
        return;
      }
      
      this.loading = true;
      this.loadingMessage = 'Synchronisation des données...';
      
      try {
        const api = new RevolutAPI(this.apiConfig.apiKey);
        
        const [accounts, transactions, counterparties] = await Promise.all([
          api.getAccounts(),
          api.getTransactions(),
          api.getCounterparties()
        ]);
        
        this.accounts = accounts;
        this.transactions = transactions;
        this.counterparties = counterparties;
        this.lastSync = new Date().toLocaleTimeString('fr-FR');
        
        alert('✅ Données synchronisées avec succès!');
      } catch (error) {
        console.error('Erreur synchronisation:', error);
        alert('Erreur lors de la synchronisation: ' + error.message);
      } finally {
        this.loading = false;
      }
    },
    
    // Chargement automatique au démarrage
    loadSavedConfig() {
      const savedConfig = localStorage.getItem('revolut-api-config');
      if (savedConfig) {
        this.apiConfig = JSON.parse(savedConfig);
        // Tester automatiquement la connexion
        if (this.apiConfig.apiKey) {
          this.testConnection();
        }
      }
    }
  },
  mounted() {
    this.loadSavedConfig();
  }
};
</script>

<style scoped>
/* Vos styles CSS existants restent les mêmes */
.header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 2rem;
  text-align: center;
  margin-bottom: 2rem;
}

.header h1 {
  margin: 0 0 0.5rem 0;
  font-size: 2rem;
}

.header-info {
  margin-top: 1rem;
}

.api-status {
  display: inline-block;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: bold;
  margin-top: 0.5rem;
}

.api-status.connected {
  background: #d4edda;
  color: #155724;
}

.api-status.demo {
  background: #fff3cd;
  color: #856404;
}

.api-status.error {
  background: #f8d7da;
  color: #721c24;
}

.main-nav {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  padding: 0 2rem;
  flex-wrap: wrap;
}

.main-nav button {
  padding: 0.75rem 1.5rem;
  border: 2px solid #667eea;
  background: white;
  color: #667eea;
  border-radius: 25px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.3s;
}

.main-nav button.active {
  background: #667eea;
  color: white;
}

.main-nav button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(102, 126, 234, 0.3);
}

.section {
  padding: 0 2rem 2rem 2rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  display: flex;
  align-items: center;
  gap: 1rem;
}

.stat-icon {
  font-size: 2rem;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: 50%;
}

.stat-info h3 {
  margin: 0 0 0.5rem 0;
  color: #2c3e50;
  font-size: 0.9rem;
  font-weight: 600;
}

.stat-value {
  margin: 0;
  font-size: 1.5rem;
  font-weight: bold;
  color: #2c3e50;
}

.accounts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

.account-card {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}

.account-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.account-header h3 {
  margin: 0;
  color: #2c3e50;
}

.currency-badge {
  background: #667eea;
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 15px;
  font-size: 0.8rem;
  font-weight: bold;
}

.balance {
  font-size: 1.5rem;
  font-weight: bold;
  color: #2c3e50;
  margin: 0 0 0.5rem 0;
}

.available-balance {
  color: #7f8c8d;
  font-size: 0.9rem;
  margin: 0;
}

.account-details {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #f1f3f4;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
}

.account-state {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: bold;
}

.account-state.active {
  background: #d4edda;
  color: #155724;
}

.account-state.inactive {
  background: #f8d7da;
  color: #721c24;
}

.transactions-container {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  overflow: hidden;
}

.transaction-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem;
  border-bottom: 1px solid #f1f3f4;
  transition: background 0.2s;
}

.transaction-item:hover {
  background: #f8f9fa;
}

.transaction-item:last-child {
  border-bottom: none;
}

.transaction-icon {
  font-size: 1.5rem;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8f9fa;
  border-radius: 8px;
}

.transaction-details {
  flex: 1;
}

.transaction-details strong {
  display: block;
  margin-bottom: 0.25rem;
  color: #2c3e50;
}

.transaction-details small {
  color: #7f8c8d;
  display: block;
  margin-bottom: 0.25rem;
}

.transaction-reference {
  color: #2980b9;
  font-size: 0.8rem;
}

.counterparty {
  color: #7f8c8d;
  font-size: 0.8rem;
}

.transaction-amount {
  font-weight: bold;
  font-size: 1.1rem;
  text-align: right;
}

.positive {
  color: #27ae60;
}

.negative {
  color: #e74c3c;
}

.transaction-status {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: bold;
  margin-top: 0.25rem;
}

.transaction-status.completed {
  background: #d4edda;
  color: #155724;
}

.transaction-status.pending {
  background: #fff3cd;
  color: #856404;
}

.api-config {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  margin-bottom: 2rem;
}

.token-input {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #ddd;
  border-radius: 8px;
  font-family: monospace;
  margin-bottom: 0.5rem;
}

.api-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;
}

.test-result {
  padding: 1rem;
  border-radius: 8px;
  margin-top: 1rem;
  font-weight: bold;
}

.test-result.success {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.test-result.error {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.api-info {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  margin-bottom: 2rem;
}

.info-grid {
  display: grid;
  gap: 1rem;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid #f8f9fa;
}

.info-item:last-child {
  border-bottom: none;
}

.quick-actions {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
}

.empty-state {
  text-align: center;
  padding: 3rem;
  color: #7f8c8d;
}

.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255,255,255,0.9);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.loading-spinner {
  text-align: center;
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 8px 25px rgba(0,0,0,0.2);
}

.spinner {
  width: 50px;
  height: 50px;
  border: 5px solid #f3f3f3;
  border-top: 5px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.btn-primary, .btn-secondary, .btn-danger {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: bold;
  transition: all 0.3s;
}

.btn-primary {
  background: #667eea;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #5a6fd8;
  transform: translateY(-2px);
}

.btn-primary:disabled {
  background: #bdc3c7;
  cursor: not-allowed;
}

.btn-secondary {
  background: #f8f9fa;
  color: #2c3e50;
  border: 2px solid #ddd;
}

.btn-secondary:hover:not(:disabled) {
  background: #e9ecef;
}

.btn-danger {
  background: #e74c3c;
  color: white;
}

.btn-danger:hover {
  background: #c0392b;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.section-header h2 {
  margin: 0;
  color: #2c3e50;
}

.accounts-preview, .recent-transactions {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  margin-bottom: 2rem;
}

.accounts-list, .transactions-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.account-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border: 1px solid #f1f3f4;
  border-radius: 8px;
}

.account-item .account-header {
  margin: 0;
}

.account-item .balance {
  margin: 0;
  font-size: 1.2rem;
}
</style>