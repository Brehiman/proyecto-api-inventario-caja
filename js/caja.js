class CajaManager {
    constructor() {
        this.sesionActiva = JSON.parse(localStorage.getItem('sesionActiva'));
        this.permisos = this.cargarPermisos();
        this.inventario = this.cargarInventario();
        this.carrito = [];
        this.ventas = this.cargarVentas();
        this.init();
    }

    cargarPermisos() {
        if (!this.sesionActiva) return [];
        
        const usuarios = JSON.parse(localStorage.getItem('usuarios')) || [];
        const usuario = usuarios.find(u => u.id === this.sesionActiva.id);
        
        if (usuario) {
            const roles = {
                ADMINISTRADOR: {
                    id: 'admin',
                    permisos: ['realizar_ventas', 'anular_ventas']
                },
                JEFE_TIENDA: {
                    id: 'jefe',
                    permisos: ['realizar_ventas', 'anular_ventas']
                },
                EMPLEADO: {
                    id: 'empleado',
                    permisos: ['realizar_ventas']
                }
            };
            
            const rolConfig = Object.values(roles).find(r => r.id === usuario.rol);
            return rolConfig ? rolConfig.permisos : [];
        }
        return [];
    }

    tienePermiso(permiso) {
        return this.permisos.includes(permiso);
    }

    cargarInventario() {
        const inventario = localStorage.getItem('inventario');
        return inventario ? JSON.parse(inventario) : [];
    }

    guardarInventario() {
        localStorage.setItem('inventario', JSON.stringify(this.inventario));
    }

    cargarVentas() {
        const ventas = localStorage.getItem('ventas');
        return ventas ? JSON.parse(ventas) : [];
    }

    guardarVentas() {
        localStorage.setItem('ventas', JSON.stringify(this.ventas));
    }

    mostrarProductos() {
        const productosGrid = document.getElementById('productosGrid');
        const busqueda = document.getElementById('busquedaProducto').value.toLowerCase();
        
        const productosFiltrados = this.inventario.filter(p => 
            p.nombre.toLowerCase().includes(busqueda) && p.stock > 0
        );

        productosGrid.innerHTML = '';

        productosFiltrados.forEach(producto => {
            const card = document.createElement('div');
            card.className = 'producto-card';
            card.innerHTML = `
                <img src="${producto.imagen}" alt="${producto.nombre}">
                <h3>${producto.nombre}</h3>
                <div class="precio">$${producto.precio.toFixed(2)}</div>
                <div class="stock">Stock: ${producto.stock}</div>
                <button class="btn btn-primary" onclick="cajaManager.agregarAlCarrito(${producto.id})">
                    Agregar al Carrito
                </button>
            `;
            productosGrid.appendChild(card);
        });
    }

    agregarAlCarrito(id) {
        const producto = this.inventario.find(p => p.id === id);
        const itemEnCarrito = this.carrito.find(item => item.id === id);

        if (itemEnCarrito) {
            if (itemEnCarrito.cantidad < producto.stock) {
                itemEnCarrito.cantidad++;
            } else {
                alert('No hay suficiente stock disponible');
                return;
            }
        } else {
            if (producto.stock > 0) {
                this.carrito.push({
                    id: producto.id,
                    nombre: producto.nombre,
                    precio: producto.precio,
                    cantidad: 1
                });
            } else {
                alert('Producto sin stock');
                return;
            }
        }

        this.actualizarCarrito();
    }

    actualizarCarrito() {
        const carritoItems = document.getElementById('carritoItems');
        let total = 0;

        carritoItems.innerHTML = '';

        this.carrito.forEach(item => {
            const subtotal = item.precio * item.cantidad;
            total += subtotal;

            const div = document.createElement('div');
            div.className = 'carrito-item';
            div.innerHTML = `
                <div>
                    <strong>${item.nombre}</strong><br>
                    $${item.precio.toFixed(2)} x ${item.cantidad} = $${subtotal.toFixed(2)}
                </div>
                <div class="acciones">
                    <input type="number" 
                           value="${item.cantidad}" 
                           min="1" 
                           onchange="cajaManager.actualizarCantidad(${item.id}, this.value)">
                    <button class="btn btn-danger" onclick="cajaManager.eliminarDelCarrito(${item.id})">
                        Eliminar
                    </button>
                </div>
            `;
            carritoItems.appendChild(div);
        });

        document.getElementById('totalCarrito').textContent = total.toFixed(2);
    }

    actualizarCantidad(id, cantidad) {
        const item = this.carrito.find(i => i.id === id);
        const producto = this.inventario.find(p => p.id === id);
        const nuevaCantidad = parseInt(cantidad);

        if (nuevaCantidad <= producto.stock) {
            item.cantidad = nuevaCantidad;
            this.actualizarCarrito();
        } else {
            alert('Stock insuficiente');
            this.actualizarCarrito();
        }
    }

    eliminarDelCarrito(id) {
        this.carrito = this.carrito.filter(item => item.id !== id);
        this.actualizarCarrito();
    }

    confirmarVenta() {
        if (!this.tienePermiso('realizar_ventas')) {
            alert('No tiene permisos para realizar ventas');
            return;
        }

        if (this.carrito.length === 0) {
            alert('El carrito está vacío');
            return;
        }

        const sesionActiva = JSON.parse(localStorage.getItem('sesionActiva'));
        
        const venta = {
            id: this.generarIdVenta(),
            fecha: new Date().toISOString(),
            productos: [...this.carrito],
            total: this.calcularTotal(),
            usuario: sesionActiva ? sesionActiva.nombre : 'Anónimo',
            estado: 'completada'
        };

        // Actualizar inventario
        this.carrito.forEach(item => {
            const producto = this.inventario.find(p => p.id === item.id);
            if (producto) {
                producto.stock -= item.cantidad;
            }
        });

        this.guardarInventario();
        this.ventas.push(venta);
        this.guardarVentas();

        this.mostrarComprobante(venta);
        
        this.carrito = [];
        this.actualizarCarrito();
        this.mostrarProductos();
    }

    generarIdVenta() {
        return this.ventas.length > 0 ? Math.max(...this.ventas.map(v => v.id)) + 1 : 1;
    }

    calcularTotal() {
        return this.carrito.reduce((total, item) => total + (item.precio * item.cantidad), 0);
    }

    mostrarComprobante(venta) {
        const modal = document.getElementById('comprobanteModal');
        const contenido = document.getElementById('comprobanteContenido');
        
        // Obtener información del rol para mostrar en el comprobante
        const nombreRol = this.getNombreRol();
        
        contenido.innerHTML = `
            <div class="comprobante">
                <div class="comprobante-header">
                    <h3>Comprobante de Venta #${venta.id}</h3>
                    <p>Fecha: ${new Date(venta.fecha).toLocaleString()}</p>
                    <p>Atendido por: ${venta.usuario} (${nombreRol})</p>
                </div>
                <div class="comprobante-items">
                    ${venta.productos.map(item => `
                        <div class="comprobante-item">
                            <span>${item.nombre} x ${item.cantidad}</span>
                            <span>$${(item.precio * item.cantidad).toFixed(2)}</span>
                        </div>
                    `).join('')}
                </div>
                <div class="comprobante-total">
                    Total: $${venta.total.toFixed(2)}
                </div>
                ${this.tienePermiso('anular_ventas') ? 
                    `<button class="btn btn-danger" onclick="cajaManager.anularVenta(${venta.id})">
                        Anular Venta
                    </button>` : ''
                }
            </div>
        `;

        modal.style.display = 'flex';
    }

    getNombreRol() {
        const roles = {
            'admin': 'Administrador',
            'jefe': 'Jefe de Tienda',
            'empleado': 'Empleado'
        };
        return roles[this.sesionActiva?.rol] || 'Usuario';
    }

    anularVenta(id) {
        if (!this.tienePermiso('anular_ventas')) {
            alert('No tiene permisos para anular ventas');
            return;
        }

        const venta = this.ventas.find(v => v.id === id);
        if (!venta) return;

        if (confirm(`¿Está seguro de anular la venta #${id}? Se restaurará el stock.`)) {
            // Restaurar stock
            venta.productos.forEach(item => {
                const producto = this.inventario.find(p => p.id === item.id);
                if (producto) {
                    producto.stock += item.cantidad;
                }
            });

            venta.estado = 'anulada';
            
            this.guardarInventario();
            this.guardarVentas();
            
            alert('Venta anulada correctamente');
            document.getElementById('comprobanteModal').style.display = 'none';
            
            // Actualizar vista si estamos en el módulo de ventas
            if (typeof ventasManager !== 'undefined') {
                ventasManager.mostrarVentas();
            }
        }
    }

    cancelarVenta() {
        if (confirm('¿Está seguro de cancelar la venta actual?')) {
            this.carrito = [];
            this.actualizarCarrito();
        }
    }

    init() {
        // Verificar permiso básico
        if (!this.tienePermiso('realizar_ventas')) {
            alert('No tiene permisos para realizar ventas');
            window.location.href = 'panel.html';
            return;
        }

        this.mostrarProductos();

        const busquedaProducto = document.getElementById('busquedaProducto');
        const confirmarVentaBtn = document.getElementById('confirmarVenta');
        const cancelarVentaBtn = document.getElementById('cancelarVenta');
        const cerrarComprobanteBtn = document.getElementById('cerrarComprobante');

        busquedaProducto.addEventListener('input', () => {
            this.mostrarProductos();
        });

        confirmarVentaBtn.addEventListener('click', () => {
            this.confirmarVenta();
        });

        cancelarVentaBtn.addEventListener('click', () => {
            this.cancelarVenta();
        });

        if (cerrarComprobanteBtn) {
            cerrarComprobanteBtn.addEventListener('click', () => {
                document.getElementById('comprobanteModal').style.display = 'none';
            });
        }

        window.addEventListener('click', (e) => {
            const modal = document.getElementById('comprobanteModal');
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    }
}

const cajaManager = new CajaManager();