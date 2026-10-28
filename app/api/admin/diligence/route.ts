import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAccess } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';
import { ALLOWED_DOC_TYPES, DILIGENCE_CATEGORIES, MAX_DOC_BYTES } from '@/lib/diligence';

/** Uploads one file to the data room. */
export async function POST(req: NextRequest) {
  const admin = await verifyAdminAccess(req);
  if (!admin.success) return NextResponse.json({ error: admin.error }, { status: admin.statusCode || 403 });
  const form = await req.formData().catch(() => null);
  const file = form?.get('file');
  const category = String(form?.get('category') ?? '');
  if (!(file instanceof File) || !file.size) return NextResponse.json({ error: 'Choose a file.' }, { status: 400 });
  if (file.size > MAX_DOC_BYTES) return NextResponse.json({ error: 'Files must be under 4 MB.' }, { status: 413 });
  if (!(DILIGENCE_CATEGORIES as readonly string[]).includes(category)) return NextResponse.json({ error: 'Choose a section.' }, { status: 400 });
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  const mimeType = ALLOWED_DOC_TYPES[ext];
  if (!mimeType) return NextResponse.json({ error: 'Use PDF, Word, Excel, PowerPoint, CSV or an image.' }, { status: 415 });
  const title = String(form?.get('title') ?? '').trim().slice(0, 120) || file.name.replace(/\.[^.]+$/, '');
  const doc = await prisma.diligenceDoc.create({ data: { title, category, fileName: file.name.slice(0, 160), mimeType, size: file.size, data: Buffer.from(await file.arrayBuffer()) }, select: { id: true } });
  return NextResponse.json(doc);
}
