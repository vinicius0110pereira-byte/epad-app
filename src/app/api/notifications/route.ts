import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getUnreadNotifications, markNotificationsRead } from "@/services/notification.service";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const notifications = await getUnreadNotifications(session.user.id);
  return NextResponse.json(notifications);
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const ids: string[] = body.ids ?? [];
  await markNotificationsRead(session.user.id, ids);
  return NextResponse.json({ ok: true });
}
