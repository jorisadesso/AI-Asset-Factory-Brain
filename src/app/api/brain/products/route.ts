import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db/prisma";
import { getBrainForUser } from "@/lib/db/brain";
import { z } from "zod";

const productSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  features: z.array(z.string()),
  usps: z.array(z.string()),
});

async function getBrain(userId: string) {
  return getBrainForUser(userId);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });

  const body = await req.json() as unknown;
  const parsed = productSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Ungültige Daten" }, { status: 400 });

  const brain = await getBrain(session.user.id);
  if (!brain) return NextResponse.json({ error: "Brain nicht gefunden" }, { status: 404 });

  const count = await prisma.productCategory.count({ where: { brainId: brain.id } });

  const category = await prisma.productCategory.create({
    data: {
      brainId: brain.id,
      name: parsed.data.name,
      description: parsed.data.description,
      features: JSON.stringify(parsed.data.features),
      usps: JSON.stringify(parsed.data.usps),
      sortOrder: count,
    },
  });

  await updateProductMarkdown(brain.id);

  return NextResponse.json({
    ...category,
    features: parsed.data.features,
    usps: parsed.data.usps,
  });
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });

  const brain = await getBrain(session.user.id);
  if (!brain) return NextResponse.json([]);

  const categories = await prisma.productCategory.findMany({
    where: { brainId: brain.id },
    orderBy: { sortOrder: "asc" },
  });

  return NextResponse.json(
    categories.map((c) => ({
      ...c,
      features: JSON.parse(c.features) as string[],
      usps: JSON.parse(c.usps) as string[],
    }))
  );
}

async function updateProductMarkdown(brainId: string) {
  const { generateProductCategoriesMarkdown } = await import("@/lib/knowledge/generator");
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
