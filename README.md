# NorteSys OS — Front-end

Front-end do ERP de Ordens de Serviço, em React + TypeScript + Vite, consumindo
a API .NET 8 (`OS_API`).

## Como rodar

```bash
npm install
cp .env.example .env      # ajuste VITE_API_BASE_URL com a URL atual da API
npm run dev
```

Abra http://localhost:5173. Faça login com um usuário já cadastrado no back.

## O que já está pronto

- Login com JWT (Axios interceptor injeta o token automaticamente; 401 desloga e redireciona)
- Dashboard com indicadores, gráfico por status e últimas OS
- Ordens de Serviço: listagem com busca/filtros/ordenação/paginação, criação via modal,
  tela de detalhe com relatório técnico e alteração de status
- Clientes: listagem + CRUD (criar/editar/excluir)
- Funcionários: listagem (CRUD completo ainda não implementado — ver abaixo)
- Tema claro/escuro persistido, sidebar recolhível + drawer no mobile
- Tratamento de erro que sempre mostra a mensagem real vinda da API
  (`utils/errorHandler.ts`), nunca um texto genérico

## Pendências conhecidas (documentadas no código com `TODO(back)`)

Duas regras de negócio pedidas só existem hoje como filtro **no front**,
porque o back ainda não as implementa. Isso é só uma camada de UX — qualquer
chamada direta à API ainda devolve tudo:

1. **OS só do funcionário vinculado**: `hooks/useOrdensServico.ts` busca todas
   as OS e filtra no cliente pelas que o funcionário logado participa.
2. **Clientes/Funcionários só ativos**: `hooks/useClientes.ts` e
   `hooks/useFuncionarios.ts` filtram `ativo === true` no cliente.

Quando o back passar a suportar isso via query params (ou endpoints
dedicados), é só trocar o filtro client-side pela chamada correta — a
interface (hooks) já está isolada pra isso.

Outras pendências:

- Não existe endpoint `/api/Usuario` no back, então `hooks/useFuncionarioLogado.ts`
  descobre o funcionário logado cruzando o `sub` do JWT com `usuarioId` da lista
  de Funcionários. Um endpoint `GET /api/Usuario/me` simplificaria isso.
- CRUD completo de Funcionários (criar, editar, trocar senha, permissões) e a
  tela de Usuários/Técnicos não entraram nesta rodada — o foco combinado foi
  Ordem de Serviço. `services/funcionarioService.ts` já tem os métodos prontos.
- `types/tipoAtendimento.ts` foi inferido pelo padrão dos outros módulos
  (id, nome, ativo) — confirme os campos reais do `TipoAtendimentoDto` no back
  e ajuste se necessário.
