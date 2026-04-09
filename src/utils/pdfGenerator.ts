import html2pdf from 'html2pdf.js';

export async function generatePdf(element: HTMLElement, fileName: string, format: string = 'a4') {
  if (!element) {
    throw new Error('Elemento para geração do PDF não foi fornecido.');
  }
  
  try {
    console.log(`Iniciando geração de PDF (Motor: html2pdf.js, Formato: ${format}) para:`, fileName);
    
    // Garantir que as imagens estão carregadas
    const images = Array.from(element.getElementsByTagName('img'));
    await Promise.all(images.map(img => {
      if (img.complete) return Promise.resolve();
      return new Promise((resolve) => {
        img.onload = resolve;
        img.onerror = resolve;
      });
    }));

    // Pequeno delay para estabilização e renderização completa
    await new Promise(resolve => setTimeout(resolve, 1500));

    const opt: any = {
      margin: [15, 15, 15, 15],
      filename: fileName,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2, 
        useCORS: true, 
        letterRendering: true,
        backgroundColor: '#ffffff',
        logging: false,
        allowTaint: false,
        scrollX: 0,
        scrollY: 0,
        windowWidth: 1000,
        onclone: (clonedDoc: Document) => {
          // Remove or replace modern color functions that html2canvas cannot parse
          const styles = clonedDoc.getElementsByTagName('style');
          for (let i = 0; i < styles.length; i++) {
            const style = styles[i];
            let cssText = style.innerHTML;
            
            // Remove @theme blocks which break html2canvas parser
            cssText = cssText.replace(/@theme\s*\{[^}]+\}/g, '');
            
            if (cssText.includes('oklch') || cssText.includes('oklab') || cssText.includes('color-mix')) {
              // Replace modern color functions with a safe fallback
              // This prevents the parser from crashing while keeping most styles
              // Using a more aggressive regex to handle nested functions
              cssText = cssText.replace(/(oklch|oklab|color-mix)\([^;}]+\)/g, '#18181b');
            }
            
            style.innerHTML = cssText;
          }
          
          // Also check inline styles and remove problematic variables
          const elements = clonedDoc.getElementsByTagName('*');
          for (let i = 0; i < elements.length; i++) {
            const el = elements[i] as HTMLElement;
            // Remove Tailwind v4 variables that might contain oklch/oklab
            if (el.style) {
              // Remove all --tw variables as they often contain modern color functions
              const propsToRemove = [];
              for (let j = 0; j < el.style.length; j++) {
                const prop = el.style[j];
                if (prop.startsWith('--tw-')) {
                  propsToRemove.push(prop);
                }
              }
              propsToRemove.forEach(prop => el.style.removeProperty(prop));
              
              if (el.style.color?.includes('okl') || el.style.color?.includes('color-mix')) el.style.color = '#18181b';
              if (el.style.backgroundColor?.includes('okl') || el.style.backgroundColor?.includes('color-mix')) el.style.backgroundColor = '#ffffff';
              if (el.style.borderColor?.includes('okl') || el.style.borderColor?.includes('color-mix')) el.style.borderColor = '#e4e4e7';
            }
            
            // Force page break inside avoid for text blocks
            if (el.tagName === 'P' || el.tagName === 'LI' || el.tagName.match(/^H[1-6]$/)) {
              el.style.pageBreakInside = 'avoid';
              el.style.breakInside = 'avoid';
            }
          }
          
          // Inject a fallback stylesheet for critical layout utilities in case Tailwind CSS is completely dropped
          const fallbackStyle = clonedDoc.createElement('style');
          fallbackStyle.innerHTML = `
            .flex { display: flex !important; }
            .flex-col { flex-direction: column !important; }
            .justify-between { justify-content: space-between !important; }
            .justify-center { justify-content: center !important; }
            .justify-end { justify-content: flex-end !important; }
            .items-center { align-items: center !important; }
            .items-start { align-items: flex-start !important; }
            .items-end { align-items: flex-end !important; }
            .text-right { text-align: right !important; }
            .text-center { text-align: center !important; }
            .text-left { text-align: left !important; }
            .w-full { width: 100% !important; }
            .h-full { height: 100% !important; }
            .grid { display: grid !important; }
            .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
            .grid-cols-12 { grid-template-columns: repeat(12, minmax(0, 1fr)) !important; }
            .col-span-8 { grid-column: span 8 / span 8 !important; }
            .col-span-4 { grid-column: span 4 / span 4 !important; }
            .col-span-2 { grid-column: span 2 / span 2 !important; }
            .gap-1 { gap: 0.25rem !important; }
            .gap-2 { gap: 0.5rem !important; }
            .gap-3 { gap: 0.75rem !important; }
            .gap-4 { gap: 1rem !important; }
            .gap-6 { gap: 1.5rem !important; }
            .gap-8 { gap: 2rem !important; }
            .gap-12 { gap: 3rem !important; }
            .gap-16 { gap: 4rem !important; }
            .gap-20 { gap: 5rem !important; }
            .gap-24 { gap: 6rem !important; }
            .mb-2 { margin-bottom: 0.5rem !important; }
            .mb-4 { margin-bottom: 1rem !important; }
            .mb-6 { margin-bottom: 1.5rem !important; }
            .mb-8 { margin-bottom: 2rem !important; }
            .mb-10 { margin-bottom: 2.5rem !important; }
            .mb-12 { margin-bottom: 3rem !important; }
            .mb-16 { margin-bottom: 4rem !important; }
            .mt-16 { margin-top: 4rem !important; }
            .mt-20 { margin-top: 5rem !important; }
            .p-6 { padding: 1.5rem !important; }
            .p-8 { padding: 2rem !important; }
            .p-10 { padding: 2.5rem !important; }
            .p-12 { padding: 3rem !important; }
            .py-4 { padding-top: 1rem !important; padding-bottom: 1rem !important; }
            .py-5 { padding-top: 1.25rem !important; padding-bottom: 1.25rem !important; }
            .px-6 { padding-left: 1.5rem !important; padding-right: 1.5rem !important; }
            .border { border-width: 1px !important; border-style: solid !important; }
            .border-b { border-bottom-width: 1px !important; border-style: solid !important; }
            .border-t { border-top-width: 1px !important; border-style: solid !important; }
            .border-b-4 { border-bottom-width: 4px !important; border-style: solid !important; }
            .border-t-4 { border-top-width: 4px !important; border-style: solid !important; }
            .rounded-xl { border-radius: 0.75rem !important; }
            .rounded-2xl { border-radius: 1rem !important; }
            .rounded-3xl { border-radius: 1.5rem !important; }
            .shadow-sm { box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05) !important; }
            .shadow-lg { box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1) !important; }
            .font-bold { font-weight: 700 !important; }
            .font-black { font-weight: 900 !important; }
            .text-xs { font-size: 0.75rem !important; line-height: 1rem !important; }
            .text-sm { font-size: 0.875rem !important; line-height: 1.25rem !important; }
            .text-base { font-size: 1rem !important; line-height: 1.5rem !important; }
            .text-lg { font-size: 1.125rem !important; line-height: 1.75rem !important; }
            .text-xl { font-size: 1.25rem !important; line-height: 1.75rem !important; }
            .text-2xl { font-size: 1.5rem !important; line-height: 2rem !important; }
            .text-3xl { font-size: 1.875rem !important; line-height: 2.25rem !important; }
            .text-4xl { font-size: 2.25rem !important; line-height: 2.5rem !important; }
            .text-5xl { font-size: 3rem !important; line-height: 1 !important; }
            .text-6xl { font-size: 3.75rem !important; line-height: 1 !important; }
            .uppercase { text-transform: uppercase !important; }
            .tracking-widest { letter-spacing: 0.1em !important; }
            .tracking-tighter { letter-spacing: -0.05em !important; }
            .leading-none { line-height: 1 !important; }
            .leading-tight { line-height: 1.25 !important; }
            .leading-relaxed { line-height: 1.625 !important; }
            .bg-white { background-color: #ffffff !important; }
            .bg-zinc-50 { background-color: #fafafa !important; }
            .bg-zinc-100 { background-color: #f4f4f5 !important; }
            .bg-blue-50 { background-color: #eff6ff !important; }
            .bg-emerald-50 { background-color: #ecfdf5 !important; }
            .text-zinc-400 { color: #a1a1aa !important; }
            .text-zinc-500 { color: #71717a !important; }
            .text-zinc-600 { color: #52525b !important; }
            .text-zinc-800 { color: #27272a !important; }
            .text-zinc-900 { color: #18181b !important; }
            .text-blue-600 { color: #2563eb !important; }
            .text-blue-700 { color: #1d4ed8 !important; }
            .text-emerald-600 { color: #059669 !important; }
            .text-emerald-700 { color: #047857 !important; }
            .border-zinc-100 { border-color: #f4f4f5 !important; }
            .border-zinc-200 { border-color: #e4e4e7 !important; }
            .border-zinc-300 { border-color: #d4d4d8 !important; }
            .border-blue-100 { border-color: #dbeafe !important; }
            .border-emerald-100 { border-color: #d1fae5 !important; }
            .border-emerald-600 { border-color: #059669 !important; }
            .w-12 { width: 3rem !important; }
            .h-12 { height: 3rem !important; }
            .w-14 { width: 3.5rem !important; }
            .h-14 { height: 3.5rem !important; }
            .w-16 { width: 4rem !important; }
            .h-16 { height: 4rem !important; }
            .w-20 { width: 5rem !important; }
            .h-20 { height: 5rem !important; }
            .w-24 { width: 6rem !important; }
            .h-24 { height: 6rem !important; }
            .w-32 { width: 8rem !important; }
            .w-36 { width: 9rem !important; }
            .w-40 { width: 10rem !important; }
            .shrink-0 { flex-shrink: 0 !important; }
            .flex-1 { flex: 1 1 0% !important; }
            .relative { position: relative !important; }
            .absolute { position: absolute !important; }
            .top-0 { top: 0 !important; }
            .left-0 { left: 0 !important; }
            .bottom-0 { bottom: 0 !important; }
            .object-contain { object-fit: contain !important; }
            .object-cover { object-fit: cover !important; }
            .overflow-hidden { overflow: hidden !important; }
            .inline-block { display: inline-block !important; }
            .divide-y > :not([hidden]) ~ :not([hidden]) { border-top-width: 1px !important; border-style: solid !important; }
            .divide-zinc-100 > :not([hidden]) ~ :not([hidden]) { border-color: #f4f4f5 !important; }
            table { border-collapse: collapse !important; width: 100% !important; }
          `;
          clonedDoc.head.appendChild(fallbackStyle);
        }
      },
      jsPDF: { 
        unit: 'mm', 
        format: format, 
        orientation: 'portrait',
        compress: true,
        precision: 16
      },
      pagebreak: { 
        mode: ['avoid-all', 'css', 'legacy'],
        avoid: ['.break-inside-avoid', 'tr', '.no-break', 'img', 'table', 'h1', 'h2', 'h3', 'h4', 'h5', 'li', 'p']
      }
    };

    // Usando html2pdf para gerar o PDF respeitando quebras de página
    // Geramos como Blob para ter mais controle sobre o download e evitar extensão .bin
    const worker = html2pdf().set(opt).from(element);
    const pdfBlob = await worker.output('blob');
    
    // Garantir que o Blob tenha o tipo MIME correto
    const blob = new Blob([pdfBlob], { type: 'application/pdf' });
    
    // Criar URL para o Blob
    const url = URL.createObjectURL(blob);
    
    // Criar elemento de link temporário para forçar o download com o nome correto
    const link = document.createElement('a');
    link.href = url;
    
    // Garantir que o nome do arquivo seja seguro e termine com .pdf
    const sanitizedFileName = fileName
      .replace(/[/\\?%*:|"<>]/g, '-') // Remover caracteres inválidos para nomes de arquivo
      .trim();
    
    const finalFileName = sanitizedFileName.toLowerCase().endsWith('.pdf') 
      ? sanitizedFileName 
      : `${sanitizedFileName}.pdf`;
    
    link.download = finalFileName;
    
    // Adicionar ao corpo, clicar e remover
    document.body.appendChild(link);
    link.click();
    
    // Pequeno delay antes de limpar para garantir que o download iniciou
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 200);
    
    console.log(`PDF gerado e download iniciado manualmente: ${finalFileName}`);
    
    // Convert blob to base64 to return
    return new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result as string);
      };
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Erro crítico na geração do PDF:', error);
    let message = 'Erro desconhecido';
    if (error instanceof Error) {
      message = error.message;
    } else if (typeof error === 'string') {
      message = error;
    }
    throw new Error(`Falha na geração do PDF: ${message}`);
  }
}

export async function sharePdf(element: HTMLElement, fileName: string, format: string = 'a4') {
  if (!element) {
    throw new Error('Elemento para geração do PDF não foi fornecido.');
  }

  try {
    console.log(`Iniciando geração de PDF para compartilhamento:`, fileName);
    
    // Garantir que as imagens estão carregadas
    const images = Array.from(element.getElementsByTagName('img'));
    await Promise.all(images.map(img => {
      if (img.complete) return Promise.resolve();
      return new Promise((resolve) => {
        img.onload = resolve;
        img.onerror = resolve;
      });
    }));

    await new Promise(resolve => setTimeout(resolve, 1500));

    const opt: any = {
      margin: [15, 15, 15, 15],
      filename: fileName,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2,
        useCORS: true, 
        letterRendering: true,
        backgroundColor: '#ffffff',
        logging: false,
        allowTaint: false,
        scrollX: 0,
        scrollY: 0,
        windowWidth: 1000,
        onclone: (clonedDoc: Document) => {
          // Remove or replace modern CSS that html2canvas cannot parse
          const styles = clonedDoc.getElementsByTagName('style');
          for (let i = 0; i < styles.length; i++) {
            const style = styles[i];
            let cssText = style.innerHTML;
            
            // Remove @theme blocks which break html2canvas parser
            cssText = cssText.replace(/@theme\s*\{[^}]+\}/g, '');
            
            if (cssText.includes('oklch') || cssText.includes('oklab') || cssText.includes('color-mix')) {
              // Replace modern color functions with a safe fallback
              // This prevents the parser from crashing while keeping most styles
              // Using a more aggressive regex to handle nested functions
              cssText = cssText.replace(/(oklch|oklab|color-mix)\([^;}]+\)/g, '#18181b');
            }
            
            style.innerHTML = cssText;
          }
          
          // Also check inline styles and remove problematic variables
          const elements = clonedDoc.getElementsByTagName('*');
          for (let i = 0; i < elements.length; i++) {
            const el = elements[i] as HTMLElement;
            // Remove Tailwind v4 variables that might contain oklch/oklab
            if (el.style) {
              // Remove all --tw variables as they often contain modern color functions
              const propsToRemove = [];
              for (let j = 0; j < el.style.length; j++) {
                const prop = el.style[j];
                if (prop.startsWith('--tw-')) {
                  propsToRemove.push(prop);
                }
              }
              propsToRemove.forEach(prop => el.style.removeProperty(prop));
              
              if (el.style.color?.includes('okl') || el.style.color?.includes('color-mix')) el.style.color = '#18181b';
              if (el.style.backgroundColor?.includes('okl') || el.style.backgroundColor?.includes('color-mix')) el.style.backgroundColor = '#ffffff';
              if (el.style.borderColor?.includes('okl') || el.style.borderColor?.includes('color-mix')) el.style.borderColor = '#e4e4e7';
            }
            
            // Force page break inside avoid for text blocks
            if (el.tagName === 'P' || el.tagName === 'LI' || el.tagName.match(/^H[1-6]$/)) {
              el.style.pageBreakInside = 'avoid';
              el.style.breakInside = 'avoid';
            }
          }
          
          // Inject a fallback stylesheet for critical layout utilities in case Tailwind CSS is completely dropped
          const fallbackStyle = clonedDoc.createElement('style');
          fallbackStyle.innerHTML = `
            .flex { display: flex !important; }
            .flex-col { flex-direction: column !important; }
            .justify-between { justify-content: space-between !important; }
            .justify-center { justify-content: center !important; }
            .justify-end { justify-content: flex-end !important; }
            .items-center { align-items: center !important; }
            .items-start { align-items: flex-start !important; }
            .items-end { align-items: flex-end !important; }
            .text-right { text-align: right !important; }
            .text-center { text-align: center !important; }
            .text-left { text-align: left !important; }
            .w-full { width: 100% !important; }
            .h-full { height: 100% !important; }
            .grid { display: grid !important; }
            .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
            .grid-cols-12 { grid-template-columns: repeat(12, minmax(0, 1fr)) !important; }
            .col-span-8 { grid-column: span 8 / span 8 !important; }
            .col-span-4 { grid-column: span 4 / span 4 !important; }
            .col-span-2 { grid-column: span 2 / span 2 !important; }
            .gap-1 { gap: 0.25rem !important; }
            .gap-2 { gap: 0.5rem !important; }
            .gap-3 { gap: 0.75rem !important; }
            .gap-4 { gap: 1rem !important; }
            .gap-6 { gap: 1.5rem !important; }
            .gap-8 { gap: 2rem !important; }
            .gap-12 { gap: 3rem !important; }
            .gap-16 { gap: 4rem !important; }
            .gap-20 { gap: 5rem !important; }
            .gap-24 { gap: 6rem !important; }
            .mb-2 { margin-bottom: 0.5rem !important; }
            .mb-4 { margin-bottom: 1rem !important; }
            .mb-6 { margin-bottom: 1.5rem !important; }
            .mb-8 { margin-bottom: 2rem !important; }
            .mb-10 { margin-bottom: 2.5rem !important; }
            .mb-12 { margin-bottom: 3rem !important; }
            .mb-16 { margin-bottom: 4rem !important; }
            .mt-16 { margin-top: 4rem !important; }
            .mt-20 { margin-top: 5rem !important; }
            .p-6 { padding: 1.5rem !important; }
            .p-8 { padding: 2rem !important; }
            .p-10 { padding: 2.5rem !important; }
            .p-12 { padding: 3rem !important; }
            .py-4 { padding-top: 1rem !important; padding-bottom: 1rem !important; }
            .py-5 { padding-top: 1.25rem !important; padding-bottom: 1.25rem !important; }
            .px-6 { padding-left: 1.5rem !important; padding-right: 1.5rem !important; }
            .border { border-width: 1px !important; border-style: solid !important; }
            .border-b { border-bottom-width: 1px !important; border-style: solid !important; }
            .border-t { border-top-width: 1px !important; border-style: solid !important; }
            .border-b-4 { border-bottom-width: 4px !important; border-style: solid !important; }
            .border-t-4 { border-top-width: 4px !important; border-style: solid !important; }
            .rounded-xl { border-radius: 0.75rem !important; }
            .rounded-2xl { border-radius: 1rem !important; }
            .rounded-3xl { border-radius: 1.5rem !important; }
            .shadow-sm { box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05) !important; }
            .shadow-lg { box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1) !important; }
            .font-bold { font-weight: 700 !important; }
            .font-black { font-weight: 900 !important; }
            .text-xs { font-size: 0.75rem !important; line-height: 1rem !important; }
            .text-sm { font-size: 0.875rem !important; line-height: 1.25rem !important; }
            .text-base { font-size: 1rem !important; line-height: 1.5rem !important; }
            .text-lg { font-size: 1.125rem !important; line-height: 1.75rem !important; }
            .text-xl { font-size: 1.25rem !important; line-height: 1.75rem !important; }
            .text-2xl { font-size: 1.5rem !important; line-height: 2rem !important; }
            .text-3xl { font-size: 1.875rem !important; line-height: 2.25rem !important; }
            .text-4xl { font-size: 2.25rem !important; line-height: 2.5rem !important; }
            .text-5xl { font-size: 3rem !important; line-height: 1 !important; }
            .text-6xl { font-size: 3.75rem !important; line-height: 1 !important; }
            .uppercase { text-transform: uppercase !important; }
            .tracking-widest { letter-spacing: 0.1em !important; }
            .tracking-tighter { letter-spacing: -0.05em !important; }
            .leading-none { line-height: 1 !important; }
            .leading-tight { line-height: 1.25 !important; }
            .leading-relaxed { line-height: 1.625 !important; }
            .bg-white { background-color: #ffffff !important; }
            .bg-zinc-50 { background-color: #fafafa !important; }
            .bg-zinc-100 { background-color: #f4f4f5 !important; }
            .bg-blue-50 { background-color: #eff6ff !important; }
            .bg-emerald-50 { background-color: #ecfdf5 !important; }
            .text-zinc-400 { color: #a1a1aa !important; }
            .text-zinc-500 { color: #71717a !important; }
            .text-zinc-600 { color: #52525b !important; }
            .text-zinc-800 { color: #27272a !important; }
            .text-zinc-900 { color: #18181b !important; }
            .text-blue-600 { color: #2563eb !important; }
            .text-blue-700 { color: #1d4ed8 !important; }
            .text-emerald-600 { color: #059669 !important; }
            .text-emerald-700 { color: #047857 !important; }
            .border-zinc-100 { border-color: #f4f4f5 !important; }
            .border-zinc-200 { border-color: #e4e4e7 !important; }
            .border-zinc-300 { border-color: #d4d4d8 !important; }
            .border-blue-100 { border-color: #dbeafe !important; }
            .border-emerald-100 { border-color: #d1fae5 !important; }
            .border-emerald-600 { border-color: #059669 !important; }
            .w-12 { width: 3rem !important; }
            .h-12 { height: 3rem !important; }
            .w-14 { width: 3.5rem !important; }
            .h-14 { height: 3.5rem !important; }
            .w-16 { width: 4rem !important; }
            .h-16 { height: 4rem !important; }
            .w-20 { width: 5rem !important; }
            .h-20 { height: 5rem !important; }
            .w-24 { width: 6rem !important; }
            .h-24 { height: 6rem !important; }
            .w-32 { width: 8rem !important; }
            .w-36 { width: 9rem !important; }
            .w-40 { width: 10rem !important; }
            .shrink-0 { flex-shrink: 0 !important; }
            .flex-1 { flex: 1 1 0% !important; }
            .relative { position: relative !important; }
            .absolute { position: absolute !important; }
            .top-0 { top: 0 !important; }
            .left-0 { left: 0 !important; }
            .bottom-0 { bottom: 0 !important; }
            .object-contain { object-fit: contain !important; }
            .object-cover { object-fit: cover !important; }
            .overflow-hidden { overflow: hidden !important; }
            .inline-block { display: inline-block !important; }
            .divide-y > :not([hidden]) ~ :not([hidden]) { border-top-width: 1px !important; border-style: solid !important; }
            .divide-zinc-100 > :not([hidden]) ~ :not([hidden]) { border-color: #f4f4f5 !important; }
            table { border-collapse: collapse !important; width: 100% !important; }
          `;
          clonedDoc.head.appendChild(fallbackStyle);
        }
      },
      jsPDF: { 
        unit: 'mm', 
        format: format, 
        orientation: 'portrait',
        compress: true,
        precision: 16
      },
      pagebreak: { 
        mode: ['avoid-all', 'css', 'legacy'],
        avoid: ['.break-inside-avoid', 'tr', '.no-break', 'img', 'table', 'h1', 'h2', 'h3', 'h4', 'h5', 'li', 'p']
      }
    };

    const worker = html2pdf().set(opt).from(element);
    const pdfBlob = await worker.output('blob');
    
    const sanitizedFileName = fileName
      .replace(/[/\\?%*:|"<>]/g, '-')
      .trim();
    
    const finalFileName = sanitizedFileName.toLowerCase().endsWith('.pdf') 
      ? sanitizedFileName 
      : `${sanitizedFileName}.pdf`;

    const file = new File([pdfBlob], finalFileName, { type: 'application/pdf' });

    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        files: [file],
        title: finalFileName,
        text: `Documento: ${finalFileName}`
      });
      return true;
    } else {
      // Fallback para download se não puder compartilhar
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = finalFileName;
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 200);
      throw new Error('Compartilhamento não suportado neste navegador. O arquivo foi baixado em vez disso.');
    }
  } catch (error) {
    console.error('Erro ao compartilhar PDF:', error);
    throw error;
  }
}
