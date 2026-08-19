import { KnowledgeBase } from "@/components/dashboard/KnowledgeBase";
import { UploadLibrary } from "@/components/dashboard/UploadLibrary";

export default function KnowledgePage() {
  return (
    <div className="space-y-10">
      <KnowledgeBase />
      <UploadLibrary />
    </div>
  );
}
