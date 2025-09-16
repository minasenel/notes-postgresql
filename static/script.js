document.addEventListener('DOMContentLoaded', () => {
  // Modal-based delete confirm
  const overlay = document.getElementById('confirm-modal');
  const btnDismiss = overlay?.querySelector('[data-dismiss]');
  const btnConfirm = overlay?.querySelector('[data-confirm]');
  const confirmTitleEl = overlay?.querySelector('#confirm-title');
  const confirmTextEl = overlay?.querySelector('.modal p');
  const defaultConfirmTitle = confirmTitleEl?.textContent || 'Silinsin mi?';
  const defaultConfirmText = confirmTextEl?.textContent || 'Bu işlemi geri alamazsınız.';
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
      if (confirmTitleEl) confirmTitleEl.textContent = defaultConfirmTitle;
      if (confirmTextEl) confirmTextEl.textContent = defaultConfirmText;
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

  // Handle summarize button clicks : bura summarize button'a tıklandığında notları özetlemek için kullanılır.
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

  // Textarea character counter + Cmd/Ctrl+Enter submit
  const counters = document.querySelectorAll('.textarea-counter');
  counters.forEach((el) => {
    const forId = el.getAttribute('data-for');
    const ta = document.getElementById(forId);
    if (!ta) return;
    const max = parseInt(ta.getAttribute('maxlength') || '0', 10);
    const update = () => {
      const len = ta.value.length;
      el.textContent = max ? `${len}/${max}` : `${len}`;
    };
    update();
    ta.addEventListener('input', update);
    ta.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        const form = ta.closest('form');
        if (form) form.submit();
      }
    });
  });

  // Autofocus first input in create form 
  const createForm = document.querySelector('.create-card form');
  if (createForm) {
    const first = createForm.querySelector('input, textarea');
    if (first) first.focus();
  }

  // Notebook preview popup
  const nbOverlay = document.getElementById('nb-preview-modal');
  const nbDismiss = nbOverlay?.querySelector('[data-dismiss-nb]');
  const nbContent = document.getElementById('nb-preview-content');
  const openNb = () => { nbOverlay?.classList.add('show'); nbOverlay?.setAttribute('aria-hidden', 'false'); };
  const closeNb = () => { nbOverlay?.classList.remove('show'); nbOverlay?.setAttribute('aria-hidden', 'true'); };
  nbDismiss?.addEventListener('click', closeNb);
  nbOverlay?.addEventListener('click', (e) => { if (e.target === nbOverlay) closeNb(); });

  document.addEventListener('click', async (e) => {
    // Delete notebook via small X button (with confirm modal)
    const nbClose = e.target.closest?.('.nb-close');
    if (nbClose) {
      const wrapper = nbClose.closest('.nb-item');
      const form = wrapper?.querySelector('.nb-delete-form');
      const nameEl = wrapper?.querySelector('.nb-pill');
      const nbName = nameEl ? nameEl.textContent.trim() : '';
      if (form) {
        if (confirmTitleEl) confirmTitleEl.textContent = 'Not defteri silinsin mi?';
        if (confirmTextEl) confirmTextEl.textContent = `Bu işlem geri alınamaz. "${nbName}" ve içindeki tüm notlar kalıcı olarak silinecek.`;
        openModal(form); // reuse confirm modal
      }
      return;
    }

    const bookBtn = e.target.closest?.('.nb-book');
    if (bookBtn) {
      const nbId = bookBtn.getAttribute('data-nb-id');
      openNb();
      nbContent.innerHTML = '<div class="loading">Yükleniyor...</div>';
      try {
        const res = await fetch(`/notebook/${nbId}`);
        const html = await res.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const grid = doc.querySelector('.grid');
        if (grid) {
          nbContent.innerHTML = '';
          nbContent.appendChild(grid);
        } else {
          nbContent.innerHTML = '<p class="error">Notlar yüklenemedi.</p>';
        }
      } catch (err) {
        nbContent.innerHTML = `<p class="error">Bağlantı hatası: ${err.message}</p>`;
      }
    }
  });

  // Edit note modal: open on card click, auto-save on close/outside
  const editOverlay = document.getElementById('edit-modal');
  const editDismiss = editOverlay?.querySelector('[data-dismiss-edit]');
  const editForm = document.getElementById('edit-form');
  const editTitleInput = document.getElementById('edit-title-input');
  const editContentInput = document.getElementById('edit-content-input');
  const editNotebookSelect = document.getElementById('edit-notebook-select');
  let currentEditNoteId = null;

  const openEdit = (noteId, title, content, notebookId) => {
    currentEditNoteId = noteId;
    editForm.action = `/notes/${noteId}/update`;
    editTitleInput.value = title || '';
    editContentInput.value = content || '';
    if (editNotebookSelect) {
      editNotebookSelect.value = notebookId || '';
    }
    editOverlay?.classList.add('show');
    editOverlay?.setAttribute('aria-hidden', 'false');
  };
  const closeEdit = () => {
    if (currentEditNoteId) {
      // Auto-save present changes
      if (editForm) {
        const formData = new FormData(editForm);
        fetch(editForm.action, { method: 'POST', body: formData });
      }
    }
    editOverlay?.classList.remove('show');
    editOverlay?.setAttribute('aria-hidden', 'true');
    currentEditNoteId = null;
  };
  editDismiss?.addEventListener('click', closeEdit);
  editOverlay?.addEventListener('click', (e) => { if (e.target === editOverlay) closeEdit(); });

  // Delegate click on note cards to open editor (avoid clicks on buttons/forms)
  document.addEventListener('click', (e) => {
    const card = e.target.closest?.('.note-card');
    if (!card) return;
    const clickedAction = e.target.closest?.('.card-actions, form, button, a');
    if (clickedAction) return; // don't open edit when interacting with actions
    const noteId = card.getAttribute('data-note-id');
    const title = card.getAttribute('data-title');
    const content = card.getAttribute('data-content');
    const nbId = card.getAttribute('data-notebook-id');
    openEdit(noteId, title, content, nbId);
  });
});

