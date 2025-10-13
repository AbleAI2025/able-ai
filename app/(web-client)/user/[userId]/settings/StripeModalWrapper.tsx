import React from "react";
import StripeModal from "@/app/components/settings/stripeModal";
import StripeElementsProvider from "@/lib/stripe/StripeElementsProvider";
import { UserRole, FlowStep } from "@/app/types/SettingsTypes";
import { User } from "@/context/AuthContext";

interface StripeModalWrapperProps {
  show: boolean;
  userLastRole: UserRole;
  user: User | null;
  currentStep: FlowStep;
  isConnectingStripe: boolean;
  onCloseModal: () => void;
  handleOpenStripeConnection: () => void;
  handleStripeConnect: () => void;
  onPrimaryAction?: () => void; // This is just for compatibility, the functions are passed to StripeModal
}

export const StripeModalWrapper: React.FC<StripeModalWrapperProps> = ({
  show,
  userLastRole,
  user,
  currentStep,
  isConnectingStripe,
  onCloseModal,
  handleOpenStripeConnection,
  handleStripeConnect,
}) => {
  if (!show) return null;
  if (!user) return null;

  return userLastRole === "BUYER" ? (
    <>
      <StripeElementsProvider
        options={{
          mode: "setup",
          currency: "gbp",
          appearance: {
            theme: "night",
            labels: "floating",
          },
        }}
      >
        <StripeModal
          userId={user?.uid}
          userRole={userLastRole}
          connectionStep={currentStep}
          isConnectingStripe={isConnectingStripe}
          handleCloseModal={onCloseModal}
          onPrimaryAction={handleOpenStripeConnection}
        />
      </StripeElementsProvider>
    </>
  ) : (
    <StripeModal
      userId={user?.uid}
      userRole={userLastRole}
      connectionStep={currentStep}
      isConnectingStripe={isConnectingStripe}
      handleCloseModal={onCloseModal}
      onPrimaryAction={handleStripeConnect}
    />
  );
};