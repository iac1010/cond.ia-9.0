export const safeFormatDate = (dateString: string | Date | undefined | null, options?: Intl.DateTimeFormatOptions, locale = 'pt-BR'): string => {
  if (!dateString) return 'Data inválida';
  
  let date: Date;
  if (typeof dateString === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    // Se for apenas uma string de data YYYY-MM-DD, tratamos como data local
    // para evitar problemas de fuso horário (que jogam a data para o dia anterior)
    const [year, month, day] = dateString.split('-').map(Number);
    date = new Date(year, month - 1, day);
  } else {
    date = new Date(dateString);
  }

  if (isNaN(date.getTime())) return 'Data inválida';
  return date.toLocaleDateString(locale, options);
};

export const safeFormatTime = (dateString: string | Date | undefined | null, locale = 'pt-BR'): string => {
  if (!dateString) return '';
  
  // Se for apenas data YYYY-MM-DD, não tem horário específico
  if (typeof dateString === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return 'Dia todo';
  }

  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  
  return date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
};
