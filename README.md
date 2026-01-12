# SearchCollection

Sistema web para cadastrar e executar pesquisas de itens, com area administrativa e controle de acesso por data.

## Stack / Tecnologias
- **Backend:** Node.js (Express)
- **Banco:** SQLite (arquivo `backend/database.db`)
- **Frontend:** HTML, CSS, JavaScript (Bootstrap 5 + Bootstrap Icons)
  
## Observacoes
- O acesso de usuarios usa o campo `access_until` na tabela `users`.
- O backend cria/migra tabelas automaticamente ao iniciar.

## Como rodar (resumo)
1. Instale as dependencias do backend.
2. Inicie o backend (Node/Express).
3. Acesse o `frontend/dashboard.html` via servidor web.

> Ajuste conforme o ambiente de deploy (hosting/Apache/Nginx).


## Programa em Produção
- https://devfurtili.online/dream/frontend
