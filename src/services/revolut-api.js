// Service pour l'API Revolut Business
import axios from 'axios';

class RevolutAPI {
  constructor(apiKey, environment = 'sandbox') {
    this.apiKey = apiKey;
    this.environment = environment;
    this.baseURL = environment === 'production' 
      ? 'https://b2b.revolut.com/api/1.0'
      : 'https://sandbox-b2b.revolut.com/api/1.0';
    
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
  }

  // Tester la connexion
  async testConnection() {
    try {
      const response = await this.client.get('/accounts');
      return response.status === 200;
    } catch (error) {
      throw new Error('Erreur de connexion: ' + error.message);
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
      console.error('Erreur récupération comptes:', error);
      throw error;
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
        description: transaction.legs[0]?.description || 'Transaction',
        amount: parseFloat(transaction.legs[0]?.amount || 0),
        currency: transaction.legs[0]?.currency || 'EUR',
        date: transaction.created_at.split('T')[0],
        type: this.getTransactionType(transaction),
        counterparty: this.getCounterpartyName(transaction),
        reference: transaction.reference,
        status: transaction.state
      }));
    } catch (error) {
      console.error('Erreur récupération transactions:', error);
      throw error;
    }
  }

  // Récupérer les bénéficiaires
  async getCounterparties() {
    try {
      const response = await this.client.get('/counterparties');
      return response.data.map(counterparty => ({
        id: counterparty.id,
        name: counterparty.name,
        account: counterparty.accounts[0]?.account_no || '',
        email: counterparty.email || '',
        currency: counterparty.accounts[0]?.currency || 'EUR'
      }));
    } catch (error) {
      console.error('Erreur récupération bénéficiaires:', error);
      throw error;
    }
  }

  // Créer un bénéficiaire
  async createCounterparty(counterpartyData) {
    try {
      const response = await this.client.post('/counterparties', counterpartyData);
      return response.data;
    } catch (error) {
      console.error('Erreur création bénéficiaire:', error);
      throw error;
    }
  }

  // Effectuer un paiement
  async createPayment(paymentData) {
    try {
      const response = await this.client.post('/pay', paymentData);
      return response.data;
    } catch (error) {
      console.error('Erreur création paiement:', error);
      throw error;
    }
  }

  // Méthodes utilitaires
  getTransactionType(transaction) {
    const amount = parseFloat(transaction.legs[0]?.amount || 0);
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