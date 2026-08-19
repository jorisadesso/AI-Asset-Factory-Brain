import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import crypto from "crypto";

export async function POST(req: Request) {
  const { email } = await req.json() as { email?: string };

  if (!email) {
    return NextResponse.json({ error: "E-Mail fehlt." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email } });

  // Always return success to avoid email enumeration
  if (!user) {
    return NextResponse.json({ success: true });
  }

  const token = crypto.randomBytes(32).toString("hex");
  const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordResetToken: token, passwordResetExpiry: expiry },
  });

  return NextResponse.json({ success: true, token });
}
