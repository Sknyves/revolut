<template>
  <div id="app">
    <header class="header">
      <h1>🏦 Mon Dashboard Revolut Business</h1>
      <!-- Dans votre App.vue existant, ajoutez cette ligne où vous voulez -->
<RevolutConnect 
  :connected="apiStatus === 'connected'" 
  @connected="onApiConnected"
  @disconnected="onApiDisconnected"
/>
      <div class="header-info">
        <p>Solde total: <strong>{{ formattedTotalBalance }}</strong></p>
        <p>{{ currentDate }}</p>
        <div class="api-status" :class="apiStatus">
          {{ apiStatus === 'connected' ? '✅ Connecté' : '🔌 Mode démo' }}
        </div>
      </div>
    </header>
    
    <main class="main-content">
      <!-- Navigation rapide -->
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

      <!-- Section Tableau de Bord -->
      <section v-if="currentSection === 'dashboard'" class="section">
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon">💰</div>
            <div class="stat-info">
              <h3>Solde Total</h3>
              <p class="stat-value">{{ formattedTotalBalance }}</p>
              <span class="stat-trend positive">+12% ce mois</span>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon">📈</div>
            <div class="stat-info">
              <h3>Revenus du mois</h3>
              <p class="stat-value">{{ formattedMonthlyIncome }}</p>
              <span class="stat-trend positive">+8% vs mois dernier</span>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon">📉</div>
            <div class="stat-info">
              <h3>Dépenses du mois</h3>
              <p class="stat-value">{{ formattedMonthlyExpenses }}</p>
              <span class="stat-trend negative">-5% vs mois dernier</span>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon">🔢</div>
            <div class="stat-info">
              <h3>Transactions</h3>
              <p class="stat-value">{{ totalTransactions }}</p>
              <span>{{ pendingTransactions }} en attente</span>
            </div>
          </div>
        </div>

        <!-- Graphiques -->
        <div class="charts-grid">
          <div class="chart-card">
            <h3>Évolution des soldes</h3>
            <ChartComponent 
              type="line"
              :data="balanceChartData"
              :options="balanceChartOptions"
            />
          </div>
          
          <div class="chart-card">
            <h3>Répartition des dépenses</h3>
            <ChartComponent 
              type="doughnut"
              :data="expensesChartData"
              :options="expensesChartOptions"
            />
          </div>
        </div>

        <!-- Dernières transactions rapides -->
        <div class="recent-activity">
          <h3>Activité récente</h3>
          <div class="activity-list">
            <div 
              v-for="transaction in recentActivity" 
              :key="transaction.id"
              class="activity-item"
            >
              <div class="activity-icon" :class="transaction.type">
                {{ getTransactionIcon(transaction.type) }}
              </div>
              <div class="activity-details">
                <strong>{{ transaction.description }}</strong>
                <span>{{ formatDate(transaction.date) }}</span>
              </div>
              <div class="activity-amount" :class="transaction.amount >= 0 ? 'positive' : 'negative'">
                {{ formatBalance(transaction.amount, transaction.currency) }}
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Section Comptes -->
      <section v-if="currentSection === 'accounts'" class="section">
        <div class="section-header">
          <h2>Mes Comptes</h2>
          <div class="account-summary">
            <div class="summary-item">
              <span>Total actifs</span>
              <strong>{{ formattedTotalBalance }}</strong>
            </div>
            <div class="summary-item">
              <span>Nombre de comptes</span>
              <strong>{{ accounts.length }}</strong>
            </div>
          </div>
        </div>

        <div class="accounts-grid">
          <div 
            v-for="account in accounts" 
            :key="account.id"
            class="account-card"
            @click="selectAccount(account)"
            :class="{ selected: selectedAccount?.id === account.id }"
          >
            <div class="account-header">
              <h3>{{ account.name }}</h3>
              <span class="currency-badge">{{ account.currency }}</span>
            </div>
            <p class="balance">{{ formatBalance(account.balance, account.currency) }}</p>
            <div class="account-actions">
              <button @click.stop="openPaymentModal(account)" class="btn-sm btn-primary">
                Payer
              </button>
              <button @click.stop="openTransferModal(account)" class="btn-sm btn-secondary">
                Transférer
              </button>
            </div>
          </div>
        </div>

        <!-- Graphique de répartition -->
        <div class="chart-card">
          <h3>Répartition par devise</h3>
          <ChartComponent 
            type="pie"
            :data="currencyDistributionData"
            :options="currencyDistributionOptions"
          />
        </div>
      </section>

      <!-- Section Transactions -->
      <section v-if="currentSection === 'transactions'" class="section">
        <div class="section-header">
          <h2>Dernières Transactions</h2>
          <div class="controls">
            <select v-model="transactionFilter" class="filter-select">
              <option value="all">Toutes les transactions</option>
              <option value="incoming">Entrées seulement</option>
              <option value="outgoing">Sorties seulement</option>
            </select>
            
            <div class="export-options">
              <select v-model="exportFormat" class="format-select">
                <option value="csv">CSV</option>
                <option value="json">JSON</option>
                <option value="pdf">PDF</option>
                <option value="excel">Excel</option>
              </select>
              <button @click="exportTransactions" class="btn-primary">
                📤 Exporter
              </button>
            </div>
          </div>
        </div>

        <!-- Filtres avancés -->
        <div class="advanced-filters">
          <div class="filter-group">
            <label>Période:</label>
            <select v-model="dateFilter">
              <option value="all">Toutes les dates</option>
              <option value="today">Aujourd'hui</option>
              <option value="week">Cette semaine</option>
              <option value="month">Ce mois</option>
              <option value="quarter">Ce trimestre</option>
              <option value="year">Cette année</option>
              <option value="custom">Personnalisée</option>
            </select>
          </div>
          
          <div v-if="dateFilter === 'custom'" class="filter-group">
            <label>Du:</label>
            <input type="date" v-model="customDateStart">
            <label>Au:</label>
            <input type="date" v-model="customDateEnd">
          </div>
          
          <div class="filter-group">
            <label>Devise:</label>
            <select v-model="currencyFilter">
              <option value="all">Toutes les devises</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
              <option value="USD">USD</option>
              <option value="CHF">CHF</option>
            </select>
          </div>
          
          <div class="filter-group">
            <label>Statut:</label>
            <select v-model="statusFilter">
              <option value="all">Tous les statuts</option>
              <option value="completed">Complétées</option>
              <option value="pending">En attente</option>
              <option value="failed">Échouées</option>
            </select>
          </div>
        </div>

        <!-- Résumé des filtres -->
        <div v-if="hasActiveFilters" class="filter-summary">
          <span>Filtres actifs:</span>
          <div class="filter-tags">
            <span v-if="transactionFilter !== 'all'" class="filter-tag">
              {{ transactionFilter === 'incoming' ? 'Entrées' : 'Sorties' }}
              <button @click="transactionFilter = 'all'">×</button>
            </span>
            <span v-if="dateFilter !== 'all'" class="filter-tag">
              {{ getDateFilterText }}
              <button @click="dateFilter = 'all'">×</button>
            </span>
            <span v-if="currencyFilter !== 'all'" class="filter-tag">
              {{ currencyFilter }}
              <button @click="currencyFilter = 'all'">×</button>
            </span>
            <span v-if="statusFilter !== 'all'" class="filter-tag">
              {{ statusFilter === 'completed' ? 'Complétées' : statusFilter === 'pending' ? 'En attente' : 'Échouées' }}
              <button @click="statusFilter = 'all'">×</button>
            </span>
            <button @click="clearAllFilters" class="btn-link">Tout effacer</button>
          </div>
        </div>

        <div class="transactions-container">
          <div 
            v-for="transaction in filteredTransactions" 
            :key="transaction.id"
            class="transaction-item"
          >
            <div class="transaction-icon" :class="transaction.type">
              {{ getTransactionIcon(transaction.type) }}
            </div>
            <div class="transaction-details">
              <strong>{{ transaction.description }}</strong>
              <small>{{ formatDate(transaction.date) }} • {{ transaction.counterparty }}</small>
              <span v-if="transaction.reference" class="transaction-reference">
                Réf: {{ transaction.reference }}
              </span>
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

        <div v-if="filteredTransactions.length === 0" class="empty-state">
          <p>📝 Aucune transaction trouvée</p>
        </div>

        <div class="export-preview" v-if="showExportPreview">
          <h4>Aperçu de l'export ({{ filteredTransactions.length }} transactions)</h4>
          <div class="preview-stats">
            <span>Total entrées: {{ formatBalance(previewStats.totalIn, 'EUR') }}</span>
            <span>Total sorties: {{ formatBalance(previewStats.totalOut, 'EUR') }}</span>
            <span>Solde net: {{ formatBalance(previewStats.netBalance, 'EUR') }}</span>
          </div>
        </div>
      </section>

      <!-- Section Paiements -->
      <section v-if="currentSection === 'payments'" class="section">
        <div class="section-header">
          <h2>Effectuer un Paiement</h2>
        </div>

        <div class="payment-container">
          <form @submit.prevent="submitPayment" class="payment-form">
            <div class="form-section">
              <h3>📋 Informations de paiement</h3>
              
              <div class="form-row">
                <div class="form-group">
                  <label>Compte source</label>
                  <select v-model="paymentData.sourceAccount" required>
                    <option v-for="account in accounts" :key="account.id" :value="account.id">
                      {{ account.name }} ({{ formatBalance(account.balance, account.currency) }})
                    </option>
                  </select>
                </div>
                <div class="form-group">
                  <label>Montant</label>
                  <div class="amount-input">
                    <input 
                      v-model="paymentData.amount"
                      type="number" 
                      step="0.01"
                      placeholder="0.00"
                      required
                    >
                    <select v-model="paymentData.currency">
                      <option value="EUR">EUR</option>
                      <option value="GBP">GBP</option>
                      <option value="USD">USD</option>
                      <option value="CHF">CHF</option>
                    </select>
                  </div>
                </div>
              </div>

              <div class="form-group">
                <label>Bénéficiaire</label>
                <select v-model="paymentData.counterpartyId" required>
                  <option value="">Sélectionner un bénéficiaire</option>
                  <option v-for="counterparty in counterparties" :key="counterparty.id" :value="counterparty.id">
                    {{ counterparty.name }} ({{ counterparty.account }})
                  </option>
                </select>
                <button type="button" @click="showAddCounterparty = true" class="btn-link">
                  + Ajouter un nouveau bénéficiaire
                </button>
              </div>

              <div class="form-group">
                <label>Référence du paiement</label>
                <input 
                  v-model="paymentData.reference"
                  type="text" 
                  placeholder="Ex: Facture F-2024-001"
                >
              </div>
            </div>

            <div class="payment-summary" v-if="paymentData.amount > 0">
              <h3>📊 Récapitulatif</h3>
              <div class="summary-line">
                <span>Montant:</span>
                <strong>{{ formatBalance(paymentData.amount, paymentData.currency) }}</strong>
              </div>
              <div class="summary-line">
                <span>Frais estimés:</span>
                <strong>{{ formatBalance(0, paymentData.currency) }}</strong>
              </div>
              <div class="summary-line total">
                <span>Total à débiter:</span>
                <strong>{{ formatBalance(paymentData.amount, paymentData.currency) }}</strong>
              </div>
            </div>

            <div class="form-actions">
              <button type="button" @click="resetPayment" class="btn-secondary">
                Annuler
              </button>
              <button type="submit" :disabled="!canSubmitPayment" class="btn-primary">
                💳 Confirmer le paiement
              </button>
            </div>
          </form>

          <!-- Historique des paiements récents -->
          <div class="recent-payments">
            <h3>🕐 Paiements récents</h3>
            <div v-if="recentPayments.length > 0">
              <div 
                v-for="payment in recentPayments" 
                :key="payment.id"
                class="recent-payment-item"
              >
                <div class="payment-info">
                  <strong>{{ payment.counterparty }}</strong>
                  <span>{{ formatBalance(payment.amount, payment.currency) }}</span>
                </div>
                <div class="payment-meta">
                  <small>{{ formatDate(payment.date) }}</small>
                  <span class="payment-status" :class="payment.status">
                    {{ payment.status }}
                  </span>
                </div>
              </div>
            </div>
            <div v-else class="empty-state">
              <p>Aucun paiement récent</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Section Bénéficiaires -->
      <section v-if="currentSection === 'counterparties'" class="section">
        <div class="section-header">
          <h2>Gestion des Bénéficiaires</h2>
          <div class="section-actions">
            <button @click="exportCounterparties" class="btn-secondary">
              👥 Exporter les bénéficiaires
            </button>
            <button @click="showAddCounterparty = true" class="btn-primary">
              + Nouveau bénéficiaire
            </button>
          </div>
        </div>
        
        <div class="counterparties-grid">
          <div 
            v-for="counterparty in counterparties" 
            :key="counterparty.id"
            class="counterparty-card"
          >
            <div class="counterparty-header">
              <h3>{{ counterparty.name }}</h3>
              <div class="counterparty-actions">
                <button @click="editCounterparty(counterparty)" class="btn-sm btn-secondary">
                  ✏️
                </button>
                <button @click="deleteCounterparty(counterparty.id)" class="btn-sm btn-danger">
                  🗑️
                </button>
              </div>
            </div>
            
            <div class="counterparty-details">
              <div class="detail-item">
                <span class="label">Compte:</span>
                <span class="value">{{ formatAccountNumber(counterparty.account) }}</span>
              </div>
              <div v-if="counterparty.email" class="detail-item">
                <span class="label">Email:</span>
                <span class="value">{{ counterparty.email }}</span>
              </div>
              <div class="detail-item">
                <span class="label">Devise:</span>
                <span class="currency-badge">{{ counterparty.currency }}</span>
              </div>
            </div>
            
            <div class="counterparty-footer">
              <button 
                @click="quickPayment(counterparty)" 
                class="btn-sm btn-primary"
                :disabled="!hasBalanceForCurrency(counterparty.currency)"
              >
                Payer maintenant
              </button>
            </div>
          </div>
        </div>

        <div v-if="counterparties.length === 0" class="empty-state">
          <p>👥 Aucun bénéficiaire enregistré</p>
          <button @click="showAddCounterparty = true" class="btn-primary">
            Ajouter votre premier bénéficiaire
          </button>
        </div>
      </section>

      <!-- Section Export Avancé -->
      <section v-if="currentSection === 'exports'" class="section">
        <div class="exports-header">
          <h2>📁 Export des Données</h2>
          <p>Exportez vos données financières pour la comptabilité ou l'analyse</p>
        </div>

        <div class="exports-grid">
          <!-- Export Complet -->
          <div class="export-card">
            <div class="export-icon">📊</div>
            <h3>Export Complet</h3>
            <p>Toutes vos données (comptes, transactions, bénéficiaires) en un seul fichier</p>
            <div class="export-options">
              <select v-model="fullExportFormat">
                <option value="json">JSON</option>
                <option value="csv">CSV Bundle</option>
                <option value="excel">Excel Multi-feuilles</option>
              </select>
              <button @click="exportFullData" class="btn-primary">
                Télécharger
              </button>
            </div>
          </div>

          <!-- Export Comptable -->
          <div class="export-card">
            <div class="export-icon">🧮</div>
            <h3>Export Comptable</h3>
            <p>Format compatible avec les logiciels de comptabilité</p>
            <div class="export-options">
              <select v-model="accountingFormat">
                <option value="fec">FEC (Standard Français)</option>
                <option value="csv">CSV Comptable</option>
                <option value="quickbooks">QuickBooks</option>
              </select>
              <button @click="exportAccountingData" class="btn-primary">
                Générer
              </button>
            </div>
          </div>

          <!-- Export Périodique -->
          <div class="export-card">
            <div class="export-icon">📅</div>
            <h3>Export Périodique</h3>
            <p>Export automatique par période</p>
            <div class="period-options">
              <select v-model="periodExport.period">
                <option value="daily">Quotidien</option>
                <option value="weekly">Hebdomadaire</option>
                <option value="monthly">Mensuel</option>
                <option value="quarterly">Trimestriel</option>
              </select>
              <select v-model="periodExport.format">
                <option value="csv">CSV</option>
                <option value="excel">Excel</option>
                <option value="pdf">PDF</option>
              </select>
              <button @click="schedulePeriodicExport" class="btn-primary">
                Programmer
              </button>
            </div>
          </div>

          <!-- Templates d'export -->
          <div class="export-card">
            <div class="export-icon">📋</div>
            <h3>Templates Prédéfinis</h3>
            <p>Modèles d'export pour différents besoins</p>
            <div class="template-options">
              <button @click="useTemplate('compta')" class="btn-secondary">
                Comptabilité
              </button>
              <button @click="useTemplate('fiscal')" class="btn-secondary">
                Fiscalité
              </button>
              <button @click="useTemplate('audit')" class="btn-secondary">
                Audit
              </button>
            </div>
          </div>
        </div>

        <!-- Historique des exports -->
        <div class="exports-history">
          <h3>Historique des Exports</h3>
          <div v-if="exportHistory.length > 0" class="history-list">
            <div 
              v-for="exportItem in exportHistory" 
              :key="exportItem.id"
              class="history-item"
            >
              <div class="history-info">
                <strong>{{ exportItem.filename }}</strong>
                <span>{{ formatDate(exportItem.date) }} • {{ exportItem.type }} • {{ exportItem.format }}</span>
              </div>
              <div class="history-actions">
                <button @click="downloadAgain(exportItem)" class="btn-sm btn-secondary">
                  Télécharger à nouveau
                </button>
                <button @click="deleteExport(exportItem.id)" class="btn-sm btn-danger">
                  Supprimer
                </button>
              </div>
            </div>
          </div>
          <div v-else class="empty-state">
            <p>Aucun export effectué</p>
          </div>
        </div>
      </section>

      <!-- Section Paramètres API -->
      <section v-if="currentSection === 'settings'" class="section">
        <div class="api-config">
          <h2>Configuration de l'API Revolut</h2>
          <div class="form-group">
            <label>Clé API</label>
            <input 
              v-model="apiConfig.apiKey" 
              type="text" 
              placeholder="Votre clé API ici"
              @input="validateApiKey"
            >
          </div>
          
          <div class="form-group">
            <label>Environnement</label>
            <select v-model="apiConfig.environment">
              <option value="sandbox">Sandbox</option>
              <option value="production">Production</option>
            </select>
          </div>
          
          <div class="api-actions">
            <button @click="testConnection" class="btn-primary">
              🔌 Tester la connexion
            </button>
            <button @click="saveApiConfig" class="btn-secondary">
              💾 Sauvegarder la configuration
            </button>
          </div>
          
          <div v-if="connectionTestResult" class="test-result" :class="connectionTestResult.type">
            {{ connectionTestResult.message }}
          </div>
        </div>
        
        <div class="api-info">
          <h3>Informations API</h3>
          <div class="info-grid">
            <div class="info-item">
              <span>Statut de la connexion:</span>
              <strong>{{ apiStatusText }}</strong>
            </div>
            <div class="info-item">
              <span>Dernière synchronisation:</span>
              <strong>{{ lastSync || 'Jamais' }}</strong>
            </div>
            <div class="info-item">
              <span>Environnement actuel:</span>
              <strong>{{ apiConfig.environment }}</strong>
            </div>
          </div>
        </div>
      </section>
    </main>

    <!-- Modal confirmation d'export -->
    <div v-if="showExportModal" class="modal-overlay">
      <div class="modal">
        <div class="modal-header">
          <h3>Confirmation d'export</h3>
          <button @click="showExportModal = false" class="btn-close">×</button>
        </div>
        
        <div class="modal-content">
          <p>Prêt à exporter <strong>{{ exportDataCount }}</strong> éléments au format <strong>{{ currentExportFormat }}</strong></p>
          
          <div v-if="currentExportType === 'transactions'" class="export-summary">
            <div class="summary-item">
              <span>Période:</span>
              <strong>{{ getExportDateRange }}</strong>
            </div>
            <div class="summary-item">
              <span>Filtres appliqués:</span>
              <strong>{{ hasActiveFilters ? 'Oui' : 'Non' }}</strong>
            </div>
          </div>
          
          <div class="modal-actions">
            <button @click="showExportModal = false" class="btn-secondary">
              Annuler
            </button>
            <button @click="confirmExport" class="btn-primary">
              ✅ Confirmer l'export
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modals existants -->
    <!-- ... -->
  </div>
</template>

<script>
import ChartComponent from './components/ChartComponent.vue';
import RevolutAPI from './services/revolut-api';
import { exportToCSV, exportToJSON, exportToExcel, generatePDF } from './services/export-utils';

// Importez le composant
import RevolutConnect from './components/RevolutConnect.vue';
export default {
  name: 'App',
  components: {
    ChartComponent,
    RevolutConnect
  },
  data() {
    return {
      currentSection: 'dashboard',
      selectedAccount: null,
      transactionFilter: 'all',
      loading: false,
      loadingMessage: 'Chargement en cours...',
      showAddCounterparty: false,
      editingCounterparty: null,
      apiStatus: 'demo', // 'demo', 'connected', 'error'
      connectionTestResult: null,
      lastSync: null,
      
      tabs: [
        { id: 'dashboard', name: 'Dashboard', icon: '📊' },
        { id: 'accounts', name: 'Comptes', icon: '💰' },
        { id: 'transactions', name: 'Transactions', icon: '📝' },
        { id: 'payments', name: 'Paiements', icon: '💳' },
        { id: 'counterparties', name: 'Bénéficiaires', icon: '👥' },
        { id: 'exports', name: 'Exports', icon: '📁' },
        { id: 'settings', name: 'API', icon: '🔧' }
      ],
      
      apiConfig: {
        apiKey: '',
        environment: 'sandbox'
      },
      
      // Données pour les graphiques
      balanceChartData: {
        labels: [],
        datasets: [
          {
            label: 'Solde EUR',
            data: [],
            borderColor: '#667eea',
            backgroundColor: 'rgba(102, 126, 234, 0.1)',
            tension: 0.4,
            fill: true
          }
        ]
      },
      
      expensesChartData: {
        labels: [],
        datasets: [
          {
            data: [],
            backgroundColor: [
              '#667eea', '#764ba2', '#f093fb', '#f5576c',
              '#4facfe', '#00f2fe', '#43e97b', '#38f9d7'
            ]
          }
        ]
      },
      
      currencyDistributionData: {
        labels: [],
        datasets: [
          {
            data: [],
            backgroundColor: [
              '#667eea', '#764ba2', '#f093fb', '#f5576c'
            ]
          }
        ]
      },
      
      // Options des graphiques
      balanceChartOptions: {
        plugins: {
          title: {
            display: true,
            text: 'Évolution sur 30 jours'
          }
        },
        scales: {
          y: {
            beginAtZero: false
          }
        }
      },
      
      expensesChartOptions: {
        plugins: {
          legend: {
            position: 'bottom'
          }
        }
      },
      
      currencyDistributionOptions: {
        plugins: {
          legend: {
            position: 'bottom'
          }
        }
      },
      
      // Données existantes...
      accounts: [],
      transactions: [],
      counterparties: [],
      recentPayments: [],
      paymentData: {
        sourceAccount: '',
        amount: 0,
        currency: 'EUR',
        counterpartyId: '',
        reference: ''
      },
      counterpartyForm: {
        name: '',
        account: '',
        email: '',
        currency: 'EUR'
      },
      
      // Nouvelles données pour l'export
      showExportModal: false,
      showExportPreview: false,
      exportFormat: 'csv',
      fullExportFormat: 'json',
      accountingFormat: 'fec',
      currentExportType: '',
      currentExportData: null,
      
      // Filtres avancés
      dateFilter: 'all',
      currencyFilter: 'all',
      statusFilter: 'all',
      customDateStart: '',
      customDateEnd: '',
      
      // Export périodique
      periodExport: {
        period: 'monthly',
        format: 'excel'
      },
      
      // Historique des exports
      exportHistory: []
    };
  },
  computed: {
    totalBalance() {
      return this.accounts.reduce((total, account) => total + account.balance, 0);
    },
    
    formattedTotalBalance() {
      return this.formatBalance(this.totalBalance, 'EUR');
    },
    
    monthlyIncome() {
      const currentMonth = new Date().getMonth();
      return this.transactions
        .filter(t => t.amount > 0 && new Date(t.date).getMonth() === currentMonth)
        .reduce((total, t) => total + t.amount, 0);
    },
    
    formattedMonthlyIncome() {
      return this.formatBalance(this.monthlyIncome, 'EUR');
    },
    
    monthlyExpenses() {
      const currentMonth = new Date().getMonth();
      return this.transactions
        .filter(t => t.amount < 0 && new Date(t.date).getMonth() === currentMonth)
        .reduce((total, t) => total + Math.abs(t.amount), 0);
    },
    
    formattedMonthlyExpenses() {
      return this.formatBalance(this.monthlyExpenses, 'EUR');
    },
    
    totalTransactions() {
      return this.transactions.length;
    },
    
    pendingTransactions() {
      return this.transactions.filter(t => t.status === 'pending').length;
    },
    
    recentActivity() {
      return this.transactions.slice(0, 5);
    },
    
    currentDate() {
      return new Date().toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    },
    
    apiStatusText() {
      const statusMap = {
        demo: 'Mode démo',
        connected: 'Connecté',
        error: 'Erreur de connexion'
      };
      return statusMap[this.apiStatus];
    },
    
    // Computed pour les filteredTransactions (existant)
    filteredTransactions() {
      let filtered = this.transactions;
      
      // Filtre par type
      if (this.transactionFilter === 'incoming') {
        filtered = filtered.filter(t => t.amount > 0);
      } else if (this.transactionFilter === 'outgoing') {
        filtered = filtered.filter(t => t.amount < 0);
      }
      
      // Filtre par date
      if (this.dateFilter !== 'all') {
        filtered = this.filterByDate(filtered);
      }
      
      // Filtre par devise
      if (this.currencyFilter !== 'all') {
        filtered = filtered.filter(t => t.currency === this.currencyFilter);
      }
      
      // Filtre par statut
      if (this.statusFilter !== 'all') {
        filtered = filtered.filter(t => t.status === this.statusFilter);
      }
      
      return filtered;
    },
    
    hasActiveFilters() {
      return this.transactionFilter !== 'all' || 
             this.dateFilter !== 'all' || 
             this.currencyFilter !== 'all' || 
             this.statusFilter !== 'all';
    },
    
    getDateFilterText() {
      const texts = {
        today: 'Aujourd\'hui',
        week: 'Cette semaine',
        month: 'Ce mois',
        quarter: 'Ce trimestre',
        year: 'Cette année',
        custom: 'Personnalisée'
      };
      return texts[this.dateFilter] || this.dateFilter;
    },
    
    previewStats() {
      const totalIn = this.filteredTransactions
        .filter(t => t.amount > 0)
        .reduce((sum, t) => sum + t.amount, 0);
      
      const totalOut = this.filteredTransactions
        .filter(t => t.amount < 0)
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);
      
      return {
        totalIn,
        totalOut,
        netBalance: totalIn - totalOut
      };
    },
    
    exportDataCount() {
      switch (this.currentExportType) {
        case 'transactions': return this.filteredTransactions.length;
        case 'accounts': return this.accounts.length;
        case 'counterparties': return this.counterparties.length;
        case 'full': return this.accounts.length + this.transactions.length + this.counterparties.length;
        default: return 0;
      }
    },
    
    currentExportFormat() {
      return this.exportFormat;
    },
    
    getExportDateRange() {
      if (this.dateFilter === 'custom' && this.customDateStart && this.customDateEnd) {
        return `${this.customDateStart} au ${this.customDateEnd}`;
      }
      return this.getDateFilterText;
    }
  },
  methods: {
    onApiConnected(apiKey) {
    console.log('✅ Connexion API réussie, token:', apiKey);
    this.apiConfig.apiKey = apiKey;
    this.apiStatus = 'connected';
    this.saveApiConfig();
    this.loadData();
  },
  
  onApiDisconnected() {
    console.log('🔓 Déconnexion API');
    this.apiStatus = 'demo';
    this.apiConfig.apiKey = '';
    localStorage.removeItem('revolut-api-config');
    this.loadData();
  },
    formatBalance(balance, currency) {
      return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: currency
      }).format(balance);
    },
    
    async loadData() {
      this.loading = true;
      this.loadingMessage = 'Chargement des données...';
      
      // Si connecté à l'API, charger les vraies données
      if (this.apiStatus === 'connected') {
        await this.loadDataFromAPI();
      } else {
        // Mode démo avec données simulées
        await this.loadDemoData();
      }
      
      this.loading = false;
      this.lastSync = new Date().toLocaleTimeString('fr-FR');
    },
    
    async loadDemoData() {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Données de simulation
      this.accounts = [
        { id: 1, name: "Compte Principal", currency: "EUR", balance: 12500.50 },
        { id: 2, name: "Compte Épargne", currency: "GBP", balance: 8500.75 },
        { id: 3, name: "Compte USD", currency: "USD", balance: 3200.00 },
        { id: 4, name: "Compte CHF", currency: "CHF", balance: 1500.25 }
      ];
      
      this.transactions = [
        { id: 1, description: "Virement Client ABC", amount: 2500.00, currency: "EUR", date: "2024-01-15", type: "incoming", counterparty: "Client ABC", reference: "FACT-2024-001", status: "completed" },
        { id: 2, description: "Achat Matériel", amount: -450.50, currency: "EUR", date: "2024-01-14", type: "outgoing", counterparty: "Fournisseur XYZ", reference: "CMD-456", status: "completed" },
        { id: 3, description: "Conversion USD/EUR", amount: 1200.00, currency: "EUR", date: "2024-01-13", type: "exchange", counterparty: "Revolut", status: "completed" },
        { id: 4, description: "Frais de service", amount: -25.00, currency: "EUR", date: "2024-01-12", type: "fee", counterparty: "Revolut", status: "completed" },
        { id: 5, description: "Remboursement", amount: 150.00, currency: "EUR", date: "2024-01-11", type: "incoming", counterparty: "Client DEF", reference: "REM-789", status: "completed" }
      ];
      
      this.counterparties = [
        { id: 1, name: "Fournisseur Principal", account: "FR76 3000 4000 5000 6000 7000 123", email: "contact@fournisseur.com", currency: "EUR" },
        { id: 2, name: "Client ABC", account: "GB82 WEST 1234 5698 7654 32", email: "compta@clientabc.com", currency: "GBP" },
        { id: 3, name: "Sous-traitant SARL", account: "US12 3456 7890 1234 5678 90", email: "admin@sous-traitant.com", currency: "USD" }
      ];
      
      this.recentPayments = [
        { id: 1, counterparty: "Fournisseur Principal", amount: -1200.00, currency: "EUR", date: "2024-01-14", status: "completed" },
        { id: 2, counterparty: "Sous-traitant SARL", amount: -800.00, currency: "USD", date: "2024-01-10", status: "completed" }
      ];
      
      // Préparer les données pour les graphiques
      this.prepareChartData();
    },
    
    async loadDataFromAPI() {
      try {
        this.loadingMessage = 'Connexion à Revolut...';
        
        // Ici, on utiliserait la vraie API
        const revolutAPI = new RevolutAPI(this.apiConfig.apiKey, this.apiConfig.environment);
        
        // Récupérer les comptes
        this.loadingMessage = 'Récupération des comptes...';
        const accounts = await revolutAPI.getAccounts();
        this.accounts = accounts;
        
        // Récupérer les transactions
        this.loadingMessage = 'Récupération des transactions...';
        const transactions = await revolutAPI.getTransactions();
        this.transactions = transactions;
        
        // Récupérer les bénéficiaires
        this.loadingMessage = 'Récupération des bénéficiaires...';
        const counterparties = await revolutAPI.getCounterparties();
        this.counterparties = counterparties;
        
        this.prepareChartData();
        
      } catch (error) {
        console.error('Erreur API Revolut:', error);
        this.apiStatus = 'error';
        alert('Erreur de connexion à Revolut. Retour en mode démo.');
        await this.loadDemoData();
      }
    },
    
    prepareChartData() {
      // Données pour le graphique d'évolution des soldes
      const last30Days = Array.from({ length: 30 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (29 - i));
        return date.toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' });
      });
      
      const balanceData = Array.from({ length: 30 }, (_, i) => {
        const baseBalance = 10000;
        const variation = Math.sin(i / 5) * 2000 + Math.random() * 1000;
        return baseBalance + variation;
      });
      
      this.balanceChartData.labels = last30Days;
      this.balanceChartData.datasets[0].data = balanceData;
      
      // Données pour le graphique des dépenses
      const expenseCategories = ['Fournisseurs', 'Salaires', 'Frais', 'Matériel', 'Services', 'Divers'];
      const expenseData = expenseCategories.map(() => Math.random() * 1000 + 500);
      
      this.expensesChartData.labels = expenseCategories;
      this.expensesChartData.datasets[0].data = expenseData;
      
      // Données pour la répartition par devise
      const currencies = this.accounts.map(acc => acc.currency);
      const balances = this.accounts.map(acc => acc.balance);
      
      this.currencyDistributionData.labels = currencies;
      this.currencyDistributionData.datasets[0].data = balances;
    },
    
    async testConnection() {
    if (!this.apiConfig.apiKey) {
      this.connectionTestResult = {
        type: 'error',
        message: '❌ Aucune clé API configurée'
      };
      return;
    }
    
    this.loading = true;
    this.loadingMessage = 'Test de connexion au backend...';
    
    try {
      const revolutAPI = new RevolutAPI(this.apiConfig.apiKey);
      const result = await revolutAPI.testConnection();
      
      if (result.success) {
        this.connectionTestResult = {
          type: 'success',
          message: '✅ Connexion au backend réussie!'
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
  
  async saveApiConfig() {
    if (!this.apiConfig.apiKey) return;
    
    // Sauvegarder en localStorage
    localStorage.setItem('revolut-api-config', JSON.stringify(this.apiConfig));
    
    // Tester la connexion
    await this.testConnection();
    
    if (this.apiStatus === 'connected') {
      alert('Configuration sauvegardée! Données synchronisées avec Revolut.');
    }
  },
    
    disconnectApi() {
      this.apiStatus = 'demo';
      this.apiConfig.apiKey = '';
      this.connectionTestResult = null;
      localStorage.removeItem('revolut-api-config');
      
      // Recharger les données de démo
      this.loadData();
    },
    
    // Méthodes existantes...
    selectAccount(account) {
      this.selectedAccount = account;
      this.currentSection = 'transactions';
    },
    
    openPaymentModal(account) {
      this.paymentData.sourceAccount = account.id;
      this.paymentData.currency = account.currency;
      this.currentSection = 'payments';
    },
    
    openTransferModal(account) {
      alert(`Transfert depuis ${account.name} - Fonctionnalité à venir!`);
    },
    
    async submitPayment() {
      if (!this.canSubmitPayment) return;
      
      this.loading = true;
      this.loadingMessage = 'Envoi du paiement...';
      
      try {
        // Simulation d'envoi de paiement
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const counterparty = this.counterparties.find(c => c.id === this.paymentData.counterpartyId);
        const account = this.accounts.find(a => a.id === this.paymentData.sourceAccount);
        
        // Ajouter aux paiements récents
        this.recentPayments.unshift({
          id: Date.now(),
          counterparty: counterparty.name,
          amount: -this.paymentData.amount,
          currency: this.paymentData.currency,
          date: new Date().toISOString().split('T')[0],
          status: 'completed'
        });
        
        // Ajouter aux transactions
        this.transactions.unshift({
          id: Date.now(),
          description: `Paiement à ${counterparty.name}`,
          amount: -this.paymentData.amount,
          currency: this.paymentData.currency,
          date: new Date().toISOString().split('T')[0],
          type: 'outgoing',
          counterparty: counterparty.name,
          reference: this.paymentData.reference,
          status: 'completed'
        });
        
        // Mettre à jour le solde du compte
        if (account) {
          account.balance -= this.paymentData.amount;
        }
        
        alert(`✅ Paiement de ${this.formatBalance(this.paymentData.amount, this.paymentData.currency)} envoyé avec succès à ${counterparty.name}`);
        
        this.resetPayment();
        this.prepareChartData(); // Mettre à jour les graphiques
        
      } catch (error) {
        alert('❌ Erreur lors du paiement');
      } finally {
        this.loading = false;
      }
    },
    
    resetPayment() {
      this.paymentData = {
        sourceAccount: '',
        amount: 0,
        currency: 'EUR',
        counterpartyId: '',
        reference: ''
      };
    },
    
    quickPayment(counterparty) {
      this.paymentData.counterpartyId = counterparty.id;
      this.paymentData.currency = counterparty.currency;
      
      const matchingAccount = this.accounts.find(acc => acc.currency === counterparty.currency);
      if (matchingAccount) {
        this.paymentData.sourceAccount = matchingAccount.id;
      } else {
        this.paymentData.sourceAccount = this.accounts[0]?.id;
      }
      
      this.currentSection = 'payments';
    },
    
    saveCounterparty() {
      if (this.editingCounterparty) {
        const index = this.counterparties.findIndex(c => c.id === this.editingCounterparty.id);
        if (index !== -1) {
          this.counterparties[index] = { ...this.editingCounterparty, ...this.counterpartyForm };
        }
      } else {
        this.counterparties.push({
          id: Date.now(),
          ...this.counterpartyForm
        });
      }
      
      this.closeModal();
    },
    
    editCounterparty(counterparty) {
      this.editingCounterparty = counterparty;
      this.counterpartyForm = { ...counterparty };
      this.showAddCounterparty = true;
    },
    
    deleteCounterparty(id) {
      if (confirm('Êtes-vous sûr de vouloir supprimer ce bénéficiaire ?')) {
        this.counterparties = this.counterparties.filter(c => c.id !== id);
      }
    },
    
    closeModal() {
      this.showAddCounterparty = false;
      this.editingCounterparty = null;
      this.counterpartyForm = {
        name: '',
        account: '',
        email: '',
        currency: 'EUR'
      };
    },
    
    async exportTransactions() {
      this.currentExportType = 'transactions';
      this.currentExportData = this.filteredTransactions;
      this.showExportModal = true;
    },
    
    async exportAccounts() {
      this.currentExportType = 'accounts';
      this.currentExportData = this.accounts;
      this.performExport();
    },
    
    async exportCounterparties() {
      this.currentExportType = 'counterparties';
      this.currentExportData = this.counterparties;
      this.performExport();
    },
    
    async exportFullData() {
      this.currentExportType = 'full';
      this.currentExportData = {
        accounts: this.accounts,
        transactions: this.transactions,
        counterparties: this.counterparties,
        metadata: {
          exportedAt: new Date().toISOString(),
          totalBalance: this.totalBalance,
          environment: this.apiConfig.environment
        }
      };
      this.performExport();
    },
    
    async exportAccountingData() {
      // Format pour la comptabilité
      const accountingData = this.filteredTransactions.map(transaction => ({
        Date: transaction.date,
        'Numéro de pièce': transaction.reference || '',
        'Compte': this.getAccountingAccount(transaction),
        'Libellé': transaction.description,
        'Débit': transaction.amount < 0 ? Math.abs(transaction.amount) : 0,
        'Crédit': transaction.amount > 0 ? transaction.amount : 0,
        'Devise': transaction.currency,
        'Contrepartie': transaction.counterparty,
        'Statut': this.getStatusText(transaction.status)
      }));
      
      const filename = `comptabilité_revolut_${new Date().toISOString().split('T')[0]}.${this.accountingFormat === 'fec' ? 'txt' : 'csv'}`;
      
      if (this.accountingFormat === 'fec') {
        this.exportFEC(accountingData, filename);
      } else {
        exportToCSV(accountingData, filename);
      }
      
      this.addToExportHistory(filename, 'comptabilité', this.accountingFormat);
    },
    
    getAccountingAccount(transaction) {
      // Logique simplifiée pour déterminer le compte comptable
      if (transaction.amount > 0) return '512000'; // Banque
      if (transaction.type === 'fee') return '658000'; // Frais bancaires
      if (transaction.type === 'outgoing') return '401000'; // Fournisseurs
      return '411000'; // Clients
    },
    
    exportFEC(data, filename) {
      // Format FEC (Fichier des Écritures Comptables) standard français
      const fecHeaders = [
        'JournalCode', 'JournalLib', 'EcritureNum', 'EcritureDate',
        'CompteNum', 'CompteLib', 'CompAuxNum', 'CompAuxLib',
        'PieceRef', 'PieceDate', 'EcritureLib', 'Debit', 'Credit',
        'EcritureLet', 'DateLet', 'ValidDate', 'Montantdevise', 'Idevise'
      ];
      
      const fecData = data.map(row => [
        'BQ', 'Banque', '', row.Date,
        row.Compte, '', '', '',
        row['Numéro de pièce'], row.Date, row.Libellé,
        row.Débit, row.Crédit, '', '', '', '', ''
      ]);
      
      const csvContent = [fecHeaders, ...fecData]
        .map(row => row.map(field => `"${field}"`).join(';'))
        .join('\n');
      
      this.downloadFile(csvContent, filename, 'text/csv;charset=utf-8;');
    },
    
    confirmExport() {
      this.showExportModal = false;
      this.performExport();
    },
    
    async performExport() {
      const timestamp = new Date().toISOString().split('T')[0];
      let filename, content;
      
      try {
        switch (this.currentExportType) {
          case 'transactions':
            filename = `transactions_revolut_${timestamp}.${this.exportFormat}`;
            await this.exportData(this.filteredTransactions, filename, this.exportFormat);
            break;
            
          case 'accounts':
            filename = `comptes_revolut_${timestamp}.${this.exportFormat}`;
            await this.exportData(this.accounts, filename, this.exportFormat);
            break;
            
          case 'counterparties':
            filename = `beneficiaires_revolut_${timestamp}.${this.exportFormat}`;
            await this.exportData(this.counterparties, filename, this.exportFormat);
            break;
            
          case 'full':
            filename = `export_complet_revolut_${timestamp}.${this.fullExportFormat}`;
            await this.exportFullDataFile(this.currentExportData, filename, this.fullExportFormat);
            break;
        }
        
        this.addToExportHistory(filename, this.currentExportType, this.exportFormat);
        
      } catch (error) {
        console.error('Erreur lors de l\'export:', error);
        alert('Erreur lors de l\'export des données');
      }
    },
    
    async exportData(data, filename, format) {
      switch (format) {
        case 'csv':
          exportToCSV(data, filename);
          break;
        case 'json':
          exportToJSON(data, filename);
          break;
        case 'excel':
          await exportToExcel(data, filename);
          break;
        case 'pdf':
          await generatePDF(data, filename);
          break;
      }
    },
    
    async exportFullDataFile(data, filename, format) {
      if (format === 'json') {
        exportToJSON(data, filename);
      } else if (format === 'excel') {
        await exportToExcel(data, filename, true); // Multi-feuilles
      } else if (format === 'csv') {
        // Créer un ZIP avec plusieurs fichiers CSV
        this.exportCSVBundle(data, filename.replace('.csv', '.zip'));
      }
    },
    
    exportCSVBundle(data, filename) {
      // Implémentation simplifiée - en réalité on utiliserait une librairie ZIP
      alert(`Export bundle CSV: ${filename}\nComptes: ${data.accounts.length} lignes\nTransactions: ${data.transactions.length} lignes\nBénéficiaires: ${data.counterparties.length} lignes`);
    },
    
    downloadFile(content, filename, mimeType) {
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    },
    
    addToExportHistory(filename, type, format) {
      this.exportHistory.unshift({
        id: Date.now(),
        filename,
        type,
        format,
        date: new Date().toISOString(),
        size: '~' + Math.round(Math.random() * 1000) + ' KB'
      });
      
      // Sauvegarder dans localStorage
      localStorage.setItem('revolut-export-history', JSON.stringify(this.exportHistory));
    },
    
    downloadAgain(exportItem) {
      alert(`Téléchargement de ${exportItem.filename}`);
      // En réalité, on régénérerait le fichier
    },
    
    deleteExport(id) {
      this.exportHistory = this.exportHistory.filter(item => item.id !== id);
      localStorage.setItem('revolut-export-history', JSON.stringify(this.exportHistory));
    },
    
    schedulePeriodicExport() {
      alert(`Export ${this.periodExport.period} programmé au format ${this.periodExport.format}`);
    },
    
    useTemplate(template) {
      const templates = {
        compta: { format: 'csv', filters: { transactionFilter: 'all', dateFilter: 'month' }},
        fiscal: { format: 'pdf', filters: { transactionFilter: 'all', dateFilter: 'year' }},
        audit: { format: 'excel', filters: { transactionFilter: 'all', dateFilter: 'all' }}
      };
      
      const config = templates[template];
      this.exportFormat = config.format;
      Object.assign(this, config.filters);
      
      this.currentSection = 'transactions';
      alert(`Template "${template}" appliqué`);
    },
    
    // Filtres avancés
    filterByDate(transactions) {
      const now = new Date();
      let startDate, endDate;
      
      switch (this.dateFilter) {
        case 'today':
          startDate = new Date(now.setHours(0, 0, 0, 0));
          endDate = new Date(now.setHours(23, 59, 59, 999));
          break;
        case 'week':
          startDate = new Date(now.setDate(now.getDate() - now.getDay()));
          endDate = new Date(now.setDate(now.getDate() - now.getDay() + 6));
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          break;
        case 'quarter':
          const quarter = Math.floor(now.getMonth() / 3);
          startDate = new Date(now.getFullYear(), quarter * 3, 1);
          endDate = new Date(now.getFullYear(), (quarter + 1) * 3, 0);
          break;
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1);
          endDate = new Date(now.getFullYear(), 11, 31);
          break;
        case 'custom':
          if (this.customDateStart && this.customDateEnd) {
            startDate = new Date(this.customDateStart);
            endDate = new Date(this.customDateEnd);
          }
          break;
      }
      
      if (startDate && endDate) {
        return transactions.filter(transaction => {
          const transactionDate = new Date(transaction.date);
          return transactionDate >= startDate && transactionDate <= endDate;
        });
      }
      
      return transactions;
    },
    
    clearAllFilters() {
      this.transactionFilter = 'all';
      this.dateFilter = 'all';
      this.currencyFilter = 'all';
      this.statusFilter = 'all';
      this.customDateStart = '';
      this.customDateEnd = '';
    },

    // Ajout : formatDate + getStatusText
    formatDate(date) {
      if (!date) return '';
      const d = new Date(date);
      return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
    },

    getStatusText(status) {
      const map = {
        completed: 'Complétée',
        pending: 'En attente',
        failed: 'Échouée'
      };
      return map[status] || status;
    },

    getTransactionIcon(type) {
  // Accepte soit le type (string) soit un objet transaction
  const t = typeof type === 'object' && type !== null ? type.type : type;
  switch (t) {
    case 'incoming': return '⬆️';
    case 'outgoing': return '⬇️';
    case 'transfer': return '🔁';
    case 'exchange': return '💱';
    case 'fee': return '💸';
    case 'refund': return '↩️';
    case 'card': return '💳';
    case 'subscription': return '📅';
    default: return '🧾';
  }
},

  formatAccountNumber(accountNumber) {
    if (!accountNumber) return '';
    
    // Retire tous les espaces existants
    const cleaned = accountNumber.replace(/\s/g, '');
    
    // Format IBAN (par groupes de 4)
    if (cleaned.length > 8 && cleaned[0].match(/[A-Z]/)) {
      return cleaned.match(/.{1,4}/g).join(' ');
    }
    
    // Format compte standard (par groupes de 4)
    return cleaned.match(/.{1,4}/g).join(' ');
  },

  hasBalanceForCurrency(currency) {
    // Vérifie si un compte existe avec suffisamment de solde dans la devise donnée
    const account = this.accounts.find(acc => acc.currency === currency);
    return account && account.balance > 0;
  },
  },
  
  mounted() {
    // Charger l'historique des exports
    const savedHistory = localStorage.getItem('revolut-export-history');
    if (savedHistory) {
      this.exportHistory = JSON.parse(savedHistory);
    }
    
    // Charger la configuration sauvegardée
    const savedConfig = localStorage.getItem('revolut-api-config');
    if (savedConfig) {
      this.apiConfig = JSON.parse(savedConfig);
      this.apiStatus = 'connected';
    }
    
    this.loadData();
  }
};
</script>

<style scoped>
/* Header */
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

.header p {
  margin: 0;
  font-size: 1.2rem;
  opacity: 0.9;
}

.header-info {
  margin-top: 1rem;
  font-size: 0.9rem;
  opacity: 0.8;
}

/* Navigation */
.main-nav {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  padding: 0 2rem;
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

/* Sections */
.section {
  padding: 0 2rem 2rem 2rem;
}

/* Cards & grids */
.stats-grid,
.accounts-grid,
.charts-grid,
.exports-grid,
.counterparties-grid {
  gap: 1.5rem;
}

.accounts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
}

.counterparties-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
}

.exports-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
}

/* Account card */
.account-card {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  cursor: pointer;
  transition: all 0.3s;
  border: 2px solid transparent;
}

.account-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 15px rgba(0,0,0,0.15);
}

.account-card.selected {
  border-color: #667eea;
  background: #f8f9ff;
}

/* Transactions */
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
}

.transaction-details span {
  color: #7f8c8d;
  font-size: 0.9rem;
}

.transaction-reference {
  display: block;
  margin-top: 0.25rem;
  font-size: 0.9rem;
  color: #2980b9;
}

.transaction-amount {
  font-weight: bold;
  font-size: 1.1rem;
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
}

.transaction-status.completed {
  background: #d4edda;
  color: #155724;
}

.transaction-status.pending {
  background: #fff3cd;
  color: #856404;
}

/* Empty state */
.empty-state {
  text-align: center;
  padding: 3rem;
  color: #7f8c8d;
}

/* Payment layout */
.payment-container {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 2rem;
}

.payment-form {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}

.form-section h3 {
  margin-bottom: 1.5rem;
  color: #2c3e50;
  border-bottom: 2px solid #f1f3f4;
  padding-bottom: 0.5rem;
}

.amount-input {
  display: flex;
  gap: 1rem;
}

.amount-input input {
  flex: 1;
}

.amount-input select {
  width: 120px;
}

.payment-summary {
  background: #f8f9fa;
  padding: 1.5rem;
  border-radius: 8px;
  border-left: 4px solid #667eea;
}

.summary-line {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.summary-line.total {
  border-top: 1px solid #ddd;
  padding-top: 0.5rem;
  margin-top: 0.5rem;
  font-size: 1.1rem;
  font-weight: bold;
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 2rem;
}

/* Recent payments */
.recent-payments {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  height: fit-content;
}

.recent-payment-item {
  padding: 1rem;
  border-bottom: 1px solid #f1f3f4;
}

.recent-payment-item:last-child {
  border-bottom: none;
}

.payment-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.payment-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.9rem;
  color: #7f8c8d;
}

.payment-status {
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: bold;
}

.payment-status.completed {
  background: #d4edda;
  color: #155724;
}

.payment-status.pending {
  background: #fff3cd;
  color: #856404;
}

/* Counterparty cards */
.counterparty-card {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  transition: transform 0.3s, box-shadow 0.3s;
}

.counterparty-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 15px rgba(0,0,0,0.15);
}

.counterparty-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
  padding: 0.5rem 0;
  border-bottom: 1px solid #f8f9fa;
}

.detail-item:last-child {
  border-bottom: none;
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #f1f3f4;
}

.btn-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #7f8c8d;
}

.modal-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 1.5rem;
}

/* Buttons */
.btn-sm {
  padding: 0.4rem 0.8rem;
  font-size: 0.8rem;
}

.btn-link {
  background: none;
  border: none;
  color: #667eea;
  text-decoration: underline;
  cursor: pointer;
  font-size: 0.9rem;
  margin-top: 0.5rem;
}

.btn-link:hover {
  color: #5a6fd8;
}

/* Loading spinner */
.loading-spinner .spinner {
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

/* Dashboard specifics */
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
  margin: 0 0 0.25rem 0;
  font-size: 1.5rem;
  font-weight: bold;
  color: #2c3e50;
}

.stat-trend.positive {
  color: #27ae60;
}

.stat-trend.negative {
  color: #e74c3c;
}

/* Charts */
.charts-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.chart-card {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}

.chart-card h3 {
  margin: 0 0 1rem 0;
  color: #2c3e50;
}

/* Recent activity */
.recent-activity {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}

.activity-list {
  max-height: 400px;
  overflow-y: auto;
}

.activity-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border-bottom: 1px solid #f1f3f4;
}

.activity-item:last-child {
  border-bottom: none;
}

.activity-icon {
  font-size: 1.2rem;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8f9fa;
  border-radius: 8px;
}

.activity-details strong {
  display: block;
  margin-bottom: 0.25rem;
  color: #2c3e50;
}

.activity-details span {
  color: #7f8c8d;
  font-size: 0.9rem;
}

/* API status */
.api-status {
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: bold;
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

/* Settings area */
.settings-card {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  max-width: 600px;
}

.api-config {
  margin-bottom: 2rem;
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
  border-top: 1px solid #f1f3f4;
  padding-top: 1.5rem;
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

/* Export & filters */
.section-actions {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.export-options {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.format-select {
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
}

.advanced-filters {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 1rem;
}

.filter-group {
  display: flex;
}

.filter-summary {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: white;
  padding: 0.25rem 0.75rem;
  border-radius: 15px;
  font-size: 0.8rem;
  font-weight: 600;
}

.filter-tag button {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1rem;
  color: #7f8c8d;
}

.export-preview {
  background: white;
  padding: 1rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  margin-bottom: 1rem;
}

.preview-stats {
  display: flex;
  gap: 2rem;
  font-size: 0.9rem;
}

.preview-stats span {
  font-weight: 600;
}

/* History */
.history-list {
  max-height: 400px;
  overflow-y: auto;
}

.history-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid #f1f3f4;
}

.history-item:last-child {
  border-bottom: none;
}

.history-info {
  flex: 1;
  gap: 0.5rem;
}

/* Responsive */
@media (max-width: 992px) {
  .charts-grid {
    grid-template-columns: 1fr;
  }
  .payment-container {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .advanced-filters {
    flex-direction: column;
    align-items: stretch;
  }
  .exports-grid {
    grid-template-columns: 1fr;
  }
  .history-item {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }
  .preview-stats {
    flex-direction: column;
    gap: 0.5rem;
  }
}
</style>