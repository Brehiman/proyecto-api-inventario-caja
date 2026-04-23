class InventarioManager {
    constructor() {
        this.sesionActiva = JSON.parse(localStorage.getItem('sesionActiva'));
        this.permisos = this.cargarPermisos();
        this.productos = this.cargarInventario();
        this.productosFiltrados = [...this.productos];
        this.categorias = new Set();
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
                    permisos: ['ver_inventario', 'editar_inventario', 'eliminar_inventario']
                },
                JEFE_TIENDA: {
                    id: 'jefe',
                    permisos: ['ver_inventario', 'editar_inventario']
                },
                EMPLEADO: {
                    id: 'empleado',
                    permisos: ['ver_inventario']
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
        localStorage.setItem('inventario', JSON.stringify(this.productos));
    }

    async cargarDesdeAPI() {
        if (!this.tienePermiso('editar_inventario')) {
            alert('No tiene permisos para cargar productos');
            return;
        }

        const loading = document.getElementById('loading');
        loading.style.display = 'block';

        try {
            const productosAPI = await apiManager.obtenerProductos();
            const categoriasAPI = await apiManager.obtenerCategorias();

            productosAPI.forEach(producto => {
                const productoExistente = this.productos.find(p => p.id === producto.id);

                if (!productoExistente) {
                    this.productos.push({
                        id: producto.id,
                        nombre: producto.title,
                        precio: producto.price,
                        categoria: producto.category,
                        descripcion: producto.description,
                        imagen: producto.thumbnail,
                        stock: Math.floor(Math.random() * 50) + 10
                    });
                }
            });

            this.categorias = new Set(productosAPI.map(p => p.category));

            this.guardarInventario();
            this.actualizarFiltroCategorias();
            this.aplicarFiltros();
        } catch (error) {
            alert('Error al cargar productos de la API');
        } finally {
            loading.style.display = 'none';
        }
    }

    actualizarFiltroCategorias() {
        const filtroCategoria = document.getElementById('filtroCategoria');
        filtroCategoria.innerHTML = '<option value="">Todas las categorías</option>';

        this.categorias.forEach(categoria => {
            const option = document.createElement('option');
            option.value = categoria;
            option.textContent = categoria;
            filtroCategoria.appendChild(option);
        });
    }

    aplicarFiltros() {
        const busqueda = document.getElementById('busqueda').value.toLowerCase();
        const categoria = document.getElementById('filtroCategoria').value;
        const orden = document.getElementById('ordenPrecio').value;

        this.productosFiltrados = this.productos.filter(producto => {
            const coincideBusqueda = producto.nombre.toLowerCase().includes(busqueda);
            const coincideCategoria = !categoria || producto.categoria === categoria;
            return coincideBusqueda && coincideCategoria;
        });

        if (orden === 'asc') {
            this.productosFiltrados.sort((a, b) => a.precio - b.precio);
        } else if (orden === 'desc') {
            this.productosFiltrados.sort((a, b) => b.precio - a.precio);
        }

        this.mostrarInventario();
    }

    actualizarStock(id, cantidad) {
        const producto = this.productos.find(p => p.id === id);
        if (producto) {
            producto.stock -= cantidad;
            this.guardarInventario();
            this.aplicarFiltros();
        }
    }

    mostrarInventario() {
        const tbody = document.getElementById('inventarioBody');
        tbody.innerHTML = '';

        this.productosFiltrados.forEach(producto => {
            const row = tbody.insertRow();

            // Determinar si el input de stock debe ser editable
            const stockInput = this.tienePermiso('editar_inventario')
                ? `<input type="number" 
                           id="stock-${producto.id}" 
                           value="${producto.stock}" 
                           min="0"
                           onchange="inventarioManager.modificarStock(${producto.id}, this.value)">`
                : `<span>${producto.stock}</span>`;

            row.innerHTML = `
                <td>${producto.id}</td>
                <td><img src="${producto.imagen}" alt="${producto.nombre}"></td>
                <td>${producto.nombre}</td>
                <td>${producto.categoria}</td>
                <td>$${producto.precio.toFixed(2)}</td>
                <td>${stockInput}</td>
                <td class="acciones">
                    <button class="btn btn-warning" onclick="inventarioManager.verDetalles(${producto.id})">Ver</button>
                </td>
            `;
        });
    }

    modificarStock(id, nuevoStock) {
        if (!this.tienePermiso('editar_inventario')) {
            alert('No tiene permisos para modificar el stock');
            this.mostrarInventario(); // Recargar para restaurar valor original
            return;
        }

        const producto = this.productos.find(p => p.id === id);
        if (producto) {
            producto.stock = parseInt(nuevoStock);
            this.guardarInventario();
            this.aplicarFiltros();
        }
    }

    verDetalles(id) {
        const producto = this.productos.find(p => p.id === id);
        if (producto) {
            alert(`
                ID: ${producto.id}
                Nombre: ${producto.nombre}
                Precio: $${producto.precio.toFixed(2)}
                Categoría: ${producto.categoria}
                Stock: ${producto.stock}
                Descripción: ${producto.descripcion}
            `);
        }
    }

    init() {
        // Verificar permiso básico
        if (!this.tienePermiso('ver_inventario')) {
            alert('No tiene permisos para acceder al inventario');
            window.location.href = 'panel.html';
            return;
        }

        const cargarAPIBtn = document.getElementById('cargarAPI');
        const busquedaInput = document.getElementById('busqueda');
        const filtroCategoria = document.getElementById('filtroCategoria');
        const ordenPrecio = document.getElementById('ordenPrecio');

        // Solo mostrar botón de cargar API si tiene permisos de edición
        if (!this.tienePermiso('editar_inventario')) {
            if (cargarAPIBtn) cargarAPIBtn.style.display = 'none';
        }

        if (this.productos.length === 0) {
            console.log('🔄 Inventario vacío, cargando productos automáticamente...');
            this.cargarDesdeAPI();
        } else {
            this.productos.forEach(p => this.categorias.add(p.categoria));
            this.actualizarFiltroCategorias();
            this.aplicarFiltros();
        }

        if (cargarAPIBtn) {
            cargarAPIBtn.addEventListener('click', () => {
                this.cargarDesdeAPI();
            });
        }

        busquedaInput.addEventListener('input', () => {
            this.aplicarFiltros();
        });

        filtroCategoria.addEventListener('change', () => {
            this.aplicarFiltros();
        });

        ordenPrecio.addEventListener('change', () => {
            this.aplicarFiltros();
        });
    }
}

const inventarioManager = new InventarioManager();