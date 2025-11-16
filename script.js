document.addEventListener('DOMContentLoaded', () => {
  /* ===== NAVEGAÇÃO SUAVE ===== */
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', e => {
      const href = anchor.getAttribute('href');
      if (!href || href === '#') return;
      const target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      const menu = document.querySelector('.menu');
      if (menu && menu.classList.contains('active')) menu.classList.remove('active');
    });
  });

  /* ===== ANO NO RODAPÉ ===== */
  const anoEl = document.getElementById('ano');
  if (anoEl) anoEl.textContent = new Date().getFullYear();

  /* ===== MENU MOBILE ===== */
  const hamburger = document.querySelector('.hamburger');
  const menu = document.querySelector('.menu');
  if (hamburger && menu) {
    hamburger.addEventListener('click', () => {
      menu.classList.toggle('active');
      const expanded = hamburger.getAttribute('aria-expanded') === 'true';
      hamburger.setAttribute('aria-expanded', String(!expanded));
    });
  }

  /* ===== CARROSSEL SLIDING ===== */
  (function initSlidingCarousel() {
    const carousel = document.querySelector('.carousel');
    if (!carousel) return;

    // Coletar imagens
    const imgs = Array.from(carousel.querySelectorAll('img'));
    if (!imgs.length) return;

    // Criar um elemento de trilha e mover as imagens para ele
    const track = document.createElement('div');
    track.className = 'track';
    imgs.forEach(img => track.appendChild(img)); // Mover nós
    // Clonar primeiro e por último para um loop perfeito
    const firstClone = imgs[0].cloneNode(true);
    const lastClone = imgs[imgs.length - 1].cloneNode(true);
    track.appendChild(firstClone);
    track.insertBefore(lastClone, track.firstChild);

    // Remover nós de imagem direta antigos que permaneceram no carrossel (eles foram movidos)
    // Garantir que apenas a trilha e a sobreposição permaneçam
    Array.from(carousel.children).forEach(child => {
      if (!child.classList || child.classList.contains('carousel-overlay')) return;
      if (child !== track) carousel.removeChild(child);
    });

    // Inserir a faixa no topo
    carousel.insertBefore(track, carousel.firstChild);

    // Criar pontos
    const dots = document.createElement('div');
    dots.className = 'dots';
    for (let i = 0; i < imgs.length; i++) {
      const b = document.createElement('button');
      if (i === 0) b.classList.add('active');
      b.setAttribute('aria-label', `Ir para slide ${i + 1}`);
      dots.appendChild(b);
    }
    carousel.appendChild(dots);

    // Variáveis
    const slidesCount = imgs.length;
    let index = 0; // Índice lógico 0..slidesCount-1
    let isAnimating = false;

    // Defina translateX inicial: como adicionamos lastClone ao início, comece em -100%
    const slideWidth = carousel.clientWidth;
    track.style.transform = `translateX(-${100}%)`;

    // Auxiliar para atualizar pontos
    function updateDots() {
      const btns = Array.from(dots.children);
      btns.forEach((b, i) => b.classList.toggle('active', i === index));
    }

    // Mover para o índice (lógico) com animação
    function goTo(idx) {
      if (isAnimating) return;
      isAnimating = true;
      index = (idx + slidesCount) % slidesCount;
      const offset = (index + 1) * 100; // +1 devido ao último clone no início
      track.style.transition = 'transform 700ms cubic-bezier(.22,.9,.35,1)';
      track.style.transform = `translateX(-${offset}%)`;
      updateDots();

      // Após a transição, se passarmos para o modo clone, saltaremos sem transição
      track.addEventListener('transitionend', onTransitionEnd);
      function onTransitionEnd() {
        track.removeEventListener('transitionend', onTransitionEnd);
        // Se estiver no clone (passa do último slide real)
        if (index === 0) {
        }
        // Normalizar a transformação para a posição exata em caso de arredondamento
        track.style.transition = '';
        isAnimating = false;
      }
    }

    // Mover para a esquerda (próximo)
    function next() {
      if (isAnimating) return;
      goTo(index + 1);
    }
    // Mover para a direita (anterior)
    function prev() {
      if (isAnimating) return;
      goTo(index - 1);
    }

    // Reprodução automática
    const INTERVAL = 4000;
    let timer = setInterval(next, INTERVAL);

    // Pausar/retomar
    carousel.addEventListener('mouseenter', () => clearInterval(timer));
    carousel.addEventListener('mouseleave', () => { timer = setInterval(next, INTERVAL); });
    carousel.addEventListener('focusin', () => clearInterval(timer));
    carousel.addEventListener('focusout', () => { timer = setInterval(next, INTERVAL); });

    // Teclado
    carousel.setAttribute('tabindex', '0');
    carousel.addEventListener('keydown', e => {
      if (e.key === 'ArrowRight') { next(); clearInterval(timer); }
      if (e.key === 'ArrowLeft')  { prev(); clearInterval(timer); }
    });

    // Clicar nos pontos
    Array.from(dots.children).forEach((btn, i) => {
      btn.addEventListener('click', () => {
        goTo(i);
        clearInterval(timer);
      });
    });

    // Suporte ao toque (deslizar)
    let startX = 0;
    let deltaX = 0;
    let dragging = false;
    carousel.addEventListener('touchstart', (e) => {
      clearInterval(timer);
      startX = e.touches[0].clientX;
      dragging = true;
      track.style.transition = '';
    }, { passive: true });

    carousel.addEventListener('touchmove', (e) => {
      if (!dragging) return;
      deltaX = e.touches[0].clientX - startX;
      const percent = (deltaX / carousel.clientWidth) * 100;
      const currentOffset = (index + 1) * -100;
      track.style.transform = `translateX(calc(${currentOffset}% + ${percent}%))`;
    }, { passive: true });

    carousel.addEventListener('touchend', (e) => {
      dragging = false;
      const threshold = carousel.clientWidth * 0.15; // 15% deslizar
      if (Math.abs(deltaX) > threshold) {
        if (deltaX < 0) { // Deslizar para a esquerda -> próximo
          next();
        } else { // Deslizar para a direita -> anterior
          prev();
        }
      } else {
        // Estalar de volta
        const offset = (index + 1) * 100;
        track.style.transition = 'transform 400ms cubic-bezier(.22,.9,.35,1)';
        track.style.transform = `translateX(-${offset}%)`;
      }
      deltaX = 0;
      timer = setInterval(next, INTERVAL);
    }, { passive: true });

    // Garantir responsividade: recalcular ao redimensionar: manter o slide atual visível
    window.addEventListener('resize', () => {
      track.style.transition = '';
      const offset = (index + 1) * 100;
      track.style.transform = `translateX(-${offset}%)`;
    });

    // Posicionamento inicial (garantir o deslocamento correto)
    setTimeout(() => {
      track.style.transition = '';
      const offset = (index + 1) * 100;
      track.style.transform = `translateX(-${offset}%)`;
    }, 50);
  })();

  /* ===== COOKIE BANNER ===== */
  (function initCookieBanner() {
    const cookieBanner = document.getElementById('cookie-banner');
    const aceitar = document.getElementById('aceitar-cookies');
    try {
      if (!localStorage.getItem('cookiesAceitos')) {
        if (cookieBanner) cookieBanner.style.display = 'flex';
      } else {
        if (cookieBanner) cookieBanner.style.display = 'none';
      }
    } catch (e) {
      if (cookieBanner) cookieBanner.style.display = 'flex';
    }
    if (aceitar) {
      aceitar.addEventListener('click', () => {
        try { localStorage.setItem('cookiesAceitos', 'true'); } catch (e) {}
        if (cookieBanner) cookieBanner.style.display = 'none';
        showToast('Preferência de cookies salva!');
      });
    }
  })();

  /* ===== TOAST ===== */
  function showToast(msg, error = false) {
    const toast = document.getElementById('toast');
    if (!toast) {
      error ? alert(msg) : console.log(msg);
      return;
    }
    toast.textContent = msg;
    toast.classList.remove('error');
    toast.classList.add('show');
    if (error) toast.classList.add('error');
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => {
      toast.classList.remove('show');
      if (error) toast.classList.remove('error');
    }, 4000);
  }

  /* ===== FORMULÁRIO (Formspree) ===== */
  (function initForm() {
    const form = document.getElementById('form-contato');
    if (!form) return;

    const submitBtn = form.querySelector('button[type="submit"]');
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const data = new FormData(form);

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.dataset.orig = submitBtn.textContent;
        submitBtn.textContent = 'Enviando...';
      }

      try {
        const res = await fetch(form.action, {
          method: 'POST',
          body: data,
          headers: { 'Accept': 'application/json' }
        });

        if (res.ok) {
          showToast('✅ Mensagem enviada com sucesso!');
          form.reset();
        } else {
          let info = '';
          try { const json = await res.json(); if (json && json.error) info = ' — ' + json.error; } catch (_) {}
          showToast('❌ Erro ao enviar. Tente novamente.' + info, true);
        }
      } catch (err) {
        showToast('⚠️ Falha na conexão. Tente novamente.', true);
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = submitBtn.dataset.orig || 'Enviar';
        }
      }
    });
  })();

}); // DOMContentLoaded end
