/**
 * Simple markdown to HTML converter for rendering formatted text
 */
export function renderMarkdown(text: string): string {
  if (!text) return '';
  
  let html = text;
  
  // Escape HTML entities first
  html = html.replace(/&/g, '&amp;')
             .replace(/</g, '&lt;')
             .replace(/>/g, '&gt;');
  
  // Headers (must be at start of line)
  html = html.replace(/^#### (.+)$/gm, '<h4 class="text-lg font-bold text-gray-800 mt-6 mb-2">$1</h4>');
  html = html.replace(/^### (.+)$/gm, '<h3 class="text-xl font-bold text-gray-800 mt-6 mb-3">$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2 class="text-2xl font-bold text-gray-800 mt-8 mb-4">$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1 class="text-3xl font-bold text-gray-900 mt-8 mb-4">$1</h1>');
  
  // Bold and italic
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold">$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em class="italic">$1</em>');
  html = html.replace(/___(.+?)___/g, '<strong><em>$1</em></strong>');
  html = html.replace(/__(.+?)__/g, '<strong class="font-semibold">$1</strong>');
  html = html.replace(/_(.+?)_/g, '<em class="italic">$1</em>');
  
  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code class="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono text-gray-800">$1</code>');
  
  // Bullet lists (- or *)
  html = html.replace(/^[\-\*] (.+)$/gm, '<li class="ml-4 list-disc">$1</li>');
  
  // Numbered lists
  html = html.replace(/^\d+\. (.+)$/gm, '<li class="ml-4 list-decimal">$1</li>');
  
  // Wrap consecutive list items in ul/ol tags
  html = html.replace(/((?:<li class="ml-4 list-disc">.+<\/li>\n?)+)/g, '<ul class="my-4 space-y-1">$1</ul>');
  html = html.replace(/((?:<li class="ml-4 list-decimal">.+<\/li>\n?)+)/g, '<ol class="my-4 space-y-1">$1</ol>');
  
  // Blockquotes
  html = html.replace(/^&gt; (.+)$/gm, '<blockquote class="border-l-4 border-amber-300 pl-4 my-4 italic text-gray-700">$1</blockquote>');
  
  // Horizontal rules
  html = html.replace(/^---$/gm, '<hr class="my-6 border-t border-gray-300" />');
  html = html.replace(/^\*\*\*$/gm, '<hr class="my-6 border-t border-gray-300" />');
  
  // Paragraphs - wrap non-tagged lines
  const lines = html.split('\n');
  const processedLines = lines.map(line => {
    const trimmed = line.trim();
    if (!trimmed) return '<br />';
    if (trimmed.startsWith('<')) return line;
    return `<p class="my-2">${line}</p>`;
  });
  html = processedLines.join('\n');
  
  // Clean up multiple br tags
  html = html.replace(/(<br \/>\s*){3,}/g, '<br /><br />');
  
  return html;
}

