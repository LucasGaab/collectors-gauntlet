/**
 * Cria ou atualiza o usuário do painel.
 *
 *   npx tsx scripts/definir-senha.ts <usuario> <senha>
 *
 * Não existe tela de cadastro de propósito: o app é single-user, e uma rota de
 * signup aberta na internet seria justamente o buraco que a autenticação veio
 * fechar. Trocar a senha é rodar isto de novo.
 *
 * Todas as sessões antigas são encerradas ao trocar a senha — senão um aparelho
 * já logado continuaria dentro com a credencial antiga.
 */
import { PrismaClient } from "@prisma/client";
import { gerarHash } from "../lib/senha";

const prisma = new PrismaClient();

async function main() {
  const [login, senha] = process.argv.slice(2);

  if (!login || !senha) {
    console.error("Uso: npx tsx scripts/definir-senha.ts <usuario> <senha>");
    process.exit(1);
  }
  if (senha.length < 8) {
    console.error("A senha precisa ter pelo menos 8 caracteres.");
    process.exit(1);
  }

  const senhaHash = await gerarHash(senha);

  const usuario = await prisma.usuario.upsert({
    where: { login },
    update: { senhaHash },
    create: { login, senhaHash },
  });

  const encerradas = await prisma.sessao.deleteMany({ where: { usuarioId: usuario.id } });

  console.log(`Usuário "${login}" pronto.`);
  if (encerradas.count > 0) {
    console.log(`${encerradas.count} sessão(ões) anterior(es) encerrada(s) pela troca de senha.`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
