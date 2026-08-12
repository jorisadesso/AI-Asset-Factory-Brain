import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth/helpers";
import { prisma } from "@/lib/db/client";
import { updateBrainCompletion } from "@/lib/completion/scorer";
import { z } from "zod";

const TargetGroupSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  industry: z.string().default(""),
  description: z.string().default(""),
  personas: z.array(z.object({ name: z.string(), description: z.string().default("") })).default([]),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const brain = await prisma.brain.findFirst({ where: { userId: session.user.id } });
  if (!brain) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const groups = await prisma.targetGroup.findMany({
    where: { brainId: brain.id },
    include: { personas: true },
    orderBy: { sortOrder: "asc" },
  });

  return NextResponse.json({ groups });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const brain = await prisma.brain.findFirst({ where: { userId: session.user.id } });
  if (!brain) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const data = TargetGroupSchema.parse(body);

  const count = await prisma.targetGroup.count({ where: { brainId: brain.id } });

  const group = await prisma.targetGroup.create({
    data: {
      brainId: brain.id,
      name: data.name,
      industry: data.industry,
      description: data.description,
      sortOrder: count,
      personas: {
        create: data.personas.map((p) => ({ name: p.name, description: p.description })),
      },
    },
    include: { personas: true },
  });

  await updateBrainCompletion(brain.id);
  return NextResponse.json({ group });
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const brain = await prisma.brain.findFirst({ where: { userId: session.user.id } });
  if (!brain) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const { id, ...data } = TargetGroupSchema.parse(body);
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  // Delete existing personas and recreate
  await prisma.persona.deleteMany({ where: { targetGroupId: id } });

  const group = await prisma.targetGroup.update({
    where: { id },
    data: {
      name: data.name,
      industry: data.industry,
      description: data.description,
      personas: {
        create: data.personas.map((p) => ({ name: p.name, description: p.description })),
      },
    },
    include: { personas: true },
  });

  await updateBrainCompletion(brain.id);
  return NextResponse.json({ group });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const brain = await prisma.brain.findFirst({ where: { userId: session.user.id } });
  if (!brain) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  await prisma.targetGroup.deleteMany({ where: { id, brainId: brain.id } });
  await updateBrainCompletion(brain.id);
  return NextResponse.json({ success: true });
}
