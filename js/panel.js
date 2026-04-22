class PanelManager {
    constructor() {
        this.sesionActiva = null;
        this.permisos = [];
        this.verificarSesion();
        this.init();
    }

    verificarSesion() {
        this.sesionActiva = JSON.parse(localStorage.getItem('sesionActiva'));
        
        if (!this.sesionActiva) {
            window.location.href = 'login.html';
            return;
        }

        this.cargarPermisos();
        document.getElementById('nombreUsuario').textContent = 
            `Bienvenido, ${this.sesionActiva.nombre} (${this.getNombreRol()})`;
    }

    cargarPermisos() {
        const usuarios = JSON.parse(localStorage.getItem('usuarios')) || [];
        const usuario = usuarios.find(u => u.id === this.sesionActiva.id);
        
        if (usuario) {
            const roles = {
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

            const rolConfig = Object.values(roles).find(r => r.id === usuario.rol);
            this.permisos = rolConfig ? rolConfig.permisos : [];
        }
    }

    getNombreRol() {
        const roles = {
            'admin': 'Administrador',
            'jefe': 'Jefe de Tienda',
            'empleado': 'Empleado'
        };
        return roles[this.sesionActiva.rol] || this.sesionActiva.rol;
    }

    tienePermiso(permiso) {
        return this.permisos.includes(permiso);
    }

    cerrarSesion() {
        localStorage.removeItem('sesionActiva');
        window.location.href = 'login.html';
    }

    init() {
        const logoutBtn = document.getElementById('logoutBtn');
        
        // Control de acceso a funcionalidades según rol
        this.controlarAccesoModulos();
        
        logoutBtn.addEventListener('click', () => {
            this.cerrarSesion();
        });
    }

    controlarAccesoModulos() {
        const dashboard = document.querySelector('.dashboard');
        if (!dashboard) return;

        dashboard.innerHTML = '';

        // Módulo de Usuarios (solo Admin y Jefe)
        if (this.tienePermiso('ver_usuarios')) {
            dashboard.innerHTML += `
                <div class="card">
                    <h2>Gestión de Usuarios</h2>
                    <p>Administrar usuarios y roles</p>
                    <a href="registro.html" class="btn btn-primary">Ir a Usuarios</a>
                </div>
            `;
        }

        // Módulo de Inventario (todos los roles)
        if (this.tienePermiso('ver_inventario')) {
            dashboard.innerHTML += `
                <div class="card">
                    <h2>Módulo de Inventario</h2>
                    <p>Gestionar productos y stock</p>
                    <a href="inventario.html" class="btn btn-primary">Ir al Inventario</a>
                </div>
            `;
        }

        // Módulo de Caja (todos los roles)
        if (this.tienePermiso('realizar_ventas')) {
            dashboard.innerHTML += `
                <div class="card">
                    <h2>Módulo de Caja</h2>
                    <p>Realizar ventas y gestionar carrito</p>
                    <a href="caja.html" class="btn btn-primary">Ir a Caja</a>
                </div>
            `;
        }

        // Módulo de Ventas (todos los roles)
        if (this.tienePermiso('ver_ventas')) {
            dashboard.innerHTML += `
                <div class="card">
                    <h2>Historial de Ventas</h2>
                    <p>Ver todas las ventas realizadas</p>
                    <a href="ventas.html" class="btn btn-primary">Ver Historial</a>
                </div>
            `;
        }

        // Módulo de Reportes (solo Admin y Jefe)
        if (this.tienePermiso('ver_reportes')) {
            dashboard.innerHTML += `
                <div class="card">
                    <h2>Reportes</h2>
                    <p>Estadísticas y reportes de ventas</p>
                    <button class="btn btn-primary" onclick="panelManager.verReportes()">
                        Ver Reportes
                    </button>
                </div>
            `;
        }
    }

    verReportes() {
        const ventas = JSON.parse(localStorage.getItem('ventas')) || [];
        const totalVentas = ventas.reduce((sum, v) => sum + v.total, 0);
        const promedioVenta = ventas.length > 0 ? totalVentas / ventas.length : 0;
        
        const ventasPorUsuario = {};
        ventas.forEach(v => {
            ventasPorUsuario[v.usuario] = (ventasPorUsuario[v.usuario] || 0) + v.total;
        });

        let reporteHTML = `
            <h3>Reporte de Ventas</h3>
            <p>Total de ventas: $${totalVentas.toFixed(2)}</p>
            <p>Promedio por venta: $${promedioVenta.toFixed(2)}</p>
            <p>Cantidad de transacciones: ${ventas.length}</p>
            <h4>Ventas por Usuario:</h4>
        `;

        Object.entries(ventasPorUsuario).forEach(([usuario, total]) => {
            reporteHTML += `<p>${usuario}: $${total.toFixed(2)}</p>`;
        });

        // Crear modal para mostrar reporte
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.display = 'flex';
        modal.innerHTML = `
            <div class="modal-content">
                ${reporteHTML}
                <button class="btn" onclick="this.closest('.modal').remove()">Cerrar</button>
            </div>
        `;
        document.body.appendChild(modal);
    }
}

const panelManager = new PanelManager();