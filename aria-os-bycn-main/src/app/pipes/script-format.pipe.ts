import { Pipe, PipeTransform, inject } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Pipe({
  name: 'scriptFormat',
  standalone: true
})
export class ScriptFormatPipe implements PipeTransform {
  private sanitizer = inject(DomSanitizer);

  transform(value: string | undefined): SafeHtml {
    if (!value) return '';
    
    // Escape HTML to prevent XSS from source text
    let html = value.replace(/</g, '&lt;').replace(/>/g, '&gt;');

    // Separators
    html = html.replace(/^\*\*\*$/gim, '<hr class="my-8 border-gray-200 dark:border-gray-800">');

    // Custom sections
    html = html.replace(/^### 🎙️ SCRIPT VOIX OFF(.*$)/gim, '<div class="flex items-center gap-3 mt-10 mb-6"><span class="flex items-center justify-center w-10 h-10 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 text-xl">🎙️</span><h2 class="text-xl font-black text-gray-900 dark:text-white uppercase tracking-wide">SCRIPT VOIX OFF$1</h2></div>');
    html = html.replace(/^\*\*💡 Conseils pour l'enregistrement(.*?)\*\*/gim, '<div class="flex items-center gap-3 mt-10 mb-4"><span class="flex items-center justify-center w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-xl">💡</span><h2 class="text-xl font-black text-gray-900 dark:text-white uppercase tracking-wide">Conseils pour l\'enregistrement$1</h2></div>');

    // Headers
    html = html.replace(/^# (.*$)/gim, '<h1 class="bg-black dark:bg-white text-white dark:text-black px-6 py-3 text-2xl font-black uppercase tracking-widest inline-block mb-8 mt-4 rounded-xl shadow-md w-full text-center">$1</h1>');
    html = html.replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold text-gray-900 dark:text-white mt-12 mb-6 bg-gray-50 dark:bg-[#1C1C1E] border border-gray-200 dark:border-gray-800 p-5 rounded-2xl flex items-center gap-4 shadow-sm"><span class="w-2 h-6 bg-blue-600 rounded-full shadow-sm"></span>$1</h2>');
    html = html.replace(/^### (.*$)/gim, '<h3 class="text-lg font-bold text-gray-800 dark:text-gray-200 mt-6 mb-3">$1</h3>');
    
    // Bold & Italic
    html = html.replace(/\*\*(.*?)\*\*/gim, '<strong class="font-black text-black dark:text-white bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded-md">$1</strong>');
    html = html.replace(/\*(.*?)\*/gim, '<em class="italic text-gray-700 dark:text-gray-300">$1</em>');

    // Process blocks
    const blocks = html.split(/\n\s*\n/);
    html = blocks.map(block => {
      if (block.trim().startsWith('<h')) return block;
      
      // Handle lists (Consignes de tournage)
      if (block.trim().startsWith('- ') || block.trim().startsWith('* ')) {
        const listItems = block.split('\n')
          .filter(l => l.trim().startsWith('- ') || l.trim().startsWith('* '))
          .map(l => `<li class="ml-6 mb-3 list-disc text-gray-700 dark:text-gray-300 pl-2 leading-relaxed">${l.replace(/^[-*]\s/, '')}</li>`)
          .join('');
        return `<ul class="mb-6 bg-gray-50 dark:bg-[#1C1C1E] p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-inner">${listItems}</ul>`;
      }
      
      // Standard paragraph
      return `<p class="mb-6 text-lg leading-relaxed text-gray-700 dark:text-gray-300">${block.replace(/\n/g, '<br>')}</p>`;
    }).join('');

    return this.sanitizer.bypassSecurityTrustHtml(html);
  }
}
