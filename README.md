# 🛍️ FKA Imports · Backend

API do projeto FKA Imports, que conecta o catálogo e a área administrativa ao banco de dados e a serviços externos.

> 🤖 Projeto construído com assistência de IA na geração e alteração do código. Guilherme é estudante de Engenharia de Software, atualmente focado em Java, e ainda está desenvolvendo autonomia de programação. As tecnologias descritas representam contato prático assistido, não domínio independente ou certificação.

## Tecnologias presentes

Node.js, Express, PostgreSQL (Supabase), Cloudinary, JWT e bcrypt. O projeto também declara integração com a API de dados do Google Analytics.

## Organização

| Caminho | Responsabilidade |
| --- | --- |
| `server.js` | Inicialização do Express e registro das rotas |
| `database/db.js` | Conexão PostgreSQL e inicialização de tabelas |
| `middleware/authMiddleware.js` | Middleware de autenticação |
| `routes/` | Produtos, autenticação, avaliações, configurações, analytics e uploads |

## Estado e cuidados

Projeto sem uso atual pelo autor, mantido privado. Não foi realizada auditoria completa de segurança nem validação funcional nesta revisão documental.

O início da aplicação executa inicialização e alterações no banco: não rode contra uma base de produção apenas para testar. O código contém configurações específicas do ambiente original; adapte-as e use uma base isolada antes de executar. Credenciais, chaves e dados reais não devem ser publicados, inclusive no histórico Git.

## Experiência registrada

Contato assistido com APIs, autenticação, persistência e integração de serviços. A presença de mecanismos de segurança no código não equivale a uma garantia de segurança.
