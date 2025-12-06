# Investment Portfolio Analyzer

A web application for analyzing investment opportunities based on sector, investment amount, and risk tolerance using financial data from companies.

## Features

- **Sector Filtering**: Select from various sectors or analyze all sectors
- **Risk Tolerance**: Choose between low and high-risk investment strategies
- **ROIC-Based Allocation**: Investment allocation based on Return on Invested Capital
- **Interactive Visualizations**: Charts for revenue analysis and risk distribution
- **Company Details**: Detailed view of each recommended company
- **Export Functionality**: Export recommendations as CSV

## How to Use

1. **Select Sector**: Choose a sector from the dropdown (or select "All Sectors")
2. **Enter Investment Amount**: Specify how much you want to invest (minimum $1,000)
3. **Choose Risk Tolerance**: Select between Low Risk or High Risk
4. **Click "Analyze Investment Opportunities"**: The app will process the data and show recommendations
5. **Review Results**: View companies, charts, and detailed information
6. **Export**: Download recommendations as a CSV file

## Data Source

The application uses `ranking_2025.csv` which contains:
- Company financial data
- Risk probability scores
- ROIC (Return on Invested Capital) metrics
- Sector and industry classification

## Setup Instructions

### Option 1: GitHub Pages Deployment

1. Upload all files to a GitHub repository:
   - `index.html`
   - `app.js`
   - `ranking_2025.csv`

2. Enable GitHub Pages in repository settings

### Option 2: Local Development

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/investment-analyzer.git
   cd investment-analyzer
