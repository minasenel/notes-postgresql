document.addEventListener('DOMContentLoaded', () => {
  // Modal-based delete confirm
  const overlay = document.getElementById('confirm-modal');
  const btnDismiss = overlay?.querySelector('[data-dismiss]');
  const btnConfirm = overlay?.querySelector('[data-confirm]');
  let pendingForm = null;

  // Open modal : burada modalı açmak için kullanılır.
  const openModal = (form) => {
    pendingForm = form;
    overlay?.classList.add('show');
    overlay?.setAttribute('aria-hidden', 'false');
  };
  const closeModal = () => { //burada modalı kapatmak için kullanılır.
    overlay?.classList.remove('show');
    overlay?.setAttribute('aria-hidden', 'true');
    pendingForm = null;
  };

  // Confirm modal : burada confirm modalı oluşturuluyor. bu modal notları silmek için kullanılır.
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

  // Summary modal : burada summary modalı oluşturuluyor. bu modal notları özetlemek için kullanılır.
  const summaryOverlay = document.getElementById('summary-modal');
  const btnDismissSummary = summaryOverlay?.querySelector('[data-dismiss-summary]');
  const summaryContent = document.getElementById('summary-content');

  const openSummaryModal = () => {
    summaryOverlay?.classList.add('show');
    summaryOverlay?.setAttribute('aria-hidden', 'false');
  };
  const closeSummaryModal = () => { //burada summary modalını kapatmak için kullanılır.
    summaryOverlay?.classList.remove('show');
    summaryOverlay?.setAttribute('aria-hidden', 'true');
  };

  btnDismissSummary?.addEventListener('click', closeSummaryModal);
  summaryOverlay?.addEventListener('click', (e) => { if (e.target === summaryOverlay) closeSummaryModal(); });

  // Handle summarize button clicks : burada summarize button'a tıklandığında notları özetlemek için kullanılır.
  document.addEventListener('click', async (e) => {
    if (e.target.classList.contains('summarize-btn')) {
      const noteId = e.target.getAttribute('data-note-id');
      openSummaryModal();
      summaryContent.innerHTML = '<div class="loading">Özet oluşturuluyor...</div>';
      
      try {
        const response = await fetch(`/notes/${noteId}/summarize`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          }
        });
        
        const data = await response.json();
        
        if (response.ok) { //burada summary modalının içeriğini görüntülemek için kullanılır.
          summaryContent.innerHTML = `<p>${data.summary}</p>`;
        } else {
          summaryContent.innerHTML = `<p class="error">Hata: ${data.error}</p>`;
        }
      } catch (error) {
        summaryContent.innerHTML = `<p class="error">Bağlantı hatası: ${error.message}</p>`;
      }
    }
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

  // Autofocus first input in create form : burada create form'a odaklanmak için kullanılır.
  const createForm = document.querySelector('.create-card form');
  if (createForm) {
    const first = createForm.querySelector('input, textarea');
    if (first) first.focus();
  }
});

