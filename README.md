# Money Tracker 💰

A clean, responsive, and lightweight Money Tracker web application built with vanilla HTML5, CSS3, and modern JavaScript. Zero dependencies, no build tools, and no server or database required. All data persists locally in your browser via `localStorage`.

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black)

## Features

- **Transaction Tracking**: Add income and expense transactions with amounts, categories (or custom categories), dates, and notes.
- **Overview Dashboard**: Track your net balance, total income, total expenses, and total transaction count.
- **Search & Filters**: Search in real time by category, note, amount, or date, and filter by transaction type.
- **Edit & Delete**: Modify any transaction inline or delete with a safe confirmation prompt.
- **Infographics View**:
  - **Comparative Bar Chart**: Income vs. Expenses visualization with savings rate and surplus/deficit metrics.
  - **Category Pie Chart**: Pure SVG donut chart breaking down expenses by category with interactive percentages and itemized legends.
- **Local Persistence**: Data is saved to your browser's `localStorage` so it remains intact after refreshing or closing the page.
- **Mobile Friendly**: Designed for mobile touch screens with responsive card layouts and accessible touch targets.

## Getting Started

No installation or server setup is required.

1. Clone or download this repository:
   ```bash
   git clone https://github.com/SimonUI-collab/moneytracker.git
   ```
2. Open `index.html` in any modern web browser.

## Project Structure

```text
├── index.html    # Application structure and markup
├── style.css     # Clean, responsive styles and custom properties
├── script.js     # State management, LocalStorage, charts, and DOM logic
└── README.md     # Documentation
```

## License

MIT
