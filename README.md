# PitchPilot

**PitchPilot** is a prototype web application that supports financial sales specialists in guiding conversations with prospects. It combines a lead dashboard, structured probing questions, and fit analysis tools into a single responsive interface.

🔗 **Live Demo:** [PitchPilot Website](https://tristano13.github.io/Pitch-Pilot/)

---

## 🚀 Features

- **Login Screen**  
  Simple login form with "remember me" option, password toggle visibility, and validation.  

- **Dashboard (Lead Management)**  
  - Displays a list of prospects with attributes (name, gender, age, income, offers, approval chance, win probability).  
  - Sortable table columns.  
  - Quick prospect selection with action buttons.  
  - Dark/Light mode toggle with persistence (saved in local storage).  

- **Sales Objective & Probing**  
  - Accordion-style questionnaire covering lifestyle, borrowing habits, qualification, and expectations.  
  - “Other” inputs dynamically enabled when relevant options are selected.  
  - Reset functionality to clear all answers.  

- **Customer Fit Screen**  
  - Shows consolidated customer persona, analyzed needs, and qualification checklist.  
  - Interactive summary to help pitch debt consolidation proposals.  
  - Recording button stub for future voice/meeting capture integration.  

- **Modal for Offers**  
  - Edit customer offers in a modal dialog with checkbox options.  
  - Supports “Select All” and “Clear” functionality.  

- **Accessibility & UX**  
  - ARIA roles and attributes included for better screen reader support.  
  - Smooth transitions between screens.  
  - Responsive design optimized for mobile and desktop.  

---

## 🛠️ Tech Stack

- **Frontend:** HTML5, CSS3, Vanilla JavaScript (ES6+)  
- **Styling:** CSS custom properties with light/dark theme support  
- **Fonts:** [Inter](https://fonts.google.com/specimen/Inter) via Google Fonts  
- **No external frameworks** (fully lightweight and dependency-free)

---

## 📂 Project Structure

Pitch-Pilot/
├── index.html # Main HTML entry point
├── styles.css # Styles, variables, responsive layout, dark mode
├── app.js # Core logic: navigation, login, leads, sorting, modal
├── images/ # Branding assets (e.g., TTB_Logo.png)
└── README.md # Project documentation

### 💡 How to Open the Project

You don’t need to install anything to try **PitchPilot** locally.

1. **Download the project** (ZIP from GitHub or using `git clone`).  
2. Inside the folder, locate the file:  
3. **Double-click `index.html`** — it will open directly in your default web browser.  
- No server required  
- Works offline  
- All functionality is handled with HTML, CSS, and JavaScript  