const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();

// Middleware CORS pour autoriser les requêtes depuis Vue.js
app.use(cors({
  origin: 'http://localhost:5173', // URL de ton frontend Vue.js
  credentials: true
}));

app.use(express.json());

// Route santé
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Backend proxy Revolut opérationnel' });
});

// Route proxy pour les comptes
app.get('/api/accounts', async (req, res) => {
  try {
    const apiKey = req.headers.authorization?.replace('Bearer ', '');
    
    if (!apiKey) {
      return res.status(401).json({ error: 'Clé API manquante' });
    }

    console.log('🔐 Tentative de connexion à Revolut Sandbox...');
    
    const response = await axios.get('https://sandbox-b2b.revolut.com/api/1.0/accounts', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    console.log('✅ Comptes récupérés avec succès');
    res.json(response.data);
    
  } catch (error) {
    console.error('❌ Erreur récupération comptes:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      res.status(401).json({ error: 'Clé API invalide' });
    } else if (error.code === 'ECONNREFUSED') {
      res.status(503).json({ error: 'Service Revolut indisponible' });
    } else {
      res.status(500).json({ 
        error: 'Erreur lors de la récupération des comptes',
        details: error.response?.data || error.message 
      });
    }
  }
});

// Route proxy pour les transactions
app.get('/api/transactions', async (req, res) => {
  try {
    const apiKey = req.headers.authorization?.replace('Bearer ', '');
    
    if (!apiKey) {
      return res.status(401).json({ error: 'Clé API manquante' });
    }

    const response = await axios.get('https://sandbox-b2b.revolut.com/api/1.0/transactions', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      params: {
        limit: req.query.limit || 50
      },
      timeout: 10000
    });
    
    res.json(response.data);
    
  } catch (error) {
    console.error('Erreur récupération transactions:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Erreur lors de la récupération des transactions',
      details: error.response?.data || error.message 
    });
  }
});

// Route proxy pour les bénéficiaires
app.get('/api/counterparties', async (req, res) => {
  try {
    const apiKey = req.headers.authorization?.replace('Bearer ', '');
    
    if (!apiKey) {
      return res.status(401).json({ error: 'Clé API manquante' });
    }

    const response = await axios.get('https://sandbox-b2b.revolut.com/api/1.0/counterparties', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    res.json(response.data);
    
  } catch (error) {
    console.error('Erreur récupération bénéficiaires:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Erreur lors de la récupération des bénéficiaires',
      details: error.response?.data || error.message 
    });
  }
});

// Test de connexion
app.get('/api/test', async (req, res) => {
  try {
    const apiKey = req.headers.authorization?.replace('Bearer ', '');
    
    if (!apiKey) {
      return res.status(401).json({ error: 'Clé API manquante' });
    }

    const response = await axios.get('https://sandbox-b2b.revolut.com/api/1.0/accounts', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    res.json({ 
      success: true, 
      message: '✅ Connexion à Revolut Sandbox réussie!',
      status: response.status
    });
    
  } catch (error) {
    console.error('Test connexion échoué:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      res.status(401).json({ 
        success: false, 
        error: '❌ Clé API invalide ou expirée' 
      });
    } else {
      res.status(500).json({ 
        success: false, 
        error: '❌ Erreur de connexion à Revolut',
        details: error.response?.data || error.message 
      });
    }
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Backend proxy Revolut démarré sur le port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 Prêt à recevoir les requêtes du frontend Vue.js`);
});