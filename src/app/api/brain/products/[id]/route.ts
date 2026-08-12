import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";
import { generateProductCategoriesMarkdown } from "@/lib/knowledge/generator";

const productSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  features: z.array(z.string()),
  usps: z.array(z.string()),
});

async function ensureOwnership(userId: string, productId: string) {
  const brain = await prisma.brain.findFirst({ where: { userId } });
  if (!brain) return null;
  const product = await prisma.productCategory.findFirst({
    where: { id: productId, brainId: brain.id },
  });
  return product ? brain : null;
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });

  const { id } = await params;
  const brain = await ensureOwnership(session.user.id, id);
  if (!brain) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });

  const body = await req.json() as unknown;
  const parsed = productSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Ungültige Daten" }, { status: 400 });

  const updated = await prisma.productCategory.update({
    where: { id },
    data: {
      name: parsed.data.name,
      description: parsed.data.description,
      features: JSON.stringify(parsed.data.features),
      usps: JSON.stringify(parsed.data.usps),
    },
  });

  await regenerateMarkdown(brain.id);

  return NextResponse.json({
    ...updated,
    features: parsed.data.features,
    usps: parsed.data.usps,
  });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });

  const { id } = await params;
  const brain = await ensureOwnership(session.user.id, id);
  if (!brain) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });

  await prisma.productCategory.delete({ where: { id } });
  await regenerateMarkdown(brain.id);

  return NextResponse.json({ success: true });
}

async function regenerateMarkdown(brainId: string) {
  const categories = await prisma.productCategory.findMany({
    where: { brainId },
    orderBy: { sortOrder: "asc" },
  });
  const markdown = generateProductCategoriesMarkdown(
    categories.map((c) => ({
      name: c.name,
      description: c.description ?? undefined,
      features: JSON.parse(c.features) as string[],
      usps: JSON.parse(c.usps) as string[],
    }))
  );
  await prisma.knowledgeDocument.upsert({
    where: { brainId_sectionType: { brainId, sectionType: "PRODUCT_CATEGORIES" } },
    create: { brainId, fileName: "product-categories.md", content: markdown, sectionType: "PRODUCT_CATEGORIES" },
    update: { content: markdown, version: { increment: 1 } },
  });
}
