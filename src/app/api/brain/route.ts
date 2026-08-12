import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth/helpers";
import { prisma } from "@/lib/db/client";
import { computeCompletionStatus } from "@/lib/completion/scorer";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });
  }

  const brain = await prisma.brain.findFirst({
    where: { userId: session.user.id },
    include: {
      sections: true,
      categories: { orderBy: { sortOrder: "asc" } },
      targetGroups: { include: { personas: true }, orderBy: { sortOrder: "asc" } },
    },
  });

  if (!brain) {
    return NextResponse.json({ error: "Kein Brain gefunden" }, { status: 404 });
  }

  const completionStatus = await computeCompletionStatus(brain.id);

  return NextResponse.json({ brain, completionStatus });
}
