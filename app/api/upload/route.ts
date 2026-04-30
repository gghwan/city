import { NextResponse } from 'next/server';
import { uploadFileAction } from '@/actions/file.actions';
import { AppError } from '@/lib/errors';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    await uploadFileAction(formData);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ ok: false, code: error.code, message: error.message }, { status: error.status });
    }

    return NextResponse.json({ ok: false, code: 'E009', message: '일시적인 오류가 발생했습니다.' }, { status: 500 });
  }
}
