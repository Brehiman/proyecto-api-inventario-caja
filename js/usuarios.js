class UsuariosManager {
    constructor() {
        this.usuarios = this.cargarUsuarios();
        this.roles = {
            ADMINISTRADOR: {
                id: 'admin',
                nombre: 'Administrador',
                permisos: ['ver_usuarios', 'editar_usuarios', 'eliminar_usuarios', 'crear_usuarios', 
                          'ver_inventario', 'editar_inventario', 'eliminar_inventario',
                          'ver_ventas', 'realizar_ventas', 'anular_ventas', 'ver_reportes']
            },
            JEFE_TIENDA: {
                id: 'jefe',
                nombre: 'Jefe de Tienda',
                permisos: ['ver_usuarios', 'ver_inventario', 'editar_inventario',
                          'ver_ventas', 'realizar_ventas', 'anular_ventas', 'ver_reportes']
            },
            EMPLEADO: {
                id: 'empleado',
                nombre: 'Empleado',
                permisos: ['ver_inventario', 'realizar_ventas', 'ver_ventas']
            }
        };
        this.init();
    }

    cargarUsuarios() {
        const usuarios = localStorage.getItem('usuarios');
        const usuariosParsed = usuarios ? JSON.parse(usuarios) : [];
        
        // Migración: asegurar que todos los usuarios tengan rol
        return usuariosParsed.map(u => ({
            ...u,
            rol: u.rol || 'empleado' // Rol por defecto
        }));
    }

    guardarUsuarios() {
        localStorage.setItem('usuarios', JSON.stringify(this.usuarios));
    }

    generarId() {
        return this.usuarios.length > 0 ? Math.max(...this.usuarios.map(u => u.id)) + 1 : 1;
    }

    agregarUsuario(nombre, email, password, rol) {
        const usuario = {
            id: this.generarId(),
            nombre,
            email,
            password,
            rol: rol || 'empleado',
            fechaCreacion: new Date().toISOString()
        };
        this.usuarios.push(usuario);
        this.guardarUsuarios();
        return usuario;
    }

    actualizarUsuario(id, nombre, email, password, rol) {
        const index = this.usuarios.findIndex(u => u.id === id);
        if (index !== -1) {
            this.usuarios[index] = { 
                ...this.usuarios[index], 
                nombre, 
                email, 
                password,
                rol: rol || this.usuarios[index].rol 
            };
            this.guardarUsuarios();
            return true;
        }
        return false;
    }

    eliminarUsuario(id) {
        // Prevenir eliminar el último administrador
        const usuarioAEliminar = this.usuarios.find(u => u.id === id);
        if (usuarioAEliminar?.rol === 'admin') {
            const adminsRestantes = this.usuarios.filter(u => u.rol === 'admin' && u.id !== id);
            if (adminsRestantes.length === 0) {
                alert('No se puede eliminar el último administrador del sistema');
                return false;
            }
        }
        
        this.usuarios = this.usuarios.filter(u => u.id !== id);
        this.guardarUsuarios();
        return true;
    }

    obtenerUsuarios() {
        return this.usuarios;
    }

    obtenerRoles() {
        return this.roles;
    }

    verificarPermiso(usuarioId, permiso) {
        const usuario = this.usuarios.find(u => u.id === usuarioId);
        if (!usuario) return false;
        
        const rolConfig = this.roles[Object.keys(this.roles).find(
            key => this.roles[key].id === usuario.rol
        )];
        
        return rolConfig ? rolConfig.permisos.includes(permiso) : false;
    }

    getNombreRol(rolId) {
        const rol = Object.values(this.roles).find(r => r.id === rolId);
        return rol ? rol.nombre : 'Desconocido';
    }

    init() {
        const form = document.getElementById('registroForm');
        const cancelarBtn = document.getElementById('cancelarBtn');
        
        this.mostrarUsuarios();
        this.inicializarSelectorRoles();

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const id = document.getElementById('userId').value;
            const nombre = document.getElementById('nombre').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const rol = document.getElementById('rol').value;

            if (id) {
                this.actualizarUsuario(parseInt(id), nombre, email, password, rol);
            } else {
                this.agregarUsuario(nombre, email, password, rol);
            }

            form.reset();
            document.getElementById('userId').value = '';
            this.mostrarUsuarios();
        });

        cancelarBtn.addEventListener('click', () => {
            form.reset();
            document.getElementById('userId').value = '';
        });
    }

    inicializarSelectorRoles() {
        const rolSelect = document.getElementById('rol');
        if (rolSelect) {
            rolSelect.innerHTML = '';
            Object.entries(this.roles).forEach(([key, rol]) => {
                const option = document.createElement('option');
                option.value = rol.id;
                option.textContent = rol.nombre;
                rolSelect.appendChild(option);
            });
        }
    }

    mostrarUsuarios() {
        const tbody = document.getElementById('usuariosBody');
        tbody.innerHTML = '';

        this.usuarios.forEach(usuario => {
            const row = tbody.insertRow();
            const nombreRol = this.getNombreRol(usuario.rol);
            const badgeColor = this.getBadgeColor(usuario.rol);
            
            row.innerHTML = `
                <td>${usuario.id}</td>
                <td>${usuario.nombre}</td>
                <td>${usuario.email}</td>
                <td><span class="rol-badge ${badgeColor}">${nombreRol}</span></td>
                <td class="acciones">
                    <button class="btn btn-info" onclick="usuariosManager.verPermisos('${usuario.rol}')">
                        Ver Permisos
                    </button>
                    <button class="btn btn-warning" onclick="usuariosManager.editarUsuario(${usuario.id})">
                        Editar
                    </button>
                    <button class="btn btn-danger" onclick="usuariosManager.eliminarUsuario(${usuario.id})">
                        Eliminar
                    </button>
                </td>
            `;
        });
    }

    getBadgeColor(rol) {
        const colors = {
            'admin': 'badge-danger',
            'jefe': 'badge-warning',
            'empleado': 'badge-success'
        };
        return colors[rol] || 'badge-secondary';
    }

    editarUsuario(id) {
        const usuario = this.usuarios.find(u => u.id === id);
        if (usuario) {
            document.getElementById('userId').value = usuario.id;
            document.getElementById('nombre').value = usuario.nombre;
            document.getElementById('email').value = usuario.email;
            document.getElementById('password').value = usuario.password;
            document.getElementById('rol').value = usuario.rol;
        }
    }

    verPermisos(rolId) {
        const rol = Object.values(this.roles).find(r => r.id === rolId);
        if (rol) {
            const permisosLista = rol.permisos.map(p => {
                const nombrePermiso = p.split('_').map(word => 
                    word.charAt(0).toUpperCase() + word.slice(1)
                ).join(' ');
                return `• ${nombrePermiso}`;
            }).join('\n');
            
            alert(`Permisos de ${rol.nombre}:\n\n${permisosLista}`);
        }
    }
}

const usuariosManager = new UsuariosManager();