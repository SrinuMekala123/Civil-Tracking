import pb from "./pocketbase";
import { useAuthStore } from "@/store/auth-store";

export async function createUpdateLog(data: {
    officer_name?: string;
    meeting_id?: string;
    update_type: string;
    description: string;
    previous_value?: string;
    new_value?: string;
    priority?: "Low" | "Medium" | "High";
}) {
    try {
        const user = useAuthStore.getState().user;
        const updated_by = user?.name || user?.email || "System";
        await pb.collection("update_logs").create({
            ...data,
            updated_by,
            completed_at: new Date().toISOString(),
            priority: data.priority || "Low",
            attachments: [],
        });
    } catch (err) {
        console.error("Failed to write update log:", err);
    }
}
