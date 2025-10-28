import axios from 'axios';

class RevolutAPI {
  constructor(apiKey, environment = 'sandbox') {
    this.apiKey = apiKey;
    this.environment = environment;
    
    // Utilise notre backend proxy au lieu de l'API directe
    this.baseURL = 'http://localhost:3001/api';
    
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
  }

  // Tester la connexion
  async testConnection() {
    try {
      const response = await this.client.get('/test');
      return {
        success: true,
        message: response.data.message
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.message
      };
    }
  }

  // Récupérer les comptes
  async getAccounts() {
    try {
      const response = await this.client.get('/accounts');
      
      return response.data.map(account => ({
        id: account.id,
        name: account.name || `Compte ${account.currency}`,
        currency: account.currency,
        balance: account.balance,
        availableBalance: account.available_balance || account.balance
      }));
    } catch (error) {
      console.error('Erreur récupération comptes:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error || 'Erreur lors de la récupération des comptes');
    }
  }

  // Récupérer les transactions
  async getTransactions(limit = 50) {
    try {
      const response = await this.client.get('/transactions', {
        params: { limit }
      });
      
      return response.data.map(transaction => ({
        id: transaction.id,
        description: transaction.legs?.[0]?.description || 'Transaction',
        amount: parseFloat(transaction.legs?.[0]?.amount || 0),
        currency: transaction.legs?.[0]?.currency || 'EUR',
        date: transaction.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
        type: this.getTransactionType(transaction),
        counterparty: this.getCounterpartyName(transaction),
        reference: transaction.reference || '',
        status: transaction.state || 'completed'
      }));
    } catch (error) {
      console.error('Erreur récupération transactions:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error || 'Erreur lors de la récupération des transactions');
    }
  }

  // Récupérer les bénéficiaires
  async getCounterparties() {
    try {
      const response = await this.client.get('/counterparties');
      
      return response.data.map(counterparty => ({
        id: counterparty.id,
        name: counterparty.name,
        account: counterparty.accounts?.[0]?.account_no || '',
        email: counterparty.email || '',
        currency: counterparty.accounts?.[0]?.currency || 'EUR'
      }));
    } catch (error) {
      console.error('Erreur récupération bénéficiaires:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error || 'Erreur lors de la récupération des bénéficiaires');
    }
  }

  // Méthodes utilitaires
  getTransactionType(transaction) {
    const amount = parseFloat(transaction.legs?.[0]?.amount || 0);
    if (amount > 0) return 'incoming';
    if (amount < 0) return 'outgoing';
    return 'transfer';
  }

  getCounterpartyName(transaction) {
    return transaction.counterparty?.name || 
           transaction.merchant?.name || 
           'Revolut';
  }
}

export default RevolutAPI;