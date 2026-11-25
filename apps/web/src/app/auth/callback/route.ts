import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { safeNext } from '@/lib/utils';

/**
 * Destino dos links enviados por e-mail (confirmação de cadastro e redefinição de senha):
 * troca o código pela sessão e segue para `next`.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get('code');
  const next = safeNext(searchParams.get('next') ?? '');
  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, origin));
    // Link de cadastro aberto em outro navegador ou aparelho: o Supabase já confirmou o e-mail antes de mandar
    // para cá, só não há como abrir a sessão neste navegador. A pessoa entra com a senha.
    if (next !== '/redefinir-senha' && !searchParams.get('error')) {
      const to = new URL('/entrar', origin);
      to.searchParams.set('confirmado', '1');
      if (next !== '/') to.searchParams.set('next', next);
      return NextResponse.redirect(to);
    }
  }
  return NextResponse.redirect(new URL('/entrar?erro=link', origin));
}
