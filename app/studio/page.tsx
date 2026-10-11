import { requireStudioAdmin } from "@/lib/studio-auth";
import StudioDashboard from "./studio-dashboard";

export const dynamic = "force-dynamic";

export default async function StudioPage() {
  const authMethod = await requireStudioAdmin();
  return <StudioDashboard authMethod={authMethod} />;
}
