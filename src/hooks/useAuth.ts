import { useContext } from "react";
import { AuthContext, type AuthContextType } from "@/contexts/AuthContext";

export const useAuth = (): AuthContextType => {
  return useContext(AuthContext);
};
