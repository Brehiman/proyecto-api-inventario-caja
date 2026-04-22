class APIManager {
    constructor() {
        this.apiUrl = 'https://dummyjson.com/products';
    }

    async obtenerProductos() {
        try {
            const response = await fetch(this.apiUrl);
            const data = await response.json();
            return data.products;
        } catch (error) {
            console.error('Error al obtener productos:', error);
            throw error;
        }
    }

    async obtenerCategorias() {
        try {
            const response = await fetch('https://dummyjson.com/products/categories');
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error al obtener categorías:', error);
            return [];
        }
    }
}

const apiManager = new APIManager();