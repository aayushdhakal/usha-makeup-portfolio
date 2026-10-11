import { chatGPTSignInPath } from "@/app/chatgpt-auth";
import StudioAuthCard from "../studio-auth-card";

export default function StudioLoginPage() {
  return <StudioAuthCard mode="login" currentSignInPath={chatGPTSignInPath("/studio")} />;
}
