/**
 * WhatsApp Integration Service (Retired Evolution API)
 */

/**
 * Sends a text message (Mock implementation - Evolution API retired)
 * @param to Recipient phone number
 * @param text Message content
 */
export const sendWhatsAppMessage = async (to: string, text: string): Promise<boolean> => {
  console.log(`[WhatsApp Mock] Sending to ${to}: ${text}`);
  // Return true to simulate success so the app flow continues
  return true;
};
