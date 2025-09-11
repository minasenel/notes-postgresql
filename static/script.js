document.addEventListener('DOMContentLoaded', () => {
  // Modal-based delete confirm
  const overlay = document.getElementById('confirm-modal');
  const btnDismiss = overlay?.querySelector('[data-dismiss]');
  const btnConfirm = overlay?.querySelector('[data-confirm]');
  let pendingForm = null;

  const openModal = (form) => {
    pendingForm = form;
    overlay?.classList.add('show');
    overlay?.setAttribute('aria-hidden', 'false');
  };
  const closeModal = () => {
    overlay?.classList.remove('show');
    overlay?.setAttribute('aria-hidden', 'true');
    pendingForm = null;
  };

  document.querySelectorAll('form[action$="/delete"]').forEach((form) => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      openModal(form);
    });
  });
  btnDismiss?.addEventListener('click', closeModal);
  overlay?.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });
  btnConfirm?.addEventListener('click', () => {
    if (pendingForm) pendingForm.submit();
    closeModal();
  });

  // Auto-resize textareas
  const autoResize = (ta) => {
    ta.style.height = 'auto';
    ta.style.height = ta.scrollHeight + 'px';
  };
  document.querySelectorAll('textarea').forEach((ta) => {
    autoResize(ta);
    ta.addEventListener('input', () => autoResize(ta));
  });

  // Autofocus first input in create form
  const createForm = document.querySelector('.create-card form');
  if (createForm) {
    const first = createForm.querySelector('input, textarea');
    if (first) first.focus();
  }
});

