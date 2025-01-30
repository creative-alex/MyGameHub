  const toggleButton = document.getElementById('toggle-button');
  const formsWrapper = document.querySelector('.forms-wrapper');
  const switchForms = document.querySelectorAll('.switch-form');
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const loginMessage = document.getElementById('loginMessage');
  const registerMessage = document.getElementById('registerMessage');
  const accountSpan = document.querySelector('#toggle-button span');
  const dropdownMenu = document.createElement('div');
  const centerBox = document.querySelector('.centered-box');


      // Configuração do menu dropdown
  dropdownMenu.className = 'dropdown hidden';
  dropdownMenu.id = 'men';
  dropdownMenu.innerHTML = `
    <ul>
      <li><a href="/user/1">Profile</a></li>
      <li id="logoutButton">Logout</li>
    </ul>
  `;
  toggleButton.parentNode.insertBefore(dropdownMenu, toggleButton.nextSibling);

  // Alterna exibição do wrapper de formulários
  toggleButton.addEventListener('click', () => {
    formsWrapper.classList.toggle('hidden');
  });

  // Alterna entre login e registro
  switchForms.forEach((switchForm) => {
    switchForm.addEventListener('click', (e) => {
      const targetFormId = e.target.dataset.target;
      document.querySelectorAll('.forms-wrapper form').forEach((form) => {
        form.classList.remove('active-form');
      });
      document.getElementById(targetFormId).classList.add('active-form');
    });
  });

  // Função para validar a sessão ao carregar a página
  async function validateSession() {
    const token = localStorage.getItem('authToken');
    if (!token) {
      accountSpan.textContent = 'Sign In/Sign Up';
      return;
    }

    try {
      const response = await fetch('http://localhost:3000/check-auth', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        accountSpan.textContent = result.username || 'Bem-vindo!';
        formsWrapper.remove();
        
        toggleButton.addEventListener('click', () => {
          dropdownMenu.classList.toggle('hidden');
        });

        document.getElementById('logoutButton').addEventListener('click', () => {
          localStorage.removeItem('authToken');
          accountSpan.textContent = 'Sign In/Sign Up';
          dropdownMenu.classList.add('hidden');
          location.reload();
        });
      } else {
        localStorage.removeItem('authToken');
        accountSpan.textContent = 'Sign In/Sign Up';
      }
    } catch (error) {
      console.error('Erro ao verificar autenticação:', error);
    }
  }

  // Chamar validação ao carregar a página
  validateSession();

  // Manipular envio do formulário de registro
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(registerForm);
    const data = Object.fromEntries(formData.entries());

    try {
      const response = await fetch('http://localhost:3000/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      if (response.ok) {
        registerMessage.textContent = result.message;
        registerMessage.style.color = 'green';
        registerForm.reset();
      } else {
        registerMessage.textContent = result.message;
        registerMessage.style.color = 'red';
      }
    } catch (error) {
      registerMessage.textContent = 'Erro ao registrar. Tente novamente.';
      registerMessage.style.color = 'red';
    }
  });

  // Manipular envio do formulário de login
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(loginForm);
    const data = Object.fromEntries(formData.entries());

    try {
      const response = await fetch('http://localhost:3000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      if (response.ok) {
        loginMessage.textContent = result.message;
        loginMessage.style.color = 'green';

        // Salvar o token no localStorage
        localStorage.setItem('authToken', result.token);

        // Atualizar o nome do usuário
        accountSpan.textContent = result.username;

        // Ocultar os formulários e preparar o dropdown
        formsWrapper.remove();
        centerBox.remove();

        toggleButton.addEventListener('click', () => {
          dropdownMenu.classList.toggle('hidden');
        });

        document.getElementById('logoutButton').addEventListener('click', () => {
          localStorage.removeItem('authToken');
          accountSpan.textContent = 'Sign In/Sign Up';
          dropdownMenu.classList.add('hidden');
          location.reload();
        });
      } else {
        loginMessage.textContent = result.message;
        loginMessage.style.color = 'red';
      }
    } catch (error) {
      loginMessage.textContent = 'Erro ao fazer login. Tente novamente.';
      loginMessage.style.color = 'red';
    }
  });

