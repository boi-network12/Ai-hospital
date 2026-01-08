import { apiFetch } from "@/Utils/api";

export const createOrGetChatRoom = async (professionalId: string) => {
    try {
        // First, try to get existing chat
        const response = await apiFetch(`/chat/rooms/by-participant/${professionalId}`);
        return response.data;
    } catch (error) {
        // If no chat exists, create one
        const response = await apiFetch('/chat/rooms', {
            method: 'POST',
            body: {
                participantIds: [professionalId],
                isGroup: false
            }
        });
        return response.data;
    }
};