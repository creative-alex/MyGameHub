
/// Seleciona o link "Register" no formulário de login
const registerLink = document.querySelector('.switch-form-register');

// Adiciona um ouvinte de evento para quando o link for clicado
registerLink.addEventListener('click', function (event) {
    event.preventDefault(); // Evita o comportamento padrão do link (recarregar a página)

    // Seleciona os formulários
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.querySelector('.register-form');

    // Remove o overlay existente do formulário de registro, se houver
    const existingOverlayRegister = registerForm.querySelector('.overlay');
    if (existingOverlayRegister) {
        existingOverlayRegister.remove();
    }

    // Remove o overlay existente do formulário de login, se houver
    const existingOverlayLogin = loginForm.querySelector('.overlay');
    if (existingOverlayLogin) {
        existingOverlayLogin.remove();
    }

    // Cria um novo div de sobreposição
    const newOverlay = document.createElement('div');
    newOverlay.classList.add('overlay');

    // Adiciona o overlay ao formulário de login
    loginForm.appendChild(newOverlay);
});

// Seleciona o link "Sign In" no formulário de registro
const loginLink = document.querySelector('.switch-form-login');

// Adiciona um ouvinte de evento para quando o link for clicado
loginLink.addEventListener('click', function (event) {
    event.preventDefault(); // Evita o comportamento padrão do link (recarregar a página)

    // Seleciona os formulários
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.querySelector('.register-form');

    // Remove o overlay existente do formulário de login, se houver
    const existingOverlayLogin = loginForm.querySelector('.overlay');
    if (existingOverlayLogin) {
        existingOverlayLogin.remove();
    }

    // Remove o overlay existente do formulário de registro, se houver
    const existingOverlayRegister = registerForm.querySelector('.overlay');
    if (existingOverlayRegister) {
        existingOverlayRegister.remove();
    }

    // Cria um novo div de sobreposição
    const newOverlay = document.createElement('div');
    newOverlay.classList.add('overlay');

    // Adiciona o overlay ao formulário de registro
    registerForm.appendChild(newOverlay);
});