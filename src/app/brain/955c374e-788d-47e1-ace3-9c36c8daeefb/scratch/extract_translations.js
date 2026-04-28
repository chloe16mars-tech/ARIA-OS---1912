const fs = require('fs');
const path = require('path');

const content = fs.readFileSync('src/app/services/language.service.ts', 'utf8');

// Use a regex to find the TRANSLATIONS object
const translationsMatch = content.match(/export const TRANSLATIONS: Record<Language, Record<string, string>> = (\{[\s\S]*?\n\});/);

if (!translationsMatch) {
  console.error("Could not find TRANSLATIONS object");
  process.exit(1);
}

// This is a bit hacky but since it's a known structure...
// We'll evaluate it as a JS object. We need to define Language first.
const Language = ['fr', 'en', 'zh', 'ar', 'es', 'pt'];
let TRANSLATIONS;
try {
    // Replace backticks with something safer or handle them if they contain variables (they don't seem to)
    const objectStr = translationsMatch[1];
    // We can't easily eval because of types and potentially complex nesting
    // Let's try a simpler approach: splitting by top-level keys
    const languages = ['fr', 'en', 'ar', 'zh', 'es', 'pt'];
    
    languages.forEach(lang => {
        const langRegex = new RegExp(`${lang}: \\{([\\s\\S]*?)\\n\\s{2}\\}(?:,|\\s*\\n\\s*\\})`, 'g');
        const match = langRegex.exec(objectStr);
        if (match) {
            let langContent = match[1];
            // Now we need to parse this into a JSON object
            // Each line is 'key': `value` or 'key': 'value'
            const result = {};
            const pairRegex = /'([^']+)':\s*([`'])([\s\S]*?)\2,?/g;
            let pairMatch;
            while ((pairMatch = pairRegex.exec(langContent)) !== null) {
                result[pairMatch[1]] = pairMatch[3];
            }
            
            fs.writeFileSync(`src/app/i18n/${lang}.json`, JSON.stringify(result, null, 2));
            console.log(`Extracted ${lang}.json`);
        }
    });

} catch (e) {
    console.error("Error evaluating translations", e);
}
