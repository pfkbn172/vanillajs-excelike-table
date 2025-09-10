# Changelog

All notable changes to this project will be documented in this file.

## [1.3.2] - 2025-08-17

### ✨ New Features
- **Settings Menu UX Improvement**: Settings menu now closes when clicking outside the menu area
- **Enhanced Menu Interaction**: Menu stays open when clicking inside, closes automatically after selecting an action

### 🐛 Bug Fixes
- **Pagination Styling**: Fixed issue where padding settings were not maintained when navigating between pages
- **Memory Management**: Added proper cleanup of document event listeners in destroy() method

### 🧹 Code Quality
- **Event Management**: Improved event listener management for better performance and memory usage
- **UX Consistency**: All menu actions now consistently close the menu after execution

---

## [1.3.1] - 2025-08-17

### 🐛 Bug Fixes
- Fixed pagination padding settings not being maintained during page changes

### 📝 Documentation
- Added comprehensive development workflow section to README.md
- Clarified src → build → dist development process
- Added AI/Human developer guidelines

---

## [1.3.0] - Previous Release

### ✨ Features
- Enhanced table functionality with Excel-like features
- LocalStorage settings persistence
- Column pinning and resizing
- Advanced filtering and sorting
- Mobile touch support

---

*For older versions, please refer to the git commit history.*