// DELETE /api/cleanup/po-previews?token=CLEANUP_SECRET_TOKEN
// Removes PNG preview files older than 24 hours from public/po-previews/.
// Called automatically (fire-and-forget) by the send-line route after each send.

import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  const token = request.nextUrl.searchParams.get('token');
  const expectedToken = process.env.CLEANUP_SECRET_TOKEN;

  if (!expectedToken || token !== expectedToken) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const dir = path.join(process.cwd(), 'public', 'po-previews');

  let files: string[];
  try {
    files = await fs.readdir(dir);
  } catch {
    return NextResponse.json({ deleted: 0, message: 'Directory not found or empty' });
  }

  const now = Date.now();
  let deleted = 0;
  const errors: string[] = [];

  for (const file of files) {
    if (file === '.gitkeep') continue;
    const filePath = path.join(dir, file);
    try {
      const stat = await fs.stat(filePath);
      if (now - stat.mtimeMs > TWENTY_FOUR_HOURS_MS) {
        await fs.unlink(filePath);
        deleted++;
      }
    } catch {
      errors.push(file);
    }
  }

  return NextResponse.json({
    deleted,
    ...(errors.length ? { errors } : {}),
    message: `Deleted ${deleted} file(s)`,
  });
}

export const dynamic = 'force-dynamic';
