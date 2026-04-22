class VentasManager {
    constructor() {
        this.ventas = this.cargarVentas();
        this.init();
    }

    cargarVentas() {
        const ventas = localStorage.getItem('ventas');
        return ventas ? JSON.parse(ventas) : [];
    }

    mostrarVentas() {
        const tbody = document.getElementById('ventasBody');
        tbody.innerHTML = '';

        this.ventas.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

        this.ventas.forEach(venta => {
            const row = tbody.insertRow();
            row.innerHTML = `
                <td>${venta.id}</td>
                <td>${new Date(venta.fecha).toLocaleString()}</td>
                <td>$${venta.total.toFixed(2)}</td>
                <td>
                    <button class="btn btn-primary" onclick="ventasManager.verDetalle(${venta.id})">
                        Ver Detalle
                    </button>
                </td>
            `;
        });
    }

    verDetalle(id) {
        const venta = this.ventas.find(v => v.id === id);
        if (!venta) return;

        const modal = document.getElementById('detalleModal');
        const contenido = document.getElementById('detalleContenido');

        contenido.innerHTML = `
            <div class="comprobante">
                <div class="comprobante-header">
                    <h3>Detalle de Venta #${venta.id}</h3>
                    <p>Fecha: ${new Date(venta.fecha).toLocaleString()}</p>
                    <p>Atendido por: ${venta.usuario}</p>
                </div>
                <table class="table">
                    <thead>
                        <tr>
                            <th>Producto</th>
                            <th>Cantidad</th>
                            <th>Precio Unitario</th>
                            <th>Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${venta.productos.map(item => `
                            <tr>
                                <td>${item.nombre}</td>
                                <td>${item.cantidad}</td>
                                <td>$${item.precio.toFixed(2)}</td>
                                <td>$${(item.precio * item.cantidad).toFixed(2)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                    <tfoot>
                        <tr>
                            <td colspan="3"><strong>Total</strong></td>
                            <td><strong>$${venta.total.toFixed(2)}</strong></td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        `;

        modal.style.display = 'flex';
    }

    init() {
        this.mostrarVentas();

        const cerrarDetalleBtn = document.getElementById('cerrarDetalle');

        cerrarDetalleBtn.addEventListener('click', () => {
            document.getElementById('detalleModal').style.display = 'none';
        });

        window.addEventListener('click', (e) => {
            const modal = document.getElementById('detalleModal');
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    }
}

const ventasManager = new VentasManager();