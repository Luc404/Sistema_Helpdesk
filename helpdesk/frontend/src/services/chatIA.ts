export const EVENTO_ABRIR_CHAT = 'helpdesk:abrir-chat-ia';

export const abrirChatIA = (ticketId: number | null = null) => {
    window.dispatchEvent(
        new CustomEvent(EVENTO_ABRIR_CHAT, { detail: { ticketId } }),
    );
};
