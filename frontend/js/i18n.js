(function () {
  const translations = {
    pt: {
      lang: { pt: "PT", en: "EN" },
      status: { available: "Disponivel", unavailable: "Indisponivel" },
      common: {
        close: "Fechar",
        save: "Salvar",
        reload: "Recarregar",
        back: "Voltar",
        next: "Proximo",
        previous: "Anterior",
        send: "Enviar"
      },
      dashboard: {
        nav: {
          request_access: "Solicitar acesso",
          profile: "Perfil",
          admin: "Admin",
          logout: "Sair",
          discord: "Discord"
        },
        new_search: "Nova Pesquisa",
        item_name: "Nome do Item",
        type: "Tipo",
        options: "Opcoes",
        select: "Selecione...",
        add_search: "Adicionar Pesquisa",
        saved_searches: "Pesquisas Salvas",
        saved_count: "Qtd itens na lista",
        search_placeholder: "Buscar por nome",
        status_all: "Todos",
        status_available: "Somente disponiveis",
        run_search: "Pesquisar Itens",
        table: {
          name: "Nome do Item",
          type: "Tipo",
          options: "Opcoes",
          status: "Status",
          qty: "Qtd",
          actions: "Acoes"
        },
        details_title: "Detalhes",
        details_prefix: "Detalhes - {label}",
        details_loading: "Carregando...",
        details_unavailable: "Item indisponivel no momento.",
        details_list_title: "Itens encontrados",
        details_no_price: "Sem preco",
        details_no_lots: "Nenhum lote encontrado.",
        item_generic: "Item",
        item_label: "Item {index}",
        button: { details: "Detalhes", delete: "Excluir", go: "Ir" },
        empty_list: "Nenhuma pesquisa cadastrada.",
        empty_filter: "Nenhuma pesquisa encontrada para o filtro selecionado.",
        loading_default: "Processando...",
        loading_sub: "Aguarde, isso pode levar alguns segundos.",
        loading_search: "Pesquisando itens no market...",
        loading_searches: "Carregando suas pesquisas...",
        loading_save: "Salvando pesquisa...",
        loading_delete: "Excluindo pesquisa...",
        alert_plan_invalid: "Selecione um plano valido.",
        alert_required_fields: "Preencha todos os campos obrigatorios.",
        alert_email_invalid: "Emails nao conferem ou sao invalidos.",
        confirm_delete: "Excluir esta pesquisa?",
        access_expired_request: "Acesso expirado. Solicite mais tempo para continuar.",
        details_error: "Erro ao buscar detalhes.",
        alert_no_searches: "Nenhuma pesquisa cadastrada.",
        alert_enter_name: "Informe o nome do item.",
        alert_enter_type: "Informe o tipo do item.",
        alert_duplicate: "Essa pesquisa ja foi cadastrada com o mesmo item, tipo e opcoes.",
        alert_error_save: "Erro ao salvar a pesquisa.",
        alert_error_delete: "Erro ao excluir a pesquisa.",
        alert_error_load: "Erro ao carregar pesquisas.",
        alert_error_run: "Erro ao executar a busca.",
        whatsapp: {
          greeting: "Ola! Solicitei acesso ao Search Collection.",
          user: "Usuario: {user}",
          plan: "Plano: {plan}",
          currency: "Moeda: {currency}",
          price: "Valor: {price}"
        },
        access: {
          expired: "Acesso expirou",
          until: "Acesso ate {date}",
          renew: "Parabens e obrigado pelo apoio! Seu acesso foi renovado ate {date}."
        },
        access_modal: {
          title: "Acesso ao sistema",
          p1: "Este sistema foi criado para ajudar jogadores do <strong>MuDream</strong> a organizar colecoes e equipamentos de forma pratica e eficiente.",
          p2: "O acesso inicial e gratuito por tempo limitado, permitindo que voce conheca todas as funcionalidades. Apos esse periodo, sera solicitada uma contribuicao simbolica, utilizada apenas para manter o sistema ativo (hospedagem, dominio e melhorias continuas).",
          p3: "Essa ferramenta e independente e nao possui vinculo oficial com o <strong>MuDream</strong>.",
          p4: "Ao solicitar o acesso, voce concorda com estas condicoes.",
          terms: "Termos de Uso",
          discord_official: "Discord Oficial",
          choose_plan: "Escolha um plano:",
          currency: "Moeda:",
          real: "Real",
          dolar: "Dolar",
          plan_week: "1 semana",
          plan_30: "30 dias",
          plan_60: "60 dias",
          plan_days: "{count} dias",
          contact_note: "Observacoes (opcional)",
          contact_note_placeholder: "Preferencia de contato, horario, etc",
          request_error: "Falha ao enviar solicitacao.",
          info: "Ao enviar a solicitacao, o administrador tentara responder o mais rapido possivel. Forma de pagamento no momento: PIX.",
          next: "Proximo",
          close: "Fechar"
        },
        access_details: {
          title: "Dados da solicitacao",
          summary: "Resumo do plano",
          first_name: "Nome",
          last_name: "Sobrenome",
          email: "Email",
          email_confirm: "Confirmar email",
          phone: "Celular/Whatsapp",
          back: "Voltar",
          submit: "Enviar solicitacao"
        },
        access_sent: {
          title: "Solicitacao enviada com sucesso",
          body: "Retornaremos o mais breve possivel com a chave de pagamento no valor solicitado. Obrigado pelo apoio!",
          whatsapp: "Solicitar via Whatsapp",
          ok: "Ok"
        },
        renewal: {
          title: "Acesso renovado",
          body: "Obrigado pelo apoio. Seu acesso foi renovado."
        },
        profile: {
          title: "Perfil",
          username: "Usuario",
          email: "Email",
          password: "Nova senha",
          password_placeholder: "Digite a nova senha",
          password_confirm: "Confirmar senha",
          password_confirm_placeholder: "Confirme a nova senha",
          created_at: "Criado em",
          access_until: "Acesso ate",
          renew: "Renovar acesso",
          load_error: "Erro ao carregar perfil.",
          save_ok: "Perfil atualizado.",
          save_error: "Erro ao salvar perfil.",
          password_mismatch: "Senhas nao conferem.",
          username_required: "Informe o usuario.",
          email_required: "Informe o email.",
          email_invalid: "Email invalido."
        },
        profile_loading: "Carregando perfil..."
      },
      admin: {
        title: "Search Collection Beta - Usuarios",
        back: "Voltar",
        tabs: {
          users: "Usuarios",
          smtp: "SMTP",
          discord: "Discord",
          requests: "Solicitacoes"
        },
        users: {
          header: "Controle de Usuarios",
          reload: "Recarregar",
          empty: "Nenhum usuario encontrado.",
          loading: "Carregando...",
          id: "ID",
          username: "Usuario",
          email: "Email",
          access_until: "Acesso ate",
          created_at: "Criado em",
          new_password: "Nova senha",
          actions: "Acoes",
          save: "Salvar",
          page_info: "Mostrando {start}-{end} de {total}",
          error_load: "Erro ao carregar usuarios.",
          error_save: "Erro ao salvar usuario.",
          updated: "Usuario atualizado.",
          invalid_email: "Email invalido.",
          need_fields: "Informe usuario, email, senha ou data de acesso."
        },
        smtp: {
          header: "Configuracao de Email (SMTP)",
          host: "SMTP Host",
          port: "SMTP Porta",
          secure: "SSL/TLS",
          user: "SMTP Usuario",
          pass: "SMTP Senha",
          from: "Email Remetente",
          test: "Email de Teste",
          save: "Salvar SMTP",
          test_send: "Testar Envio",
          save_ok: "Configuracao SMTP salva.",
          save_error: "Erro ao salvar configuracao SMTP.",
          load_error: "Erro ao carregar configuracao SMTP.",
          test_required: "Informe o email de teste.",
          test_ok: "Email de teste enviado.",
          test_error: "Erro ao enviar email de teste."
        },
        discord: {
          header: "Configuracao do Discord",
          webhook: "Webhook URL",
          cooldown: "Cooldown (minutos)",
          save: "Salvar Discord",
          test: "Testar Discord",
          save_ok: "Configuracao do Discord salva.",
          save_error: "Erro ao salvar configuracao do Discord.",
          load_error: "Erro ao carregar configuracao do Discord.",
          test_ok: "Teste enviado para o Discord.",
          test_error: "Erro ao testar Discord.",
          webhook_required: "Informe a Webhook URL.",
          cooldown_invalid: "Informe um cooldown valido."
        },
        requests: {
          header: "Solicitacoes de acesso",
          status_all: "Todas",
          status_pending: "Pendentes",
          status_done: "Concluidas",
          status_canceled: "Canceladas",
          empty: "Nenhuma solicitacao encontrada.",
          loading: "Carregando...",
          id: "ID",
          user: "Usuario",
          email: "Email cadastro",
          name: "Nome",
          contact_email: "Email contato",
          phone: "Whatsapp",
          plan: "Plano",
          currency: "Moeda",
          price: "Valor",
          date: "Data",
          status: "Status",
          actions: "Acoes",
          pending: "Pendente",
          done: "Concluida",
          canceled: "Cancelada",
          finish: "Concluir",
          refuse: "Recusar",
          reopen: "Reabrir",
          page_info: "Mostrando {start}-{end} de {total}",
          error_load: "Erro ao carregar solicitacoes.",
          error_update: "Erro ao atualizar solicitacao.",
          updated: "Solicitacao atualizada."
        },
        plan: {
          week: "1 semana",
          days: "{count} dias"
        }
      }
    },
    en: {
      lang: { pt: "PT", en: "EN" },
      status: { available: "Available", unavailable: "Unavailable" },
      common: {
        close: "Close",
        save: "Save",
        reload: "Reload",
        back: "Back",
        next: "Next",
        previous: "Previous",
        send: "Send"
      },
      dashboard: {
        nav: {
          request_access: "Request access",
          profile: "Profile",
          admin: "Admin",
          logout: "Logout",
          discord: "Discord"
        },
        new_search: "New Search",
        item_name: "Item Name",
        type: "Type",
        options: "Options",
        select: "Select...",
        add_search: "Add Search",
        saved_searches: "Saved Searches",
        saved_count: "Items in list",
        search_placeholder: "Search by name",
        status_all: "All",
        status_available: "Available only",
        run_search: "Search Items",
        table: {
          name: "Item Name",
          type: "Type",
          options: "Options",
          status: "Status",
          qty: "Qty",
          actions: "Actions"
        },
        details_title: "Details",
        details_prefix: "Details - {label}",
        details_loading: "Loading...",
        details_unavailable: "Item unavailable at the moment.",
        details_list_title: "Items found",
        details_no_price: "No price",
        details_no_lots: "No lots found.",
        item_generic: "Item",
        item_label: "Item {index}",
        button: { details: "Details", delete: "Delete", go: "Go" },
        empty_list: "No searches saved.",
        empty_filter: "No searches found for the selected filter.",
        loading_default: "Processing...",
        loading_sub: "Please wait, this may take a few seconds.",
        loading_search: "Searching items in market...",
        loading_searches: "Loading your searches...",
        loading_save: "Saving search...",
        loading_delete: "Deleting search...",
        alert_plan_invalid: "Select a valid plan.",
        alert_required_fields: "Fill in all required fields.",
        alert_email_invalid: "Emails do not match or are invalid.",
        confirm_delete: "Delete this search?",
        access_expired_request: "Access expired. Request more time to continue.",
        details_error: "Error loading details.",
        alert_no_searches: "No searches saved.",
        alert_enter_name: "Enter the item name.",
        alert_enter_type: "Select the item type.",
        alert_duplicate: "This search already exists with the same item, type and options.",
        alert_error_save: "Error saving search.",
        alert_error_delete: "Error deleting search.",
        alert_error_load: "Error loading searches.",
        alert_error_run: "Error running the search.",
        whatsapp: {
          greeting: "Hello! I requested access to Search Collection.",
          user: "User: {user}",
          plan: "Plan: {plan}",
          currency: "Currency: {currency}",
          price: "Price: {price}"
        },
        access: {
          expired: "Access expired",
          until: "Access until {date}",
          renew: "Thanks for your support! Your access was renewed until {date}."
        },
        access_modal: {
          title: "System access",
          p1: "This system was created to help <strong>MuDream</strong> players organize collections and gear in a practical and efficient way.",
          p2: "Initial access is free for a limited time, so you can try all features. After that period, a symbolic contribution will be requested to keep the system running (hosting, domain and continuous improvements).",
          p3: "This tool is independent and has no official connection with <strong>MuDream</strong>.",
          p4: "By requesting access, you agree with these conditions.",
          terms: "Terms of Use",
          discord_official: "Official Discord",
          choose_plan: "Choose a plan:",
          currency: "Currency:",
          real: "BRL",
          dolar: "USD",
          plan_week: "1 week",
          plan_30: "30 days",
          plan_60: "60 days",
          plan_days: "{count} days",
          contact_note: "Notes (optional)",
          contact_note_placeholder: "Contact preference, time, etc",
          request_error: "Failed to submit request.",
          info: "After sending the request, the admin will respond as soon as possible. Payment method: PIX.",
          next: "Next",
          close: "Close"
        },
        access_details: {
          title: "Request details",
          summary: "Plan summary",
          first_name: "First name",
          last_name: "Last name",
          email: "Email",
          email_confirm: "Confirm email",
          phone: "Phone/Whatsapp",
          back: "Back",
          submit: "Send request"
        },
        access_sent: {
          title: "Request sent successfully",
          body: "We will get back to you as soon as possible with the payment key for the requested amount. Thanks for your support!",
          whatsapp: "Request via Whatsapp",
          ok: "Ok"
        },
        renewal: {
          title: "Access renewed",
          body: "Thanks for your support. Your access was renewed."
        },
        profile: {
          title: "Profile",
          username: "Username",
          email: "Email",
          password: "New password",
          password_placeholder: "Enter new password",
          password_confirm: "Confirm password",
          password_confirm_placeholder: "Confirm new password",
          created_at: "Created at",
          access_until: "Access until",
          renew: "Renew access",
          load_error: "Error loading profile.",
          save_ok: "Profile updated.",
          save_error: "Error saving profile.",
          password_mismatch: "Passwords do not match.",
          username_required: "Enter username.",
          email_required: "Enter email.",
          email_invalid: "Invalid email."
        },
        profile_loading: "Loading profile..."
      },
      admin: {
        title: "Search Collection Beta - Users",
        back: "Back",
        tabs: {
          users: "Users",
          smtp: "SMTP",
          discord: "Discord",
          requests: "Requests"
        },
        users: {
          header: "User Management",
          reload: "Reload",
          empty: "No users found.",
          loading: "Loading...",
          id: "ID",
          username: "Username",
          email: "Email",
          access_until: "Access until",
          created_at: "Created at",
          new_password: "New password",
          actions: "Actions",
          save: "Save",
          page_info: "Showing {start}-{end} of {total}",
          error_load: "Error loading users.",
          error_save: "Error saving user.",
          updated: "User updated.",
          invalid_email: "Invalid email.",
          need_fields: "Provide username, email, password or access date."
        },
        smtp: {
          header: "Email Configuration (SMTP)",
          host: "SMTP Host",
          port: "SMTP Port",
          secure: "SSL/TLS",
          user: "SMTP User",
          pass: "SMTP Password",
          from: "Sender Email",
          test: "Test Email",
          save: "Save SMTP",
          test_send: "Send Test",
          save_ok: "SMTP settings saved.",
          save_error: "Error saving SMTP settings.",
          load_error: "Error loading SMTP settings.",
          test_required: "Enter the test email.",
          test_ok: "Test email sent.",
          test_error: "Error sending test email."
        },
        discord: {
          header: "Discord Configuration",
          webhook: "Webhook URL",
          cooldown: "Cooldown (minutes)",
          save: "Save Discord",
          test: "Test Discord",
          save_ok: "Discord settings saved.",
          save_error: "Error saving Discord settings.",
          load_error: "Error loading Discord settings.",
          test_ok: "Test sent to Discord.",
          test_error: "Error testing Discord.",
          webhook_required: "Enter the Webhook URL.",
          cooldown_invalid: "Enter a valid cooldown."
        },
        requests: {
          header: "Access requests",
          status_all: "All",
          status_pending: "Pending",
          status_done: "Done",
          status_canceled: "Canceled",
          empty: "No requests found.",
          loading: "Loading...",
          id: "ID",
          user: "User",
          email: "Account email",
          name: "Name",
          contact_email: "Contact email",
          phone: "Whatsapp",
          plan: "Plan",
          currency: "Currency",
          price: "Price",
          date: "Date",
          status: "Status",
          actions: "Actions",
          pending: "Pending",
          done: "Done",
          canceled: "Canceled",
          finish: "Approve",
          refuse: "Reject",
          reopen: "Reopen",
          page_info: "Showing {start}-{end} of {total}",
          error_load: "Error loading requests.",
          error_update: "Error updating request.",
          updated: "Request updated."
        },
        plan: {
          week: "1 week",
          days: "{count} days"
        }
      }
    }
  };

  const DEFAULT_LANG = "pt";
  const LOCALE_BY_LANG = { pt: "pt-BR", en: "en-US" };

  function getLang() {
    return localStorage.getItem("lang") || DEFAULT_LANG;
  }

  function getLocale() {
    return LOCALE_BY_LANG[getLang()] || LOCALE_BY_LANG[DEFAULT_LANG];
  }

  function t(key, vars) {
    const lang = getLang();
    const parts = String(key || "").split(".");
    let value = translations[lang];
    for (const part of parts) {
      value = value?.[part];
    }
    if (value == null) {
      value = translations[DEFAULT_LANG];
      for (const part of parts) {
        value = value?.[part];
      }
    }
    if (value == null) return key;
    if (typeof value !== "string") return key;
    if (!vars) return value;
    return value.replace(/\{(\w+)\}/g, (_, name) => String(vars[name] ?? ""));
  }

  function apply(root) {
    const scope = root || document;
    scope.querySelectorAll("[data-i18n]").forEach(el => {
      el.textContent = t(el.getAttribute("data-i18n"));
    });
    scope.querySelectorAll("[data-i18n-html]").forEach(el => {
      el.innerHTML = t(el.getAttribute("data-i18n-html"));
    });
    scope.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
      el.setAttribute("placeholder", t(el.getAttribute("data-i18n-placeholder")));
    });
    scope.querySelectorAll("[data-i18n-title]").forEach(el => {
      el.setAttribute("title", t(el.getAttribute("data-i18n-title")));
    });
    const html = document.documentElement;
    if (html) {
      html.setAttribute("lang", getLang() === "en" ? "en" : "pt-BR");
    }
  }

  function setLang(lang) {
    if (!translations[lang]) return;
    localStorage.setItem("lang", lang);
    updateToggle(lang);
    apply();
    document.dispatchEvent(new CustomEvent("langchange", { detail: { lang } }));
  }

  function updateToggle(lang) {
    document.querySelectorAll("[data-lang-switch]").forEach(btn => {
      const isActive = btn.getAttribute("data-lang") === lang;
      btn.classList.toggle("active", isActive);
    });
  }

  function init() {
    const lang = getLang();
    updateToggle(lang);
    apply();
  }

  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-lang-switch]");
    if (!btn) return;
    const lang = btn.getAttribute("data-lang");
    setLang(lang);
  });

  document.addEventListener("DOMContentLoaded", init);

  window.I18N = {
    t,
    apply,
    setLang,
    getLang,
    getLocale
  };
})();
