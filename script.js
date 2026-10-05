(() => {
  const header = document.querySelector('.site-header');
  const menuButton = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.nav-links');
  const progress = document.querySelector('.reading-progress span');
  const hero = document.querySelector('.hero');
  const privacy = document.querySelector('#privacy');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const updateScrollState = () => {
    header.classList.toggle('scrolled', window.scrollY > 16);
    const distance = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.transform = `scaleX(${distance > 0 ? window.scrollY / distance : 0})`;
  };
  updateScrollState();
  window.addEventListener('scroll', updateScrollState, { passive: true });

  menuButton.addEventListener('click', () => {
    const open = menuButton.getAttribute('aria-expanded') !== 'true';
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    nav.classList.toggle('open', open);
  });
  nav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
    nav.classList.remove('open');
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', 'Abrir menu');
  }));

  if ('IntersectionObserver' in window && !reducedMotion) {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    }), { threshold: 0.12, rootMargin: '0px 0px -35px 0px' });
    document.querySelectorAll('.reveal').forEach(item => observer.observe(item));
  } else document.querySelectorAll('.reveal').forEach(item => item.classList.add('is-visible'));

  if (!reducedMotion && window.matchMedia('(hover: hover)').matches) {
    hero.addEventListener('pointermove', event => {
      const rect = hero.getBoundingClientRect();
      hero.style.setProperty('--pointer-x', `${event.clientX - rect.left}px`);
      hero.style.setProperty('--pointer-y', `${event.clientY - rect.top}px`);
    });
    hero.addEventListener('pointerleave', () => {
      hero.style.removeProperty('--pointer-x');
      hero.style.removeProperty('--pointer-y');
    });

    document.querySelectorAll('[data-parallax]').forEach(item => {
      item.addEventListener('pointermove', event => {
        const rect = item.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - .5;
        const y = (event.clientY - rect.top) / rect.height - .5;
        item.style.transform = `perspective(1100px) rotateY(${x * 1.5}deg) rotateX(${-y * 1.2}deg) translateY(-2px)`;
      });
      item.addEventListener('pointerleave', () => { item.style.transform = ''; });
    });
  }

  const diagnostic = document.querySelector('#diagnostic-flow');
  if (diagnostic) {
    const section = document.querySelector('#diagnostico-form');
    const steps = [...diagnostic.querySelectorAll('.diagnostic-step')];
    const progressTrack = diagnostic.querySelector('[role="progressbar"]');
    const progressFill = document.querySelector('#progress-fill');
    const stepLabel = document.querySelector('#step-label');
    const stepName = document.querySelector('#step-name');
    const backButton = diagnostic.querySelector('.back-step');
    const stepHint = document.querySelector('#step-hint');
    const formError = document.querySelector('#form-error');
    const confirmation = document.querySelector('#diagnostic-confirmation');
    const fallback = document.querySelector('#whatsapp-fallback');
    const phoneField = document.querySelector('#visitor-phone');
    const nameField = document.querySelector('#visitor-name');
    const stepNames = ['Vendas', 'Origem dos clientes', 'Gargalo', 'Contato'];
    const answers = {};
    let currentStep = 1;
    const setStep = (next, shouldScroll = true) => {
      currentStep = Math.max(1, Math.min(4, next));
      steps.forEach((step, index) => {
        const active = index + 1 === currentStep;
        step.hidden = !active;
        step.classList.toggle('is-active', active);
      });
      stepLabel.textContent = 'Etapa ' + currentStep + ' de 4';
      stepName.textContent = stepNames[currentStep - 1];
      progressTrack.setAttribute('aria-valuenow', String(currentStep));
      progressFill.style.width = (currentStep * 25) + '%';
      backButton.hidden = currentStep === 1;
      stepHint.textContent = currentStep < 4 ? 'Selecione uma opção para continuar' : 'Suas respostas serão abertas no WhatsApp';
      formError.textContent = '';
      if (shouldScroll) section.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
      const nextFocus = steps[currentStep - 1].querySelector('input[type="radio"]:checked') || steps[currentStep - 1].querySelector('input,button');
      window.setTimeout(() => nextFocus?.focus({ preventScroll: true }), reducedMotion ? 0 : 220);
    };

    diagnostic.querySelectorAll('input[type="radio"]').forEach(input => {
      input.addEventListener('change', () => {
        const key = input.name;
        answers[key] = input.value;
        window.setTimeout(() => setStep(currentStep + 1), 140);
      });
    });
    backButton.addEventListener('click', () => setStep(currentStep - 1));
    diagnostic.querySelectorAll('.answer-list').forEach(list => {
      list.addEventListener('keydown', event => {
        if (!['ArrowDown', 'ArrowRight', 'ArrowUp', 'ArrowLeft'].includes(event.key)) return;
        const options = [...list.querySelectorAll('input[type="radio"]')];
        const current = options.indexOf(document.activeElement);
        if (current < 0) return;
        event.preventDefault();
        const direction = ['ArrowDown', 'ArrowRight'].includes(event.key) ? 1 : -1;
        const target = options[(current + direction + options.length) % options.length];
        target.focus();
        target.click();
      });
    });

    const formatPhone = value => {
      let digits = value.replace(/\D/g, '');
      const internationalPrefix = value.trim().match(/^(?:\+55|0055)/);
      if (internationalPrefix) digits = digits.slice(internationalPrefix[0].replace(/\D/g, '').length);
      digits = digits.slice(0, 11);
      if (!digits) return '';
      if (digits.length < 3) return '(' + digits;
      const area = digits.slice(0, 2);
      const local = digits.slice(2);
      if (!local) return '(' + area + ') ';
      const split = digits.length > 10 ? 5 : 4;
      return local.length > split
        ? '(' + area + ') ' + local.slice(0, split) + '-' + local.slice(split)
        : '(' + area + ') ' + local;
    };
    phoneField.addEventListener('input', () => {
      const cursorAtEnd = phoneField.selectionStart === phoneField.value.length;
      phoneField.value = formatPhone(phoneField.value);
      if (cursorAtEnd) phoneField.setSelectionRange(phoneField.value.length, phoneField.value.length);
      phoneField.removeAttribute('aria-invalid');
      document.querySelector('#phone-error').textContent = '';
    });

    let leadTracked = false;
    const sendWhatsApp = () => {
      const popup = window.open(fallback.href, '_blank');
      if (popup) popup.opener = null;
    };

    diagnostic.addEventListener('submit', event => {
      event.preventDefault();
      formError.textContent = '';
      const name = nameField.value.trim();
      const phoneDigits = phoneField.value.replace(/\D/g, '');
      const requiredAnswers = ['momento_vendas', 'origem_clientes', 'principal_gargalo'];
      if (!requiredAnswers.every(key => answers[key])) {
        formError.textContent = 'Responda às três perguntas para continuar.';
        setStep(requiredAnswers.findIndex(key => !answers[key]) + 1);
        return;
      }
      if (!name) {
        formError.textContent = 'Informe seu nome para continuar.';
        nameField.setAttribute('aria-invalid', 'true');
        nameField.focus();
        return;
      }
      nameField.removeAttribute('aria-invalid');
      if (phoneDigits.length !== 10 && phoneDigits.length !== 11) {
        document.querySelector('#phone-error').textContent = 'Informe um WhatsApp com DDD e 10 ou 11 números.';
        phoneField.setAttribute('aria-invalid', 'true');
        phoneField.focus();
        return;
      }
      phoneField.removeAttribute('aria-invalid');
      if (!leadTracked && typeof window.fbq === 'function') {
        window.fbq('track', 'Lead');
        leadTracked = true;
      }
      const message = 'Olá, JP. Quero solicitar o Diagnóstico Efeito Reservas.\n\n' +
        'Meu nome: ' + name + '\nMeu WhatsApp: ' + phoneField.value + '\n\n' +
        'Como estão minhas vendas hoje:\n' + answers.momento_vendas + '\n\n' +
        'Principal origem dos meus clientes:\n' + answers.origem_clientes + '\n\n' +
        'Onde minha operação mais trava:\n' + answers.principal_gargalo + '\n\n' +
        'Quero entender onde minha agência está perdendo oportunidades e o que faz sentido priorizar agora.';
      const url = 'https://wa.me/5561981784728?' + new URLSearchParams({ text: message }).toString();
      fallback.href = url;
      diagnostic.querySelector('.diagnostic-steps').hidden = true;
      diagnostic.querySelector('.step-controls').hidden = true;
      diagnostic.querySelector('.diagnostic-progress').hidden = true;
      diagnostic.querySelector('.form-error').hidden = true;
      confirmation.hidden = false;
      confirmation.focus({ preventScroll: true });
      sendWhatsApp();
    });

  }
  document.querySelector('.privacy-link').addEventListener('click', event => {
    event.preventDefault();
    privacy.showModal();
  });
  document.querySelector('.dialog-close').addEventListener('click', () => privacy.close());
  privacy.addEventListener('click', event => {
    const box = privacy.getBoundingClientRect();
    if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) privacy.close();
  });
  document.querySelector('#year').textContent = new Date().getFullYear();
})();

