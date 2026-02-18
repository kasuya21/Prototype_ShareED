#!/usr/bin/env node

/**
 * Script to update all blue colors to primary (#845CC0) in JSX files
 * Usage: node update-theme-color.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const replacements = [
  // Background colors
  { from: /bg-blue-50/g, to: 'bg-primary-50' },
  { from: /bg-blue-100/g, to: 'bg-primary-100' },
  { from: /bg-blue-200/g, to: 'bg-primary-200' },
  { from: /bg-blue-300/g, to: 'bg-primary-300' },
  { from: /bg-blue-400/g, to: 'bg-primary-400' },
  { from: /bg-blue-500/g, to: 'bg-primary-500' },
  { from: /bg-blue-600/g, to: 'bg-primary-600' },
  { from: /bg-blue-700/g, to: 'bg-primary-700' },
  { from: /bg-blue-800/g, to: 'bg-primary-800' },
  { from: /bg-blue-900/g, to: 'bg-primary-900' },
  
  // Text colors
  { from: /text-blue-50/g, to: 'text-primary-50' },
  { from: /text-blue-100/g, to: 'text-primary-100' },
  { from: /text-blue-200/g, to: 'text-primary-200' },
  { from: /text-blue-300/g, to: 'text-primary-300' },
  { from: /text-blue-400/g, to: 'text-primary-400' },
  { from: /text-blue-500/g, to: 'text-primary-500' },
  { from: /text-blue-600/g, to: 'text-primary-600' },
  { from: /text-blue-700/g, to: 'text-primary-700' },
  { from: /text-blue-800/g, to: 'text-primary-800' },
  { from: /text-blue-900/g, to: 'text-primary-900' },
  
  // Border colors
  { from: /border-blue-50/g, to: 'border-primary-50' },
  { from: /border-blue-100/g, to: 'border-primary-100' },
  { from: /border-blue-200/g, to: 'border-primary-200' },
  { from: /border-blue-300/g, to: 'border-primary-300' },
  { from: /border-blue-400/g, to: 'border-primary-400' },
  { from: /border-blue-500/g, to: 'border-primary-500' },
  { from: /border-blue-600/g, to: 'border-primary-600' },
  { from: /border-blue-700/g, to: 'border-primary-700' },
  { from: /border-blue-800/g, to: 'border-primary-800' },
  { from: /border-blue-900/g, to: 'border-primary-900' },
  
  // Hover states
  { from: /hover:bg-blue-50/g, to: 'hover:bg-primary-50' },
  { from: /hover:bg-blue-100/g, to: 'hover:bg-primary-100' },
  { from: /hover:bg-blue-200/g, to: 'hover:bg-primary-200' },
  { from: /hover:bg-blue-300/g, to: 'hover:bg-primary-300' },
  { from: /hover:bg-blue-400/g, to: 'hover:bg-primary-400' },
  { from: /hover:bg-blue-500/g, to: 'hover:bg-primary-500' },
  { from: /hover:bg-blue-600/g, to: 'hover:bg-primary-600' },
  { from: /hover:bg-blue-700/g, to: 'hover:bg-primary-700' },
  { from: /hover:bg-blue-800/g, to: 'hover:bg-primary-800' },
  { from: /hover:bg-blue-900/g, to: 'hover:bg-primary-900' },
  
  { from: /hover:text-blue-50/g, to: 'hover:text-primary-50' },
  { from: /hover:text-blue-100/g, to: 'hover:text-primary-100' },
  { from: /hover:text-blue-200/g, to: 'hover:text-primary-200' },
  { from: /hover:text-blue-300/g, to: 'hover:text-primary-300' },
  { from: /hover:text-blue-400/g, to: 'hover:text-primary-400' },
  { from: /hover:text-blue-500/g, to: 'hover:text-primary-500' },
  { from: /hover:text-blue-600/g, to: 'hover:text-primary-600' },
  { from: /hover:text-blue-700/g, to: 'hover:text-primary-700' },
  { from: /hover:text-blue-800/g, to: 'hover:text-primary-800' },
  { from: /hover:text-blue-900/g, to: 'hover:text-primary-900' },
  
  // Focus states
  { from: /focus:ring-blue-50/g, to: 'focus:ring-primary-50' },
  { from: /focus:ring-blue-100/g, to: 'focus:ring-primary-100' },
  { from: /focus:ring-blue-200/g, to: 'focus:ring-primary-200' },
  { from: /focus:ring-blue-300/g, to: 'focus:ring-primary-300' },
  { from: /focus:ring-blue-400/g, to: 'focus:ring-primary-400' },
  { from: /focus:ring-blue-500/g, to: 'focus:ring-primary-500' },
  { from: /focus:ring-blue-600/g, to: 'focus:ring-primary-600' },
  { from: /focus:ring-blue-700/g, to: 'focus:ring-primary-700' },
  { from: /focus:ring-blue-800/g, to: 'focus:ring-primary-800' },
  { from: /focus:ring-blue-900/g, to: 'focus:ring-primary-900' },
  
  { from: /focus:border-blue-50/g, to: 'focus:border-primary-50' },
  { from: /focus:border-blue-100/g, to: 'focus:border-primary-100' },
  { from: /focus:border-blue-200/g, to: 'focus:border-primary-200' },
  { from: /focus:border-blue-300/g, to: 'focus:border-primary-300' },
  { from: /focus:border-blue-400/g, to: 'focus:border-primary-400' },
  { from: /focus:border-blue-500/g, to: 'focus:border-primary-500' },
  { from: /focus:border-blue-600/g, to: 'focus:border-primary-600' },
  { from: /focus:border-blue-700/g, to: 'focus:border-primary-700' },
  { from: /focus:border-blue-800/g, to: 'focus:border-primary-800' },
  { from: /focus:border-blue-900/g, to: 'focus:border-primary-900' },
  
  // File input colors
  { from: /file:bg-blue-50/g, to: 'file:bg-primary-50' },
  { from: /file:text-blue-700/g, to: 'file:text-primary-700' },
  { from: /hover:file:bg-blue-100/g, to: 'hover:file:bg-primary-100' },
];

function updateFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let updated = false;
  
  replacements.forEach(({ from, to }) => {
    if (from.test(content)) {
      content = content.replace(from, to);
      updated = true;
    }
  });
  
  if (updated) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✓ Updated: ${filePath}`);
    return true;
  }
  
  return false;
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  let updatedCount = 0;
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      updatedCount += walkDir(filePath);
    } else if (file.endsWith('.jsx') || file.endsWith('.js')) {
      if (updateFile(filePath)) {
        updatedCount++;
      }
    }
  });
  
  return updatedCount;
}

console.log('Starting color theme update...\n');
const srcDir = path.join(__dirname, 'src');
const updatedCount = walkDir(srcDir);
console.log(`\n✓ Complete! Updated ${updatedCount} files.`);
console.log('\nNew primary color: #845CC0');
