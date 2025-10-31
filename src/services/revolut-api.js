import axios from 'axios';

class RevolutAPI {
  constructor(apiKey, environment = 'sandbox') {
    this.apiKey = apiKey;
    this.environment = environment;
    
    // URL de votre backend
    this.baseURL = 'https://rev-backend-rho.vercel.app';
    
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 15000
    });
  }

  // Tester la connexion au backend
  async testConnection() {
    try {
      const response = await this.client.get('/health');
      return {
        success: true,
        message: '✅ Backend opérationnel',
        data: response.data
      };
    } catch (error) {
      console.error('❌ Test connexion backend échoué:', error);
      
      if (error.response?.status === 401) {
        return {
          success: false,
          error: 'Token d\'accès invalide'
        };
      } else if (error.code === 'NETWORK_ERROR' || error.code === 'ECONNREFUSED') {
        return {
          success: false,
          error: 'Backend indisponible - Vérifiez l\'URL'
        };
      } else {
        return {
          success: false,
          error: error.response?.data?.error || 'Erreur de connexion au backend'
        };
      }
    }
  }

  // Récupérer les comptes
  async getAccounts() {
    try {
      const response = await this.client.get('/api/accounts');
      console.log('📊 Comptes reçus:', response.data);
      
      return response.data.map(account => ({
        id: account.id,
        name: account.name || `Compte ${account.currency}`,
        currency: account.currency,
        balance: account.balance,
        state: account.state,
        availableBalance: account.available_balance || account.balance,
        createdAt: account.created_at
      }));
    } catch (error) {
      console.error('❌ Erreur récupération comptes:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error || 'Erreur lors de la récupération des comptes');
    }
  }

  // Récupérer les transactions (à implémenter sur le backend)
  async getTransactions(accountId = null, limit = 50) {
    try {
      let url = '/api/transactions';
      if (accountId) {
        url = `/api/accounts/${accountId}/transactions`;
      }
      
      const response = await this.client.get(url, {
        params: { limit }
      });
      
      console.log('📝 Transactions reçues:', response.data);
      
      // Formatage des transactions selon la structure Revolut
      return response.data.map(transaction => ({
        id: transaction.id,
        description: transaction.description || transaction.legs?.[0]?.description || 'Transaction',
        amount: parseFloat(transaction.amount || transaction.legs?.[0]?.amount || 0),
        currency: transaction.currency || transaction.legs?.[0]?.currency || 'EUR',
        date: transaction.created_at?.split('T')[0] || transaction.date || new Date().toISOString().split('T')[0],
        type: this.getTransactionType(transaction),
        counterparty: this.getCounterpartyName(transaction),
        reference: transaction.reference || '',
        status: transaction.state || 'completed'
      }));
    } catch (error) {
      console.error('❌ Erreur récupération transactions:', error);
      // Retourner des données de démo si l'endpoint n'existe pas encore
      return this.getDemoTransactions();
    }
  }

  // Récupérer les bénéficiaires
  async getCounterparties() {
    try {
      const response = await this.client.get('/api/counterparties');
      console.log('👥 Bénéficiaires reçus:', response.data);
      
      return response.data.map(counterparty => ({
        id: counterparty.id,
        name: counterparty.name || counterparty.company_name,
        account: counterparty.accounts?.[0]?.account_no || counterparty.account_no || '',
        email: counterparty.email || '',
        currency: counterparty.accounts?.[0]?.currency || 'EUR',
        bankCountry: counterparty.bank_country
      }));
    } catch (error) {
      console.error('❌ Erreur récupération bénéficiaires:', error);
      // Retourner des données de démo si l'endpoint n'existe pas encore
      return this.getDemoCounterparties();
    }
  }

  // Effectuer un paiement
  async createPayment(paymentData) {
    try {
      const response = await this.client.post('/api/transfers', paymentData);
      console.log('✅ Paiement effectué:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Erreur paiement:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error || 'Erreur lors du paiement');
    }
  }

  // Méthodes utilitaires
  getTransactionType(transaction) {
    const amount = parseFloat(transaction.amount || transaction.legs?.[0]?.amount || 0);
    if (amount > 0) return 'incoming';
    if (amount < 0) return 'outgoing';
    if (transaction.type === 'exchange') return 'exchange';
    if (transaction.type === 'fee') return 'fee';
    return 'transfer';
  }

  getCounterpartyName(transaction) {
    return transaction.counterparty?.name || 
           transaction.merchant?.name || 
           transaction.counterparty_name ||
           'Revolut';
  }

  // Données de démo pour le développement
  getDemoTransactions() {
    return [
      {
        id: 'demo_1',
        description: "Virement Client ABC",
        amount: 2500.00,
        currency: "EUR",
        date: "2024-01-15",
        type: "incoming",
        counterparty: "Client ABC",
        reference: "FACT-2024-001",
        status: "completed"
      },
      {
        id: 'demo_2',
        description: "Achat Matériel",
        amount: -450.50,
        currency: "EUR",
        date: "2024-01-14",
        type: "outgoing",
        counterparty: "Fournisseur XYZ",
        reference: "CMD-456",
        status: "completed"
      }
    ];
  }

  getDemoCounterparties() {
    return [
      {
        id: 'demo_1',
        name: "Fournisseur Principal",
        account: "FR76 3000 4000 5000 6000 7000 123",
        email: "contact@fournisseur.com",
        currency: "EUR"
      },
      {
        id: 'demo_2',
        name: "Client ABC",
        account: "GB82 WEST 1234 5698 7654 32",
        email: "compta@clientabc.com",
        currency: "GBP"
      }
    ];
  }

  // Méthode pour lancer l'authentification OAuth
  static launchOAuth() {
    const authUrl = 'https://rev-backend-rho.vercel.app/auth/revolut';
    console.log('🔗 Redirection OAuth vers:', authUrl);
    window.location.href = authUrl;
  }

  // Méthode pour traiter le callback OAuth
  static handleOAuthCallback() {
    const urlParams = new URLSearchParams(window.location.search);
    const accessToken = urlParams.get('access_token');
    const error = urlParams.get('error');
    
    if (error) {
      throw new Error(`Erreur OAuth: ${error}`);
    }
    
    if (accessToken) {
      localStorage.setItem('revolut-access-token', accessToken);
      // Nettoyer l'URL
      window.history.replaceState({}, document.title, window.location.pathname);
      return accessToken;
    }
    
    return null;
  }

  // Vérifier si on est dans le callback OAuth
  static isOAuthCallback() {
    return window.location.search.includes('access_token=') || 
           window.location.search.includes('error=');
  }
}

export default RevolutAPI;