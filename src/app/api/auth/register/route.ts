import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import bcrypt from "bcryptjs";
import { z } from "zod";

const RegisterSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  organizationName: z.string().min(2),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, password, organizationName } = RegisterSchema.parse(body);

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "E-Mail bereits registriert" }, { status: 409 });
    }

    const hashed = await bcrypt.hash(password, 12);
    const slug = organizationName.toLowerCase().replace(/[^a-z0-9]/g, "-") + "-" + Date.now();

    const org = await prisma.organization.create({
      data: { name: organizationName, slug },
    });

    const user = await prisma.user.create({
      data: { name, email, password: hashed, organizationId: org.id },
    });

    // Create default brain
    await prisma.brain.create({
      data: {
        name: `${organizationName} – AI Asset Factory Brain`,
        organizationId: org.id,
        userId: user.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    console.error("Register error:", error);
    return NextResponse.json({ error: "Registrierung fehlgeschlagen" }, { status: 500 });
  }
}
