// Endpoints de la API
const API_PURCHASES = "https://backend-icesoft.onrender.com/api/purchases";
const API_PRODUCTS = "https://backend-icesoft.onrender.com/api/products";
const API_PROVIDERS = "https://backend-icesoft.onrender.com/api/providers";

// Variables globales para compras y paginación
let allPurchases = [];
let originalPurchases = [];
let currentPage = 1;
const rowsPerPage = 10;

// Función para abrir un modal
function openModal(modalId) {
  document.getElementById(modalId).style.display = "flex";
}

// Función para cerrar un modal
function closeModal(modalId) {
  document.getElementById(modalId).style.display = "none";
}

// Cerrar el modal si el usuario hace clic fuera del contenido
window.onclick = function(event) {
  const registerModal = document.getElementById("registerModal");
  const editModal = document.getElementById("editModal");
  
  if (event.target === registerModal) {
    registerModal.style.display = "none";
  }
  if (event.target === editModal) {
    editModal.style.display = "none";
  }
};

// Formatear fecha para mostrar en la tabla
const formatDate = (dateString) => {
  if (!dateString) return "Fecha no disponible";
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES');
  } catch (e) {
    console.error("Error al formatear fecha:", e);
    return dateString;
  }
};

// Formatear moneda para mostrar en la tabla
const formatCurrency = (amount) => {
  if (amount === undefined || amount === null) return "No disponible";
  try {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'COP' }).format(amount);
  } catch (e) {
    console.error("Error al formatear moneda:", e);
    return amount.toString();
  }
};

// Mostrar mensajes de error
const showError = (message) => {
  Swal.fire({
    icon: 'error',
    title: 'Error',
    text: message
  });
};

// Mostrar mensajes de éxito
const showSuccess = (message) => {
  Swal.fire({
    icon: 'success',
    title: 'Éxito',
    text: message
  });
};

// Mostrar mensajes de validación
const showValidation = (message) => {
  Swal.fire({
    icon: 'warning',
    title: 'Validación',
    text: message
  });
};

// Mostrar diálogo de confirmación
const showConfirm = async ({ title, text, confirmText, cancelText }) => {
  const result = await Swal.fire({
    title,
    text,
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: cancelText
  });
  return result.isConfirmed;
};

// Renderizar tabla de compras
const renderPurchasesTable = (page = 1) => {
  console.log("Renderizando tabla de compras con datos:", allPurchases);
  const tbody = document.getElementById("purchaseTableBody");
  
  if (!tbody) {
    console.error("No se encontró el elemento tbody con ID 'purchaseTableBody'");
    return;
  }
  
  tbody.innerHTML = "";

  const start = (page - 1) * rowsPerPage;
  const end = start + rowsPerPage;
  const purchasesToShow = allPurchases.slice(start, end);

  if (purchasesToShow.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center">No hay compras para mostrar</td></tr>`;
    renderPaginationControls();
    return;
  }

  purchasesToShow.forEach(purchase => {
    const purchaseId = purchase._id || "";
    const displayId = purchase.id || purchaseId;
    const productName = purchase.product?.name || "Sin Producto";
    const providerName = purchase.provider?.name || "Sin Proveedor";
    
    tbody.innerHTML += `
      <tr>
        <td>${displayId}</td>
        <td>${productName}</td>
        <td>${formatDate(purchase.purchaseDate)}</td>
        <td>${providerName}</td>
        <td>${formatCurrency(purchase.total)}</td>
        <td>${purchase.details || ""}</td>
        <td>
          <div class="action-buttons">
            <button onclick="fillEditForm('${purchaseId}')" class="icon-button edit-button" title="Editar">
              <i class="material-icons">edit</i>
            </button>
            <button onclick="deletePurchase('${purchaseId}')" class="icon-button delete-button" title="Eliminar">
              <i class="material-icons">delete</i>
            </button>
          </div>
        </td>
      </tr>
    `;
  });

  renderPaginationControls();
};

// Renderizar controles de paginación
const renderPaginationControls = () => {
  const totalPages = Math.ceil(allPurchases.length / rowsPerPage);
  const container = document.querySelector(".page-numbers");
  const info = document.querySelector(".pagination .page-info");
  
  if (!container) {
    console.error("No se encontró el elemento con clase 'page-numbers'");
    return;
  }

  container.innerHTML = "";

  // Botón anterior
  const prevBtn = document.createElement("button");
  prevBtn.classList.add("page-nav");
  prevBtn.innerText = "←";
  prevBtn.disabled = currentPage === 1;
  prevBtn.onclick = () => changePage(currentPage - 1);
  container.appendChild(prevBtn);

  // Números de página
  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement("div");
    btn.classList.add("page-number");
    if (i === currentPage) btn.classList.add("active");
    btn.innerText = i;
    btn.onclick = () => changePage(i);
    container.appendChild(btn);
  }

  // Botón siguiente
  const nextBtn = document.createElement("button");
  nextBtn.classList.add("page-nav");
  nextBtn.innerText = "→";
  nextBtn.disabled = currentPage === totalPages || totalPages === 0;
  nextBtn.onclick = () => changePage(currentPage + 1);
  container.appendChild(nextBtn);

  if (info) {
    const startItem = allPurchases.length > 0 ? (currentPage - 1) * rowsPerPage + 1 : 0;
    const endItem = Math.min(startItem + rowsPerPage - 1, allPurchases.length);
    info.innerHTML = `${startItem}-${endItem} de ${allPurchases.length}`;
  }
};

// Cambiar de página
const changePage = (page) => {
  currentPage = page;
  renderPurchasesTable(currentPage);
};

// Cargar los productos para los selects
const loadProducts = async () => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      showError("Token no encontrado. Inicie sesión nuevamente.");
      return;
    }
    const res = await fetch(API_PRODUCTS, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      }
    });
    
    if (!res.ok) {
      const data = await res.json();
      showError(data.message || "Error al cargar productos.");
      return;
    }
    
    const data = await res.json();
    const products = data.products || data;
    const productSelect = document.getElementById("product");
    const editProductSelect = document.getElementById("editProduct");
    
    // Reiniciar opciones
    productSelect.innerHTML = `<option value="" disabled selected hidden>Seleccionar producto</option>`;
    editProductSelect.innerHTML = `<option value="" disabled selected hidden>Seleccionar producto</option>`;
    
    products.forEach(prod => {
      const option = `<option value="${prod._id}">${prod.name}</option>`;
      productSelect.innerHTML += option;
      editProductSelect.innerHTML += option;
    });
  } catch (err) {
    console.error("Error al cargar productos:", err);
    showError("Error al cargar productos.");
  }
};

// Cargar los proveedores para los selects
const loadProviders = async () => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      showError("Token no encontrado. Inicie sesión nuevamente.");
      return;
    }
    const res = await fetch(API_PROVIDERS, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      }
    });
    
    if (!res.ok) {
      const data = await res.json();
      showError(data.message || "Error al cargar proveedores.");
      return;
    }
    
    const data = await res.json();
    const providers = data.providers || data;
    const providerSelect = document.getElementById("provider");
    const editProviderSelect = document.getElementById("editProvider");
    
    // Reiniciar opciones
    providerSelect.innerHTML = `<option value="" disabled selected hidden>Seleccionar proveedor</option>`;
    editProviderSelect.innerHTML = `<option value="" disabled selected hidden>Seleccionar proveedor</option>`;
    
    providers.forEach(prov => {
      const option = `<option value="${prov._id}">${prov.name}</option>`;
      providerSelect.innerHTML += option;
      editProviderSelect.innerHTML += option;
    });
  } catch (err) {
    console.error("Error al cargar proveedores:", err);
    showError("Error al cargar proveedores.");
  }
};

// Registrar compra
const registerPurchase = async () => {
  const token = localStorage.getItem("token");
  if (!token) {
    showError("Token no encontrado. Inicie sesión nuevamente.");
    return;
  }
  
  const product = document.getElementById("product").value;
  const purchaseDate = document.getElementById("purchaseDate").value;
  const provider = document.getElementById("provider").value;
  const total = parseFloat(document.getElementById("total").value);
  const details = document.getElementById("details").value.trim();

  if (!product || !purchaseDate || !provider || isNaN(total)) {
    showValidation("Todos los campos son obligatorios y deben ser válidos.");
    return;
  }

  const confirmed = await showConfirm({
    title: "¿Confirmas registrar esta compra?",
    text: "Se creará una nueva compra con los datos proporcionados.",
    confirmText: "Registrar",
    cancelText: "Cancelar"
  });

  if (!confirmed) {
    Swal.fire({
      icon: 'info',
      title: 'Operación cancelada',
      text: 'No se ha registrado ninguna compra',
    });
    closeModal('registerModal');
    return;
  }

  try {
    const res = await fetch(API_PURCHASES, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ product, purchaseDate, provider, total, details })
    });
    
    if (!res.ok) {
      const data = await res.json();
      showError(data.message || "Error al registrar compra.");
      return;
    }
    
    const data = await res.json();
    showSuccess(data.message || "Compra registrada correctamente.");
    closeModal('registerModal');
    document.getElementById("purchaseForm").reset();
    listPurchases();
  } catch (err) {
    console.error("Error al registrar compra:", err);
    showError("Error al registrar compra");
  }
};

// Llenar formulario de edición de compra
const fillEditForm = async (id) => {
  console.log("Editando compra con ID:", id);
  const token = localStorage.getItem("token");
  const confirmed = await showConfirm({
    title: "¿Deseas editar esta compra?",
    text: "Vas a modificar la información de esta compra.",
    confirmText: "Editar",
    cancelText: "Cancelar",
  });

  if (!confirmed) {
    Swal.fire({
      icon: "info",
      title: "Operación cancelada",
      text: "No se editará esta compra",
    });
    return;
  }

  try {
    const res = await fetch(`${API_PURCHASES}/${id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      const data = await res.json();
      showError(data.message || "Error al cargar los datos de la compra.");
      return;
    }

    const purchase = await res.json();
    console.log("Datos de compra recibidos:", purchase);
    
    document.getElementById("editId").value = purchase._id;
    document.getElementById("editProduct").value = purchase.product?._id || "";
    document.getElementById("editPurchaseDate").value = purchase.purchaseDate || "";
    document.getElementById("editProvider").value = purchase.provider?._id || "";
    document.getElementById("editTotal").value = purchase.total || "";
    document.getElementById("editDetails").value = purchase.details || "";

    openModal("editModal");
  } catch (err) {
    console.error("Error al cargar la compra:", err);
    showError(`Ocurrió un error: ${err.message || err}`);
  }
};

// Actualizar compra
const updatePurchase = async () => {
  const token = localStorage.getItem("token");
  if (!token) {
    showError("Token no encontrado. Inicie sesión nuevamente.");
    return;
  }

  const purchaseId = document.getElementById("editId").value;
  const product = document.getElementById("editProduct").value;
  const purchaseDate = document.getElementById("editPurchaseDate").value;
  const provider = document.getElementById("editProvider").value;
  const total = parseFloat(document.getElementById("editTotal").value);
  const details = document.getElementById("editDetails").value.trim();

  if (!product || !purchaseDate || !provider || isNaN(total)) {
    showError("Todos los campos son obligatorios y deben ser válidos.");
    return;
  }

  const confirmed = await showConfirm({
    title: "¿Confirmas actualizar esta compra?",
    text: "Se guardarán los cambios realizados.",
    confirmText: "Actualizar",
    cancelText: "Cancelar",
  });

  if (!confirmed) return;

  try {
    const res = await fetch(`${API_PURCHASES}/${purchaseId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ product, purchaseDate, provider, total, details }),
    });

    if (!res.ok) {
      const data = await res.json();
      showError(data.message || "Error al actualizar la compra.");
      return;
    }

    const data = await res.json();
    showSuccess(data.message || "Compra actualizada correctamente.");
    closeModal("editModal");
    document.getElementById("editForm").reset();
    listPurchases();
  } catch (err) {
    console.error("Error al actualizar compra:", err);
    showError(`Ocurrió un error: ${err.message || err}`);
  }
};

// Listar compras desde el backend
const listPurchases = async () => {
  console.log("Iniciando listado de compras");
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      showError("Token no encontrado. Inicie sesión nuevamente.");
      return;
    }
    
    console.log("Realizando petición a:", API_PURCHASES);
    const res = await fetch(API_PURCHASES, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      }
    });
    
    console.log("Respuesta:", res.status, res.statusText);
    
    if (!res.ok) {
      const data = await res.json();
      showError(data.message || "Error al listar compras.");
      return;
    }
    
    const data = await res.json();
    console.log("Datos recibidos:", data);
    
    // Directamente usar los datos recibidos, ya que el backend ya nos da el array
    originalPurchases = Array.isArray(data) ? data : [];
    console.log("Compras cargadas:", originalPurchases.length);
    
    allPurchases = [...originalPurchases];
    currentPage = 1;
    renderPurchasesTable(currentPage);
  } catch (err) {
    console.error("Error al listar compras:", err);
    showError("Error al listar compras");
  }
};

// Eliminar compra
const deletePurchase = async (id) => {
  console.log("Eliminando compra con ID:", id);
  const token = localStorage.getItem("token");
  const confirmed = await showConfirm({
    title: "¿Estás seguro de eliminar esta compra?",
    text: "Esta acción no se puede deshacer.",
    confirmText: "Eliminar",
    cancelText: "Cancelar"
  });
  
  if (!confirmed) return;

  try {
    const res = await fetch(`${API_PURCHASES}/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    if (!res.ok) {
      const data = await res.json();
      showError(data.message || "No se pudo eliminar la compra");
      return;
    }
    
    showSuccess("Compra eliminada correctamente.");
    listPurchases();
  } catch (err) {
    console.error("Error al eliminar compra:", err);
    showError("Error al eliminar compra");
  }
};

// Buscar compra
const searchPurchase = () => {
  const term = document.getElementById("searchInput").value.toLowerCase().trim();
  console.log("Buscando:", term);
  
  if (!term) {
    allPurchases = [...originalPurchases];
  } else {
    allPurchases = originalPurchases.filter(p => {
      return (
        (p.product?.name && p.product.name.toLowerCase().includes(term)) || 
        (p.provider?.name && p.provider.name.toLowerCase().includes(term)) ||
        (p.id && p.id.toLowerCase().includes(term)) ||
        (p.details && p.details.toLowerCase().includes(term))
      );
    });
  }
  
  console.log("Resultados:", allPurchases.length);
  currentPage = 1;
  renderPurchasesTable(currentPage);
};

// Verificar si el usuario está autenticado
const checkAuth = () => {
  const token = localStorage.getItem("token");
  if (!token) {
    Swal.fire({
      icon: 'error',
      title: 'No autorizado',
      text: 'Debe iniciar sesión para acceder a esta página',
      confirmButtonText: 'Ir a login'
    }).then(() => {
      window.location.href = 'login.html';
    });
    return false;
  }
  return true;
};

// Eventos al cargar el DOM
document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM cargado. Verificando autenticación...");
  if (!checkAuth()) return;
  
  console.log("Cargando datos iniciales...");
  // Cargar datos iniciales
  listPurchases();
  loadProducts();
  loadProviders();
  
  // Configurar eventos de UI
  const mobileAddButton = document.getElementById("mobileAddButton");
  if (mobileAddButton) {
    mobileAddButton.onclick = () => openModal('registerModal');
  } else {
    console.error("No se encontró el elemento mobileAddButton");
  }
  
  const registerButton = document.getElementById("registerButton");
  if (registerButton) {
    registerButton.onclick = registerPurchase;
  } else {
    console.error("No se encontró el elemento registerButton");
  }
  
  const searchInput = document.getElementById("searchInput");
  if (searchInput) {
    searchInput.addEventListener("keyup", searchPurchase);
  } else {
    console.error("No se encontró el elemento searchInput");
  }

  // Añadir evento de submit para el formulario de edición
  const editForm = document.getElementById("editForm");
  if (editForm) {
    editForm.onsubmit = async (event) => {
      event.preventDefault();
      await updatePurchase();
    };
  } else {
    console.error("No se encontró el elemento editForm");
  }
});

// Hacer funciones globales si es necesario
window.fillEditForm = fillEditForm;
window.deletePurchase = deletePurchase;
window.updatePurchase = updatePurchase;
window.openModal = openModal;
window.closeModal = closeModal;
window.searchPurchase = searchPurchase;