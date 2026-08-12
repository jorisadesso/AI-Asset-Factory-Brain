import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth/helpers";
import { prisma } from "@/lib/db/client";
import { updateBrainCompletion } from "@/lib/completion/scorer";
import { z } from "zod";

const CategorySchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  description: z.string().default(""),
  features: z.array(z.string()).default([]),
  usps: z.array(z.string()).default([]),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const brain = await prisma.brain.findFirst({ where: { userId: session.user.id } });
  if (!brain) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const categories = await prisma.productCategory.findMany({
    where: { brainId: brain.id },
    orderBy: { sortOrder: "asc" },
  });

  return NextResponse.json({ categories });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const brain = await prisma.brain.findFirst({ where: { userId: session.user.id } });
  if (!brain) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const data = CategorySchema.parse(body);

  const count = await prisma.productCategory.count({ where: { brainId: brain.id } });

  const category = await prisma.productCategory.create({
    data: {
      brainId: brain.id,
      name: data.name,
      description: data.description,
      features: JSON.stringify(data.features),
      usps: JSON.stringify(data.usps),
      sortOrder: count,
    },
  });

  await updateBrainCompletion(brain.id);
  return NextResponse.json({ category });
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const brain = await prisma.brain.findFirst({ where: { userId: session.user.id } });
  if (!brain) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const { id, ...data } = CategorySchema.parse(body);

  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  const category = await prisma.productCategory.update({
    where: { id },
    data: {
      name: data.name,
      description: data.description,
      features: JSON.stringify(data.features),
      usps: JSON.stringify(data.usps),
    },
  });

  await updateBrainCompletion(brain.id);
  return NextResponse.json({ category });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const brain = await prisma.brain.findFirst({ where: { userId: session.user.id } });
  if (!brain) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  await prisma.productCategory.deleteMany({ where: { id, brainId: brain.id } });
  await updateBrainCompletion(brain.id);
  return NextResponse.json({ success: true });
}
