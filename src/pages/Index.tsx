import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();
  useEffect(() => {
    const user = localStorage.getItem("consistify_current");
    navigate(user ? "/dashboard" : "/login");
  }, [navigate]);
  return null;
};

export default Index;
