/**
 * Utilitário centralizado para conversão e manipulação de datas
 * Suporta formatos: DD/MM/YYYY e YYYY-MM-DD
 */

/**
 * Converte data em qualquer formato para timestamp (milissegundos)
 * @param dateStr Data em formato DD/MM/YYYY ou YYYY-MM-DD
 * @returns Timestamp em milissegundos
 */
export const dateToTimestamp = (dateStr: string): number => {
  if (dateStr.includes('/')) {
    // Formato DD/MM/YYYY
    const [day, month, year] = dateStr.split('/').map(Number);
    return new Date(year, month - 1, day).getTime();
  } else {
    // Formato YYYY-MM-DD
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day).getTime();
  }
};

/**
 * Converte data DD/MM/YYYY para formato ISO YYYY-MM-DD
 * @param dateStr Data em formato DD/MM/YYYY ou já em YYYY-MM-DD
 * @returns Data em formato ISO YYYY-MM-DD
 */
export const convertToISO = (dateStr: string): string => {
  if (dateStr.includes('/')) {
    const [day, month, year] = dateStr.split('/').map(Number);
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }
  return dateStr;
};

/**
 * Converte data ISO YYYY-MM-DD para formato DD/MM/YYYY
 * @param dateStr Data em formato YYYY-MM-DD ou já em DD/MM/YYYY
 * @returns Data em formato DD/MM/YYYY
 */
export const convertFromISO = (dateStr: string): string => {
  if (dateStr.includes('-')) {
    const [year, month, day] = dateStr.split('-').map(Number);
    return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
  }
  return dateStr;
};

/**
 * Compara duas datas cronologicamente
 * @param dateA Primeira data (DD/MM/YYYY ou YYYY-MM-DD)
 * @param dateB Segunda data (DD/MM/YYYY ou YYYY-MM-DD)
 * @returns -1 se dateA < dateB, 0 se iguais, 1 se dateA > dateB
 */
export const compareDates = (dateA: string, dateB: string): number => {
  const tsA = dateToTimestamp(dateA);
  const tsB = dateToTimestamp(dateB);
  if (tsA < tsB) return -1;
  if (tsA > tsB) return 1;
  return 0;
};

/**
 * Adiciona dias a uma data
 * @param dateStr Data em formato DD/MM/YYYY ou YYYY-MM-DD
 * @param days Número de dias a adicionar
 * @returns Data resultante no mesmo formato da entrada
 */
export const addDays = (dateStr: string, days: number): string => {
  const isISO = dateStr.includes('-');
  const ts = dateToTimestamp(dateStr);
  const newDate = new Date(ts + days * 24 * 60 * 60 * 1000);
  
  const year = newDate.getFullYear();
  const month = String(newDate.getMonth() + 1).padStart(2, '0');
  const day = String(newDate.getDate()).padStart(2, '0');
  
  if (isISO) {
    return `${year}-${month}-${day}`;
  } else {
    return `${day}/${month}/${year}`;
  }
};

/**
 * Verifica se uma data está dentro de um intervalo
 * @param dateStr Data a verificar (DD/MM/YYYY ou YYYY-MM-DD)
 * @param startDate Data inicial (DD/MM/YYYY ou YYYY-MM-DD)
 * @param endDate Data final (DD/MM/YYYY ou YYYY-MM-DD)
 * @returns true se dateStr está entre startDate e endDate (inclusive)
 */
export const isDateInRange = (dateStr: string, startDate: string, endDate: string): boolean => {
  const ts = dateToTimestamp(dateStr);
  const tsStart = dateToTimestamp(startDate);
  const tsEnd = dateToTimestamp(endDate);
  return ts >= tsStart && ts <= tsEnd;
};
