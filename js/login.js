class LoginManager {
    constructor() {
        this.init();
    }

    validarCredenciales(email, password) {
        const usuarios = JSON.parse(localStorage.getItem('usuarios')) || [];
        return usuarios.find(u => u.email === email && u.password === password);
    }

    iniciarSesion(email, password) {
        const usuario = this.validarCredenciales(email, password);
        
        if (usuario) {
            const sesionActiva = {
                id: usuario.id,
                nombre: usuario.nombre,
                email: usuario.email,
                rol: usuario.rol,
                fechaInicio: new Date().toISOString()
            };
            
            localStorage.setItem('sesionActiva', JSON.stringify(sesionActiva));
            window.location.href = 'panel.html';
            return true;
        }
        
        return false;
    }

    init() {
        const form = document.getElementById('loginForm');
        const errorMensaje = document.getElementById('errorMensaje');

        // Verificar si ya hay sesión activa
        const sesionActiva = JSON.parse(localStorage.getItem('sesionActiva'));
        if (sesionActiva) {
            window.location.href = 'panel.html';
            return;
        }

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            if (this.iniciarSesion(email, password)) {
                errorMensaje.textContent = '';
            } else {
                errorMensaje.textContent = 'Correo o contraseña incorrectos';
            }
        });
    }
}

const loginManager = new LoginManager();