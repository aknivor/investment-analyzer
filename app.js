// Global variables
let companiesData = [];
let filteredCompanies = [];
let sectors = new Set();

// DOM Elements
const sectorSelect = document.getElementById('sectorSelect');
const investmentAmountInput = document.getElementById('investmentAmount');
const analyzeBtn = document.getElementById('analyzeBtn');
const loadingIndicator = document.getElementById('loadingIndicator');
const resultsSection = document.getElementById('resultsSection');
const companiesTableBody = document.getElementById('companiesTableBody');
const revenueChartCtx = document.getElementById('revenueChart');
const riskChartCtx = document.getElementById('riskChart');
const companyModal = new bootstrap.Modal(document.getElementById('companyModal'));
const companyModalTitle = document.getElementById('companyModalTitle');
const companyDetailsContent = document.getElementById('companyDetailsContent');
const exportBtn = document.getElementById('exportBtn');
const toggleDetails = document.getElementById('toggleDetails');

// Chart instances
let revenueChart = null;
let riskChart = null;

// Initialize the application
document.addEventListener('DOMContentLoaded', async function() {
    // Load and parse CSV data
    await loadCSVData();
    
    // Populate sector dropdown
    populateSectorDropdown();
    
    // Set up event listeners
    setupEventListeners();
    
    console.log('Application initialized with', companiesData.length, 'companies');
});

// Load and parse CSV data
async function loadCSVData() {
    try {
        const response = await fetch('ranking_2025.csv');
        const csvText = await response.text();
        
        Papa.parse(csvText, {
            header: true,
            dynamicTyping: true,
            skipEmptyLines: true,
            complete: function(results) {
                companiesData = results.data;
                
                // Extract unique sectors
                companiesData.forEach(company => {
                    if (company.Sector && company.Sector.trim() !== '') {
                        sectors.add(company.Sector);
                    }
                });
                
                console.log('CSV data loaded successfully');
            },
            error: function(error) {
                console.error('Error parsing CSV:', error);
                // Fallback to sample data if CSV loading fails
                loadSampleData();
            }
        });
    } catch (error) {
        console.error('Error loading CSV:', error);
        loadSampleData();
    }
}

// Fallback sample data
function loadSampleData() {
    companiesData = [
        {
            "company_id": "2305",
            "Market Cap": 96304154,
            "Sector": "Industrials",
            "Industry": "Security & Protection Services",
            "Company Name": "Concorde International Group Ltd.",
            "Revenue": 10655993,
            "ROIC": 0.137,
            "high_risk_proba": 0.0283,
            "ROE": 0.368,
            "ROA": 0.116,
            "EPS": 0.04,
            "Current": 4.35,
            "Employees": 134,
            "Debt / Equity": 1.68
        },
        {
            "company_id": "2308",
            "Market Cap": 6002081468,
            "Sector": "Consumer Discretionary",
            "Industry": "Restaurants",
            "Company Name": "Chagee Holdings Limited",
            "Revenue": 12405582000,
            "ROIC": 0.745,
            "high_risk_proba": 0.081,
            "ROE": 1.557,
            "ROA": 0.5,
            "EPS": 1.78,
            "Current": 32.7,
            "Employees": 4800,
            "Debt / Equity": 0.21
        },
        {
            "company_id": "2316",
            "Market Cap": 159011206,
            "Sector": "Technology",
            "Industry": "Software - Infrastructure",
            "Company Name": "FatPipe, Inc.",
            "Revenue": 17860909,
            "ROIC": 0.258,
            "high_risk_proba": 0.6169,
            "ROE": 0.375,
            "ROA": 0.235,
            "EPS": 0.32,
            "Current": 11.55,
            "Employees": 154,
            "Debt / Equity": 0.24
        }
    ];
    
    companiesData.forEach(company => {
        if (company.Sector && company.Sector.trim() !== '') {
            sectors.add(company.Sector);
        }
    });
    
    console.log('Sample data loaded');
}

// Populate sector dropdown
function populateSectorDropdown() {
    sectors.forEach(sector => {
        const option = document.createElement('option');
        option.value = sector;
        option.textContent = sector;
        sectorSelect.appendChild(option);
    });
}

// Set up event listeners
function setupEventListeners() {
    analyzeBtn.addEventListener('click', analyzeInvestments);
    exportBtn.addEventListener('click', exportRecommendations);
    toggleDetails.addEventListener('change', toggleCompanyDetails);
}

// Main analysis function
function analyzeInvestments() {
    // Show loading indicator
    loadingIndicator.style.display = 'block';
    resultsSection.style.display = 'none';
    
    // Get user inputs
    const selectedSector = sectorSelect.value;
    const investmentAmount = parseFloat(investmentAmountInput.value) || 50000;
    const riskTolerance = document.querySelector('input[name="riskTolerance"]:checked').value;
    
    // Validate investment amount
    if (investmentAmount < 1000) {
        alert('Minimum investment amount is $1,000');
        loadingIndicator.style.display = 'none';
        return;
    }
    
    // Simulate API delay for better UX
    setTimeout(() => {
        // Filter companies by sector
        filteredCompanies = selectedSector ? 
            companiesData.filter(company => company.Sector === selectedSector) : 
            [...companiesData];
        
        // Filter out companies with missing ROIC
        filteredCompanies = filteredCompanies.filter(company => 
            company.ROIC !== undefined && company.ROIC !== null
        );
        
        // Sort companies based on risk tolerance and ROIC
        filteredCompanies.sort((a, b) => {
            // Primary sort: risk probability (ascending for low risk, descending for high risk)
            if (riskTolerance === 'low') {
                // For low risk tolerance, prioritize low risk probability
                if (a.high_risk_proba !== b.high_risk_proba) {
                    return a.high_risk_proba - b.high_risk_proba;
                }
            } else {
                // For high risk tolerance, prioritize high risk probability (potential for high returns)
                if (b.high_risk_proba !== a.high_risk_proba) {
                    return b.high_risk_proba - a.high_risk_proba;
                }
            }
            
            // Secondary sort: ROIC (higher is better)
            return (b.ROIC || 0) - (a.ROIC || 0);
        });
        
        // Allocate investment based on ROIC
        const allocatedCompanies = allocateInvestment(filteredCompanies, investmentAmount);
        
        // Update UI with results
        updateResultsUI(allocatedCompanies, investmentAmount, selectedSector, riskTolerance);
        
        // Hide loading indicator and show results
        loadingIndicator.style.display = 'none';
        resultsSection.style.display = 'block';
        
        // Scroll to results
        resultsSection.scrollIntoView({ behavior: 'smooth' });
        
    }, 1000);
}

// Allocate investment across companies based on ROIC
function allocateInvestment(companies, totalInvestment) {
    const result = [];
    const minInvestmentPerCompany = 1000;
    
    // Calculate total ROIC for weighting
    const totalROIC = companies.reduce((sum, company) => sum + (company.ROIC || 0), 0);
    
    // Allocate to each company based on ROIC proportion
    let remainingInvestment = totalInvestment;
    
    for (let i = 0; i < Math.min(companies.length, 20); i++) {
        const company = companies[i];
        const roicWeight = (company.ROIC || 0) / totalROIC;
        
        // Calculate allocation amount
        let allocation = Math.round(totalInvestment * roicWeight);
        
        // Ensure minimum and maximum allocations
        allocation = Math.max(allocation, minInvestmentPerCompany);
        allocation = Math.min(allocation, remainingInvestment);
        
        // Skip if allocation is too small
        if (allocation < minInvestmentPerCompany || remainingInvestment < minInvestmentPerCompany) {
            continue;
        }
        
        // Calculate shares to buy (based on current price if available)
        const currentPrice = company.Current || company["IPO Price"] || 10;
        const sharesToBuy = Math.floor(allocation / currentPrice);
        const actualInvestment = sharesToBuy * currentPrice;
        
        result.push({
            ...company,
            allocation: allocation,
            sharesToBuy: sharesToBuy,
            currentPrice: currentPrice,
            actualInvestment: actualInvestment
        });
        
        remainingInvestment -= actualInvestment;
        
        // Stop if we've used all investment
        if (remainingInvestment < minInvestmentPerCompany) {
            break;
        }
    }
    
    return result;
}

// Update results UI
function updateResultsUI(companies, investmentAmount, selectedSector, riskTolerance) {
    // Update summary stats
    updateSummaryStats(companies, investmentAmount);
    
    // Update companies table
    updateCompaniesTable(companies);
    
    // Update charts
    updateCharts(companies);
}

// Update summary statistics
function updateSummaryStats(companies, investmentAmount) {
    if (companies.length === 0) {
        document.getElementById('totalCompanies').textContent = '0';
        document.getElementById('avgROIC').textContent = '0%';
        document.getElementById('avgRisk').textContent = '0%';
        document.getElementById('portfolioValue').textContent = '$0';
        return;
    }
    
    const totalCompanies = companies.length;
    const avgROIC = (companies.reduce((sum, company) => sum + (company.ROIC || 0), 0) / totalCompanies * 100).toFixed(1);
    const avgRisk = (companies.reduce((sum, company) => sum + (company.high_risk_proba || 0), 0) / totalCompanies * 100).toFixed(1);
    const totalAllocation = companies.reduce((sum, company) => sum + (company.allocation || 0), 0);
    
    document.getElementById('totalCompanies').textContent = totalCompanies;
    document.getElementById('avgROIC').textContent = `${avgROIC}%`;
    document.getElementById('avgRisk').textContent = `${avgRisk}%`;
    document.getElementById('portfolioValue').textContent = `$${totalAllocation.toLocaleString()}`;
}

// Update companies table
function updateCompaniesTable(companies) {
    companiesTableBody.innerHTML = '';
    
    if (companies.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td colspan="8" class="text-center py-4">
                <div class="text-muted">
                    <i class="fas fa-search fa-2x mb-3"></i>
                    <p>No companies match your criteria. Try adjusting your filters.</p>
                </div>
            </td>
        `;
        companiesTableBody.appendChild(row);
        return;
    }
    
    companies.forEach((company, index) => {
        const row = document.createElement('tr');
        const riskProba = (company.high_risk_proba * 100).toFixed(1);
        const roicPercent = (company.ROIC * 100).toFixed(1);
        const marketCap = company["Market Cap"] ? formatCurrency(company["Market Cap"]) : 'N/A';
        const revenue = company.Revenue ? formatCurrency(company.Revenue) : 'N/A';
        const riskClass = company.high_risk_proba > 0.5 ? 'high-risk' : 'low-risk';
        
        row.innerHTML = `
            <td class="fw-bold">${index + 1}</td>
            <td>
                <strong>${company["Company Name"] || 'Unknown Company'}</strong>
                <div class="text-muted small">${company.Industry || 'N/A'}</div>
            </td>
            <td>
                <span class="sector-tag">${company.Sector || 'N/A'}</span>
            </td>
            <td>
                <div class="d-flex align-items-center">
                    <div class="me-2">${riskProba}%</div>
                    <div class="${company.high_risk_proba > 0.5 ? 'risk-high' : 'risk-low'}">
                        ${company.high_risk_proba > 0.5 ? 'High Risk' : 'Low Risk'}
                    </div>
                </div>
            </td>
            <td>
                <span class="${company.ROIC > 0.1 ? 'metric-positive' : company.ROIC < 0 ? 'metric-negative' : 'metric-neutral'} metric-badge">
                    ${roicPercent}%
                </span>
            </td>
            <td>${marketCap}</td>
            <td>${revenue}</td>
            <td>
                <button class="btn btn-sm btn-outline-primary view-details-btn" data-company-id="${company.company_id}">
                    <i class="fas fa-eye me-1"></i>Details
                </button>
            </td>
        `;
        
        // Add click event for details button
        const detailsBtn = row.querySelector('.view-details-btn');
        detailsBtn.addEventListener('click', () => showCompanyDetails(company));
        
        companiesTableBody.appendChild(row);
    });
    
    // Add event listeners for all detail buttons
    document.querySelectorAll('.view-details-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const companyId = this.getAttribute('data-company-id');
            const company = companies.find(c => c.company_id === companyId);
            if (company) {
                showCompanyDetails(company);
            }
        });
    });
}

// Update charts
function updateCharts(companies) {
    // Destroy existing charts if they exist
    if (revenueChart) {
        revenueChart.destroy();
    }
    if (riskChart) {
        riskChart.destroy();
    }
    
    if (companies.length === 0) {
        return;
    }
    
    // Prepare data for revenue chart
    const companyNames = companies.slice(0, 10).map(c => 
        c["Company Name"] ? c["Company Name"].substring(0, 20) + (c["Company Name"].length > 20 ? '...' : '') : 'Unknown'
    );
    const revenues = companies.slice(0, 10).map(c => c.Revenue || 0);
    const allocations = companies.slice(0, 10).map(c => c.allocation || 0);
    
    // Revenue Chart
    revenueChart = new Chart(revenueChartCtx, {
        type: 'bar',
        data: {
            labels: companyNames,
            datasets: [
                {
                    label: 'Company Revenue ($)',
                    data: revenues,
                    backgroundColor: 'rgba(37, 99, 235, 0.7)',
                    borderColor: 'rgba(37, 99, 235, 1)',
                    borderWidth: 1,
                    yAxisID: 'y'
                },
                {
                    label: 'Recommended Investment ($)',
                    data: allocations,
                    backgroundColor: 'rgba(16, 185, 129, 0.7)',
                    borderColor: 'rgba(16, 185, 129, 1)',
                    borderWidth: 1,
                    type: 'line',
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    ticks: {
                        maxRotation: 45
                    }
                },
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: {
                        display: true,
                        text: 'Revenue ($)'
                    },
                    ticks: {
                        callback: function(value) {
                            if (value >= 1e9) return '$' + (value / 1e9).toFixed(1) + 'B';
                            if (value >= 1e6) return '$' + (value / 1e6).toFixed(1) + 'M';
                            if (value >= 1e3) return '$' + (value / 1e3).toFixed(1) + 'K';
                            return '$' + value;
                        }
                    }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: {
                        display: true,
                        text: 'Investment ($)'
                    },
                    grid: {
                        drawOnChartArea: false
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                label += formatCurrency(context.parsed.y);
                            }
                            return label;
                        }
                    }
                },
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
    
    // Prepare data for risk chart
    const highRiskCount = companies.filter(c => c.high_risk_proba > 0.5).length;
    const lowRiskCount = companies.length - highRiskCount;
    
    // Risk Distribution Chart
    riskChart = new Chart(riskChartCtx, {
        type: 'doughnut',
        data: {
            labels: ['High Risk (>50%)', 'Low Risk (≤50%)'],
            datasets: [{
                data: [highRiskCount, lowRiskCount],
                backgroundColor: [
                    'rgba(239, 68, 68, 0.7)',
                    'rgba(16, 185, 129, 0.7)'
                ],
                borderColor: [
                    'rgba(239, 68, 68, 1)',
                    'rgba(16, 185, 129, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = Math.round((value / total) * 100);
                            return `${label}: ${value} companies (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

// Show company details modal
function showCompanyDetails(company) {
    companyModalTitle.textContent = company["Company Name"] || 'Company Details';
    
    const riskProba = (company.high_risk_proba * 100).toFixed(1);
    const roicPercent = (company.ROIC * 100).toFixed(1);
    const roePercent = (company.ROE * 100).toFixed(1);
    const roaPercent = (company.ROA * 100).toFixed(1);
    
    const detailsHTML = `
        <div class="row">
            <div class="col-md-6">
                <h6 class="mb-3">Basic Information</h6>
                <table class="table table-sm">
                    <tr>
                        <td><strong>Sector:</strong></td>
                        <td>${company.Sector || 'N/A'}</td>
                    </tr>
                    <tr>
                        <td><strong>Industry:</strong></td>
                        <td>${company.Industry || 'N/A'}</td>
                    </tr>
                    <tr>
                        <td><strong>Employees:</strong></td>
                        <td>${company.Employees ? company.Employees.toLocaleString() : 'N/A'}</td>
                    </tr>
                    <tr>
                        <td><strong>Founded:</strong></td>
                        <td>${company.Founded || 'N/A'}</td>
                    </tr>
                </table>
            </div>
            <div class="col-md-6">
                <h6 class="mb-3">Financial Metrics</h6>
                <table class="table table-sm">
                    <tr>
                        <td><strong>Current Price:</strong></td>
                        <td>${company.Current ? '$' + company.Current.toFixed(2) : 'N/A'}</td>
                    </tr>
                    <tr>
                        <td><strong>Market Cap:</strong></td>
                        <td>${company["Market Cap"] ? formatCurrency(company["Market Cap"]) : 'N/A'}</td>
                    </tr>
                    <tr>
                        <td><strong>Revenue:</strong></td>
                        <td>${company.Revenue ? formatCurrency(company.Revenue) : 'N/A'}</td>
                    </tr>
                    <tr>
                        <td><strong>EPS:</strong></td>
                        <td>${company.EPS ? company.EPS.toFixed(2) : 'N/A'}</td>
                    </tr>
                </table>
            </div>
        </div>
        
        <div class="row mt-4">
            <div class="col-md-12">
                <h6 class="mb-3">Investment Analysis</h6>
                <div class="row">
                    <div class="col-md-3 mb-3">
                        <div class="card text-center h-100">
                            <div class="card-body">
                                <div class="stats-label">Risk Probability</div>
                                <div class="stats-value ${company.high_risk_proba > 0.5 ? 'text-danger' : 'text-success'}">
                                    ${riskProba}%
                                </div>
                                <div class="${company.high_risk_proba > 0.5 ? 'risk-high' : 'risk-low'}">
                                    ${company.high_risk_proba > 0.5 ? 'High Risk' : 'Low Risk'}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3 mb-3">
                        <div class="card text-center h-100">
                            <div class="card-body">
                                <div class="stats-label">ROIC</div>
                                <div class="stats-value ${company.ROIC > 0.1 ? 'text-success' : company.ROIC < 0 ? 'text-danger' : 'text-warning'}">
                                    ${roicPercent}%
                                </div>
                                <small>Return on Invested Capital</small>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3 mb-3">
                        <div class="card text-center h-100">
                            <div class="card-body">
                                <div class="stats-label">ROE</div>
                                <div class="stats-value ${company.ROE > 0.1 ? 'text-success' : company.ROE < 0 ? 'text-danger' : 'text-warning'}">
                                    ${roePercent}%
                                </div>
                                <small>Return on Equity</small>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3 mb-3">
                        <div class="card text-center h-100">
                            <div class="card-body">
                                <div class="stats-label">ROA</div>
                                <div class="stats-value ${company.ROA > 0.05 ? 'text-success' : company.ROA < 0 ? 'text-danger' : 'text-warning'}">
                                    ${roaPercent}%
                                </div>
                                <small>Return on Assets</small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        ${company.allocation ? `
        <div class="row mt-4">
            <div class="col-md-12">
                <h6 class="mb-3">Investment Recommendation</h6>
                <div class="alert alert-info">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <strong>Recommended Allocation:</strong> ${formatCurrency(company.allocation)}<br>
                            <small>Shares to buy: ${company.sharesToBuy} @ $${company.currentPrice?.toFixed(2) || 'N/A'} per share</small>
                        </div>
                        <div>
                            <span class="badge bg-primary">Investment Score: ${calculateInvestmentScore(company)}/10</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        ` : ''}
    `;
    
    companyDetailsContent.innerHTML = detailsHTML;
    companyModal.show();
}

// Calculate investment score for a company
function calculateInvestmentScore(company) {
    let score = 5; // Base score
    
    // Adjust based on ROIC
    if (company.ROIC > 0.2) score += 2;
    else if (company.ROIC > 0.1) score += 1;
    else if (company.ROIC < 0) score -= 2;
    
    // Adjust based on risk
    if (company.high_risk_proba < 0.2) score += 2;
    else if (company.high_risk_proba > 0.7) score -= 2;
    else if (company.high_risk_proba > 0.5) score -= 1;
    
    // Adjust based on revenue growth if available
    if (company["Rev. Growth"] > 0.5) score += 1;
    else if (company["Rev. Growth"] < 0) score -= 1;
    
    // Ensure score is between 1 and 10
    return Math.max(1, Math.min(10, Math.round(score)));
}

// Export recommendations
function exportRecommendations() {
    if (filteredCompanies.length === 0) {
        alert('No recommendations to export. Please run an analysis first.');
        return;
    }
    
    const investmentAmount = parseFloat(investmentAmountInput.value) || 50000;
    const selectedSector = sectorSelect.value || 'All Sectors';
    const riskTolerance = document.querySelector('input[name="riskTolerance"]:checked').value;
    
    // Create CSV content
    let csvContent = "Investment Recommendations\n\n";
    csvContent += `Analysis Date: ${new Date().toLocaleDateString()}\n`;
    csvContent += `Selected Sector: ${selectedSector}\n`;
    csvContent += `Investment Amount: $${investmentAmount.toLocaleString()}\n`;
    csvContent += `Risk Tolerance: ${riskTolerance}\n\n`;
    
    csvContent += "Rank,Company Name,Sector,Industry,Risk Probability,ROIC,Recommended Allocation,Shares to Buy,Current Price\n";
    
    filteredCompanies.forEach((company, index) => {
        const riskProba = (company.high_risk_proba * 100).toFixed(1);
        const roicPercent = (company.ROIC * 100).toFixed(1);
        const allocation = company.allocation || 0;
        const shares = company.sharesToBuy || 0;
        const price = company.currentPrice || company.Current || 0;
        
        csvContent += `${index + 1},"${company["Company Name"] || ''}","${company.Sector || ''}","${company.Industry || ''}",${riskProba}%,${roicPercent}%,$${allocation.toLocaleString()},${shares},$${price.toFixed(2)}\n`;
    });
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `investment_recommendations_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}

// Toggle company details
function toggleCompanyDetails() {
    const showDetails = toggleDetails.checked;
    const detailRows = document.querySelectorAll('.company-details-row');
    
    if (showDetails) {
        // Add detailed rows
        const rows = document.querySelectorAll('#companiesTableBody tr');
        rows.forEach(row => {
            if (!row.classList.contains('company-details-row')) {
                const companyName = row.cells[1].querySelector('strong').textContent;
                const company = filteredCompanies.find(c => c["Company Name"] === companyName);
                
                if (company) {
                    const detailRow = document.createElement('tr');
                    detailRow.classList.add('company-details-row');
                    detailRow.innerHTML = `
                        <td colspan="8">
                            <div class="p-3 bg-light rounded">
                                <div class="row">
                                    <div class="col-md-6">
                                        <strong>Financial Details:</strong><br>
                                        ROE: ${(company.ROE * 100).toFixed(1)}% | 
                                        ROA: ${(company.ROA * 100).toFixed(1)}%<br>
                                        Debt/Equity: ${company["Debt / Equity"] ? company["Debt / Equity"].toFixed(2) : 'N/A'}<br>
                                        Employees: ${company.Employees ? company.Employees.toLocaleString() : 'N/A'}
                                    </div>
                                    <div class="col-md-6">
                                        <strong>Investment Details:</strong><br>
                                        Shares to Buy: ${company.sharesToBuy || 'N/A'}<br>
                                        Allocation: ${company.allocation ? formatCurrency(company.allocation) : 'N/A'}<br>
                                        Investment Score: ${calculateInvestmentScore(company)}/10
                                    </div>
                                </div>
                            </div>
                        </td>
                    `;
                    row.after(detailRow);
                }
            }
        });
    } else {
        // Remove detailed rows
        detailRows.forEach(row => row.remove());
    }
}

// Helper function to format currency
function formatCurrency(value) {
    if (value === undefined || value === null || isNaN(value)) return 'N/A';
    
    if (value >= 1e9) {
        return '$' + (value / 1e9).toFixed(2) + 'B';
    } else if (value >= 1e6) {
        return '$' + (value / 1e6).toFixed(2) + 'M';
    } else if (value >= 1e3) {
        return '$' + (value / 1e3).toFixed(1) + 'K';
    } else {
        return '$' + value.toFixed(0);
    }
}
