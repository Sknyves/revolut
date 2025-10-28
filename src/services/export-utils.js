// Utilitaires d'export de données
import { utils, writeFile } from 'xlsx';

// Export CSV
export function exportToCSV(data, filename) {
  if (!data || data.length === 0) {
    alert('Aucune donnée à exporter');
    return;
  }

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        // Gérer les valeurs contenant des virgules
        return typeof value === 'string' && value.includes(',') 
          ? `"${value}"` 
          : value;
      }).join(',')
    )
  ].join('\n');

  downloadFile(csvContent, filename, 'text/csv;charset=utf-8;');
}

// Export JSON
export function exportToJSON(data, filename) {
  const jsonContent = JSON.stringify(data, null, 2);
  downloadFile(jsonContent, filename, 'application/json');
}

// Export Excel
export async function exportToExcel(data, filename, multiSheet = false) {
  try {
    const wb = utils.book_new();
    
    if (multiSheet && typeof data === 'object') {
      // Multi-feuilles pour l'export complet
      Object.keys(data).forEach(sheetName => {
        const ws = utils.json_to_sheet(data[sheetName]);
        utils.book_append_sheet(wb, ws, sheetName);
      });
    } else {
      // Feuille simple
      const ws = utils.json_to_sheet(data);
      utils.book_append_sheet(wb, ws, 'Data');
    }
    
    writeFile(wb, filename);
  } catch (error) {
    console.error('Erreur export Excel:', error);
    alert('Erreur lors de l\'export Excel');
  }
}

// Génération PDF (simplifiée)
export async function generatePDF(data, filename) {
  // En réalité, on utiliserait une librairie comme jsPDF
  alert(`Génération PDF: ${filename}\n${data.length} éléments`);
  
  // Simulation
  const pdfContent = `
    Rapport Revolut Business
    Généré le: ${new Date().toLocaleDateString('fr-FR')}
    Nombre d'éléments: ${data.length}
    
    ${data.slice(0, 10).map(item => JSON.stringify(item)).join('\n')}
    ${data.length > 10 ? `\n... et ${data.length - 10} autres éléments` : ''}
  `;
  
  downloadFile(pdfContent, filename, 'application/pdf');
}

// Téléchargement de fichier
export function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Formatage des données pour l'export
export function formatTransactionForExport(transaction) {
  return {
    'Date': transaction.date,
    'Description': transaction.description,
    'Montant': transaction.amount,
    'Devise': transaction.currency,
    'Type': transaction.type,
    'Contrepartie': transaction.counterparty,
    'Référence': transaction.reference || '',
    'Statut': transaction.status
  };
}

export function formatAccountForExport(account) {
  return {
    'Nom': account.name,
    'Devise': account.currency,
    'Solde': account.balance,
    'Solde disponible': account.availableBalance || account.balance
  };
}

export function formatCounterpartyForExport(counterparty) {
  return {
    'Nom': counterparty.name,
    'Compte': counterparty.account,
    'Email': counterparty.email || '',
    'Devise': counterparty.currency
  };
}