import { OutputPageClient } from "@/components/output/OutputPageClient";
import { getLanHost } from "@/lib/lan-host";

export default function OutputPage() {
  const lanHost = getLanHost();

  return <OutputPageClient lanHost={lanHost} />;
}
