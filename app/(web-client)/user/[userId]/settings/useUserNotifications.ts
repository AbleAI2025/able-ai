import { toast } from "sonner";
import {
  updateNotificationEmailAction,
  updateNotificationSmsAction,
  updateProfileVisibilityAction,
} from "@/actions/user/user";
import { User } from "@/context/AuthContext";

export const useUserNotifications = (user: User | null) => {
  const handleToggleEmailNotification = async (currentValue: boolean) => {
    try {
      const { data, error } = await updateNotificationEmailAction(
        { emailPreferences: !currentValue },
        user?.token
      );
      if (error) {
        throw new Error(typeof error === 'string' ? error : "Failed to update email notifications");
      }
      toast.success("Email notification updated");
      return data;
    } catch (error) {
      console.error("Failed to update email notifications", error);
      throw error;
    }
  };

  const handleToggleSmsNotification = async (currentValue: boolean) => {
    try {
      const { data, error } = await updateNotificationSmsAction(
        { smsGigAlerts: !currentValue },
        user?.token
      );
      if (error) {
        throw new Error(typeof error === 'string' ? error : "Failed to update SMS notifications");
      }
      return data;
    } catch (error) {
      console.error("Failed to update SMS notifications", error);
      throw error;
    }
  };

  const handleToggleProfileVisibility = async (currentValue: boolean) => {
    try {
      const { data, error } = await updateProfileVisibilityAction(
        { profileVisibility: !currentValue },
        user?.token
      );
      if (error) {
        throw new Error(typeof error === 'string' ? error : "Failed to update profile visibility");
      }
      return data;
    } catch (error) {
      console.error("Failed to update profile visibility", error);
      throw error;
    }
  };

  return {
    handleToggleEmailNotification,
    handleToggleSmsNotification,
    handleToggleProfileVisibility,
  };
};