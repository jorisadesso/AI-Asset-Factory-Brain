import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  const { token, password } = await req.json() as { token?: string; password?: string };

  if (!token || !password || password.length < 8) {
    return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 400 });
  }

  const user = await prisma.user.findFirst({
    where: {
      passwordResetToken: token,
      passwordResetExpiry: { gt: new Date() },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "Der Link ist ungültig oder abgelaufen." }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash, passwordResetToken: null, passwordResetExpiry: null },
  });

  return NextResponse.json({ success: true });
}
