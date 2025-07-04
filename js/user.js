// Endpoints de la API
const API_URL = "https://backend-alpha-orpin-58.vercel.app/api/users";
const API_AUTH = "https://backend-alpha-orpin-58.vercel.app/api/auth/register";
const API_ROLES = "https://backend-alpha-orpin-58.vercel.app/api/roles";

// Variables globales para usuarios y paginación
let allUsers = [];
let originalUsers = [];
let currentPage = 1;
const rowsPerPage = 10;

// Función auxiliar para obtener el nombre de rol en español
function getDisplayNameForRole(roleName) {
  const roleTranslations = {
    "admin": "Administrador",
    "assistant": "Asistente",
    "employee": "Empleado"
  };
  
  return roleTranslations[roleName] || roleName;
}

// ===== FUNCIONES DE VALIDACIÓN =====

// Función para validar un campo y mostrar error
function validateField(fieldId, errorMessage) {
  const field = document.getElementById(fieldId);
  const errorElement = document.getElementById(`${fieldId}-error`);
  
  if (!field.value.trim()) {
    errorElement.textContent = errorMessage || "El campo es obligatorio.";
    errorElement.style.display = "block";
    field.classList.add("input-error");
    return false;
  } else {
    errorElement.style.display = "none";
    field.classList.remove("input-error");
    return true;
  }
}

// Función para validar teléfono - ACTUALIZADA
function validatePhone(fieldId) {
  const field = document.getElementById(fieldId);
  const errorElement = document.getElementById(`${fieldId}-error`);
  
  if (!field.value.trim()) {
    errorElement.textContent = "El teléfono es obligatorio.";
    errorElement.style.display = "block";
    field.classList.add("input-error");
    return false;
  } else if (!/^\d+$/.test(field.value.trim())) {
    errorElement.textContent = "El teléfono debe contener solo dígitos.";
    errorElement.style.display = "block";
    field.classList.add("input-error");
    return false;
  } else if (field.value.trim().length < 10) {
    errorElement.textContent = "El teléfono debe tener al menos 10 dígitos.";
    errorElement.style.display = "block";
    field.classList.add("input-error");
    return false;
  } else {
    errorElement.style.display = "none";
    field.classList.remove("input-error");
    return true;
  }
}

// Función para validar email
function validateEmail(fieldId) {
  const field = document.getElementById(fieldId);
  const errorElement = document.getElementById(`${fieldId}-error`);
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!field.value.trim()) {
    errorElement.textContent = "El correo es obligatorio.";
    errorElement.style.display = "block";
    field.classList.add("input-error");
    return false;
  } else if (!emailRegex.test(field.value.trim())) {
    errorElement.textContent = "El formato del correo electrónico no es válido.";
    errorElement.style.display = "block";
    field.classList.add("input-error");
    return false;
  } else {
    errorElement.style.display = "none";
    field.classList.remove("input-error");
    return true;
  }
}

// Función para validar contraseña
function validatePassword(fieldId) {
  const field = document.getElementById(fieldId);
  const errorElement = document.getElementById(`${fieldId}-error`);
  
  if (!field.value.trim()) {
    errorElement.textContent = "La contraseña es obligatoria.";
    errorElement.style.display = "block";
    field.classList.add("input-error");
    return false;
  } else if (field.value.trim().length < 6) {
    errorElement.textContent = "La contraseña debe tener al menos 6 caracteres.";
    errorElement.style.display = "block";
    field.classList.add("input-error");
    return false;
  } else {
    errorElement.style.display = "none";
    field.classList.remove("input-error");
    return true;
  }
}

// Función para validar rol
function validateRole(fieldId) {
  // Siempre usar el selector nativo como fuente de verdad
  let fieldValue = '';
  let inputElement = null;
  
  if (fieldId === 'role') {
    // Formulario de registro
    const field = document.getElementById('rol');
    fieldValue = field ? field.value : '';
    
    // Para mostrar error en el input visible (personalizado o nativo)
    if (customRoleSelector && customRoleSelector.container && customRoleSelector.container.style.display !== 'none') {
      inputElement = document.getElementById('roleSearch');
    } else {
      inputElement = field;
    }
  } else if (fieldId === 'editRole') {
    // Formulario de edición
    const field = document.getElementById('editRole');
    fieldValue = field ? field.value : '';
    
    // Para mostrar error en el input visible (personalizado o nativo)
    if (customEditRoleSelector && customEditRoleSelector.container && customEditRoleSelector.container.style.display !== 'none') {
      inputElement = document.getElementById('editRoleSearch');
    } else {
      inputElement = field;
    }
  }
  
  const errorElement = document.getElementById(`${fieldId}-error`);
  
  if (!fieldValue) {
    if (errorElement) {
      errorElement.textContent = "Debe seleccionar un rol.";
      errorElement.style.display = "block";
    }
    if (inputElement) {
      inputElement.classList.add("input-error");
    }
    return false;
  } else {
    if (errorElement) {
      errorElement.style.display = "none";
    }
    if (inputElement) {
      inputElement.classList.remove("input-error");
    }
    return true;
  }
}

// Limpiar mensajes de error
function clearValidationErrors(formId) {
  const form = document.getElementById(formId);
  const errorElements = form.querySelectorAll('.error-message');
  const inputElements = form.querySelectorAll('.field-element');
  
  errorElements.forEach(element => {
    element.style.display = "none";
  });
  
  inputElements.forEach(element => {
    element.classList.remove("input-error");
  });
}

// Desactivar validación nativa del navegador en los formularios
function disableNativeBrowserValidation() {
  // Desactivar validación del formulario de registro
  const userForm = document.getElementById("userForm");
  if (userForm) {
    userForm.setAttribute("novalidate", "");
    
    // Quitar atributos 'required' y 'pattern' de los campos
    const inputs = userForm.querySelectorAll("input, select");
    inputs.forEach(input => {
      input.removeAttribute("required");
      input.removeAttribute("pattern");
    });
  }
  
  // Desactivar validación del formulario de edición
  const editForm = document.getElementById("editForm");
  if (editForm) {
    editForm.setAttribute("novalidate", "");
    
    // Quitar atributos 'required' y 'pattern' de los campos
    const inputs = editForm.querySelectorAll("input, select");
    inputs.forEach(input => {
      input.removeAttribute("required");
      input.removeAttribute("pattern");
    });
  }
}

// ===== CLASES DE SELECTORES PERSONALIZADOS =====

// Instancias globales de los selectores personalizados
let customRoleSelector = null;
let customEditRoleSelector = null;

// Clase para manejar el selector personalizado de roles (registro)
class CustomRoleSelector {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.input = document.getElementById('roleSearch');
    this.hiddenInput = document.getElementById('rolHidden');
    this.nativeSelect = document.getElementById('rol');
    this.dropdown = document.getElementById('roleDropdown');
    this.searchInput = document.getElementById('roleSearchInput');
    this.optionsContainer = document.getElementById('roleOptions');
    this.roles = [];
    this.filteredRoles = [];
    this.selectedRole = null;
    this.isOpen = false;

    this.init();
  }

  init() {
    if (!this.container) return;

    // Event listeners
    this.input.addEventListener('click', () => this.toggle());
    this.searchInput.addEventListener('input', (e) => this.filterRoles(e.target.value));
    this.searchInput.addEventListener('keydown', (e) => this.handleKeydown(e));

    // Cerrar al hacer clic fuera
    document.addEventListener('click', (e) => {
      if (!this.container.contains(e.target)) {
        this.close();
      }
    });
  }

  setRoles(roles) {
    // Validar que roles sea un array válido
    if (!Array.isArray(roles)) {
      console.warn('CustomRoleSelector setRoles: roles no es un array válido:', roles);
      this.roles = [];
      this.filteredRoles = [];
      this.renderOptions();
      return;
    }
    
    this.roles = roles.map(role => ({
      id: role._id,
      name: role.name || 'Sin nombre',
      displayName: role.displayName || getDisplayNameForRole(role.name) || role.name
    }));
    this.filteredRoles = [...this.roles];
    this.renderOptions();
    
    // Mostrar selector personalizado y ocultar nativo
    if (this.container && this.nativeSelect) {
      this.container.style.display = 'block';
      this.nativeSelect.style.display = 'none';
    }
  }

  filterRoles(searchTerm) {
    const term = searchTerm.toLowerCase().trim();
    
    if (!term) {
      this.filteredRoles = [...this.roles];
    } else {
      this.filteredRoles = this.roles.filter(role => 
        role.displayName.toLowerCase().includes(term) ||
        role.name.toLowerCase().includes(term)
      );
    }
    
    this.renderOptions();
  }

  renderOptions() {
    if (this.filteredRoles.length === 0) {
      this.optionsContainer.innerHTML = '<div class="custom-select-no-results">No se encontraron roles</div>';
      return;
    }

    const optionsHTML = this.filteredRoles.map(role => 
      `<div class="custom-select-option" data-id="${role.id}">
        ${role.displayName}
      </div>`
    ).join('');

    this.optionsContainer.innerHTML = optionsHTML;

    // Agregar event listeners a las opciones
    this.optionsContainer.querySelectorAll('.custom-select-option').forEach(option => {
      option.addEventListener('click', () => this.selectOption(option));
    });
  }

  selectOption(optionElement) {
    const roleId = optionElement.dataset.id;
    const roleName = optionElement.textContent.trim();

    // Actualizar valores
    this.selectedRole = { id: roleId, name: roleName };
    this.input.value = roleName;
    this.hiddenInput.value = roleId;

    // Limpiar validación
    this.clearValidation();

    // Cerrar dropdown
    this.close();

    // Disparar evento de cambio para compatibilidad con código existente
    // Sincronizar con selector nativo
    if (this.nativeSelect) {
      this.nativeSelect.value = roleId;
    }

    const changeEvent = new Event('change', { bubbles: true });
    this.hiddenInput.dispatchEvent(changeEvent);
  }

  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  adjustDropdownDirection() {
    if (!this.dropdown || !this.container) {
      console.log('CustomRoleSelector: No hay dropdown o container disponible');
      return;
    }
    
    // Lógica simplificada: si estamos en un modal y hay poco espacio abajo, abrir hacia arriba
    const modal = this.container.closest('.modal');
    const containerRect = this.container.getBoundingClientRect();
    
    console.log('CustomRoleSelector: Detectando dirección del dropdown...');
    console.log('Modal encontrado:', !!modal);
    console.log('Posición del container:', containerRect);
    
    if (modal) {
      // TEMPORAL: Siempre abrir hacia arriba en modales para probar
      console.log('CustomRoleSelector: Estamos en modal - FORZANDO hacia ARRIBA!');
      this.dropdown.classList.add('dropdown-up');
      return;
      
      /* Lógica original comentada para debugging
      const modalRect = modal.getBoundingClientRect();
      const modalBottom = modalRect.bottom;
      const modalTop = modalRect.top;
      const modalHeight = modalRect.height;
      const containerBottom = containerRect.bottom;
      const containerTop = containerRect.top;
      const spaceBelow = modalBottom - containerBottom;
      
      // Calcular si estamos en la segunda mitad del modal
      const containerPositionInModal = (containerTop - modalTop) / modalHeight;
      
      console.log('Espacio debajo en modal:', spaceBelow);
      console.log('Posición en modal (0-1):', containerPositionInModal);
      
      // Si hay menos de 250px de espacio abajo O estamos en la segunda mitad del modal, abrir hacia arriba
      if (spaceBelow < 250 || containerPositionInModal > 0.6) {
        console.log('CustomRoleSelector: ¡Abriendo hacia ARRIBA!');
        this.dropdown.classList.add('dropdown-up');
        return;
      }
      */
    }
    
    // Si no estamos en modal o hay suficiente espacio, abrir hacia abajo
    const viewportHeight = window.innerHeight;
    const spaceBelow = viewportHeight - containerRect.bottom;
    
    if (spaceBelow < 280) {
      console.log('CustomRoleSelector: ¡Abriendo hacia ARRIBA!');
      this.dropdown.classList.add('dropdown-up');
    } else {
      console.log('CustomRoleSelector: Abriendo hacia abajo');
      this.dropdown.classList.remove('dropdown-up');
    }
  }

  open() {
    this.isOpen = true;
    this.container.classList.add('open');
    this.searchInput.value = '';
    this.filteredRoles = [...this.roles];
    this.renderOptions();
    
    // Detectar si debe abrirse hacia arriba o abajo (con pequeño delay para asegurar renderizado)
    setTimeout(() => {
      this.adjustDropdownDirection();
    }, 10);
    
    // Enfocar en el input de búsqueda
    setTimeout(() => {
      this.searchInput.focus();
    }, 100);
  }

  close() {
    this.isOpen = false;
    this.container.classList.remove('open');
    // Limpiar la dirección del dropdown
    if (this.dropdown) {
      this.dropdown.classList.remove('dropdown-up');
    }
  }

  handleKeydown(e) {
    if (e.key === 'Escape') {
      this.close();
    }
  }

  clearValidation() {
    const errorElement = document.getElementById('role-error');
    if (errorElement) {
      errorElement.style.display = 'none';
    }
    this.input.classList.remove('input-error');
  }

  reset() {
    this.selectedRole = null;
    this.input.value = '';
    this.hiddenInput.value = '';
    this.searchInput.value = '';
    // Asegurar que this.roles sea un array válido antes de copiar
    if (Array.isArray(this.roles)) {
      this.filteredRoles = [...this.roles];
    } else {
      this.filteredRoles = [];
    }
    this.renderOptions();
    this.close();
  }

  getValue() {
    return this.hiddenInput.value;
  }

  setValue(roleId) {
    console.log('CustomEditRoleSelector setValue llamado con:', roleId);
    console.log('Roles disponibles:', this.roles);
    
    if (!Array.isArray(this.roles)) {
      console.log('Roles no es array, inicializando...');
      this.roles = [];
    }
    
    if (!roleId) {
      console.log('No hay roleId, resetear selector');
      this.reset();
      return;
    }
    
    const role = this.roles.find(r => r.id === roleId);
    console.log('Rol encontrado:', role);
    
    if (role) {
      this.selectedRole = role;
      this.input.value = role.displayName;
      this.hiddenInput.value = roleId;
      
      // También sincronizar con el selector nativo
      if (this.nativeSelect) {
        this.nativeSelect.value = roleId;
      }
      
      console.log('Valor establecido correctamente:', {
        input: this.input.value,
        hidden: this.hiddenInput.value,
        native: this.nativeSelect ? this.nativeSelect.value : 'N/A'
      });
    } else {
      console.warn('Rol no encontrado con ID:', roleId);
      // Si no encuentra el rol, intentar establecer directamente en el input nativo
      if (this.nativeSelect) {
        const nativeOption = this.nativeSelect.querySelector(`option[value="${roleId}"]`);
        if (nativeOption) {
          this.input.value = nativeOption.textContent;
          this.hiddenInput.value = roleId;
          this.nativeSelect.value = roleId;
          console.log('Valor establecido desde selector nativo');
        }
      }
    }
  }

  getSelectedRole() {
    return this.selectedRole;
  }
}

// Clase para manejar el selector personalizado de roles (edición)
class CustomEditRoleSelector {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.input = document.getElementById('editRoleSearch');
    this.hiddenInput = document.getElementById('editRoleHidden');
    this.nativeSelect = document.getElementById('editRole');
    this.dropdown = document.getElementById('editRoleDropdown');
    this.searchInput = document.getElementById('editRoleSearchInput');
    this.optionsContainer = document.getElementById('editRoleOptions');
    this.roles = [];
    this.filteredRoles = [];
    this.selectedRole = null;
    this.isOpen = false;

    this.init();
  }

  init() {
    if (!this.container) return;

    // Event listeners
    this.input.addEventListener('click', () => this.toggle());
    this.searchInput.addEventListener('input', (e) => this.filterRoles(e.target.value));
    this.searchInput.addEventListener('keydown', (e) => this.handleKeydown(e));

    // Cerrar al hacer clic fuera
    document.addEventListener('click', (e) => {
      if (!this.container.contains(e.target)) {
        this.close();
      }
    });
  }

  setRoles(roles) {
    // Validar que roles sea un array válido
    if (!Array.isArray(roles)) {
      console.warn('CustomEditRoleSelector setRoles: roles no es un array válido:', roles);
      this.roles = [];
      this.filteredRoles = [];
      this.renderOptions();
      return;
    }
    
    this.roles = roles.map(role => ({
      id: role._id,
      name: role.name || 'Sin nombre',
      displayName: role.displayName || getDisplayNameForRole(role.name) || role.name
    }));
    this.filteredRoles = [...this.roles];
    this.renderOptions();
    
    // Mostrar selector personalizado y ocultar nativo
    if (this.container && this.nativeSelect) {
      this.container.style.display = 'block';
      this.nativeSelect.style.display = 'none';
    }
  }

  filterRoles(searchTerm) {
    const term = searchTerm.toLowerCase().trim();
    
    if (!term) {
      this.filteredRoles = [...this.roles];
    } else {
      this.filteredRoles = this.roles.filter(role => 
        role.displayName.toLowerCase().includes(term) ||
        role.name.toLowerCase().includes(term)
      );
    }
    
    this.renderOptions();
  }

  renderOptions() {
    if (this.filteredRoles.length === 0) {
      this.optionsContainer.innerHTML = '<div class="custom-select-no-results">No se encontraron roles</div>';
      return;
    }

    const optionsHTML = this.filteredRoles.map(role => 
      `<div class="custom-select-option" data-id="${role.id}">
        ${role.displayName}
      </div>`
    ).join('');

    this.optionsContainer.innerHTML = optionsHTML;

    // Agregar event listeners a las opciones
    this.optionsContainer.querySelectorAll('.custom-select-option').forEach(option => {
      option.addEventListener('click', () => this.selectOption(option));
    });
  }

  selectOption(optionElement) {
    const roleId = optionElement.dataset.id;
    const roleName = optionElement.textContent.trim();

    // Actualizar valores
    this.selectedRole = { id: roleId, name: roleName };
    this.input.value = roleName;
    this.hiddenInput.value = roleId;

    // Limpiar validación
    this.clearValidation();

    // Cerrar dropdown
    this.close();

    // Disparar evento de cambio para compatibilidad con código existente
    // Sincronizar con selector nativo
    if (this.nativeSelect) {
      this.nativeSelect.value = roleId;
    }

    const changeEvent = new Event('change', { bubbles: true });
    this.hiddenInput.dispatchEvent(changeEvent);
  }

  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  adjustDropdownDirection() {
    if (!this.dropdown || !this.container) {
      console.log('CustomEditRoleSelector: No hay dropdown o container disponible');
      return;
    }
    
    // Lógica simplificada: si estamos en un modal y hay poco espacio abajo, abrir hacia arriba
    const modal = this.container.closest('.modal');
    const containerRect = this.container.getBoundingClientRect();
    
    console.log('CustomEditRoleSelector: Detectando dirección del dropdown...');
    console.log('Modal encontrado:', !!modal);
    console.log('Posición del container:', containerRect);
    
    if (modal) {
      // TEMPORAL: Siempre abrir hacia arriba en modales para probar
      console.log('CustomEditRoleSelector: Estamos en modal - FORZANDO hacia ARRIBA!');
      this.dropdown.classList.add('dropdown-up');
      return;
      
      /* Lógica original comentada para debugging
      const modalRect = modal.getBoundingClientRect();
      const modalBottom = modalRect.bottom;
      const modalTop = modalRect.top;
      const modalHeight = modalRect.height;
      const containerBottom = containerRect.bottom;
      const containerTop = containerRect.top;
      const spaceBelow = modalBottom - containerBottom;
      
      // Calcular si estamos en la segunda mitad del modal
      const containerPositionInModal = (containerTop - modalTop) / modalHeight;
      
      console.log('Espacio debajo en modal:', spaceBelow);
      console.log('Posición en modal (0-1):', containerPositionInModal);
      
      // Si hay menos de 250px de espacio abajo O estamos en la segunda mitad del modal, abrir hacia arriba
      if (spaceBelow < 250 || containerPositionInModal > 0.6) {
        console.log('CustomEditRoleSelector: ¡Abriendo hacia ARRIBA!');
        this.dropdown.classList.add('dropdown-up');
        return;
      }
      */
    }
    
    // Si no estamos en modal o hay suficiente espacio, abrir hacia abajo
    const viewportHeight = window.innerHeight;
    const spaceBelow = viewportHeight - containerRect.bottom;
    
    if (spaceBelow < 280) {
      console.log('CustomEditRoleSelector: ¡Abriendo hacia ARRIBA!');
      this.dropdown.classList.add('dropdown-up');
    } else {
      console.log('CustomEditRoleSelector: Abriendo hacia abajo');
      this.dropdown.classList.remove('dropdown-up');
    }
  }

  open() {
    this.isOpen = true;
    this.container.classList.add('open');
    this.searchInput.value = '';
    this.filteredRoles = [...this.roles];
    this.renderOptions();
    
    // Detectar si debe abrirse hacia arriba o abajo (con pequeño delay para asegurar renderizado)
    setTimeout(() => {
      this.adjustDropdownDirection();
    }, 10);
    
    // Enfocar en el input de búsqueda
    setTimeout(() => {
      this.searchInput.focus();
    }, 100);
  }

  close() {
    this.isOpen = false;
    this.container.classList.remove('open');
    // Limpiar la dirección del dropdown
    if (this.dropdown) {
      this.dropdown.classList.remove('dropdown-up');
    }
  }

  handleKeydown(e) {
    if (e.key === 'Escape') {
      this.close();
    }
  }

  clearValidation() {
    const errorElement = document.getElementById('editRole-error');
    if (errorElement) {
      errorElement.style.display = 'none';
    }
    this.input.classList.remove('input-error');
  }

  reset() {
    this.selectedRole = null;
    this.input.value = '';
    this.hiddenInput.value = '';
    this.searchInput.value = '';
    // Asegurar que this.roles sea un array válido antes de copiar
    if (Array.isArray(this.roles)) {
      this.filteredRoles = [...this.roles];
    } else {
      this.filteredRoles = [];
    }
    this.renderOptions();
    this.close();
  }

  getValue() {
    return this.hiddenInput.value;
  }

  setValue(roleId) {
    console.log('CustomEditRoleSelector setValue llamado con:', roleId);
    console.log('Roles disponibles:', this.roles);
    
    if (!Array.isArray(this.roles)) {
      console.log('Roles no es array, inicializando...');
      this.roles = [];
    }
    
    if (!roleId) {
      console.log('No hay roleId, resetear selector');
      this.reset();
      return;
    }
    
    const role = this.roles.find(r => r.id === roleId);
    console.log('Rol encontrado:', role);
    
    if (role) {
      this.selectedRole = role;
      this.input.value = role.displayName;
      this.hiddenInput.value = roleId;
      
      // También sincronizar con el selector nativo
      if (this.nativeSelect) {
        this.nativeSelect.value = roleId;
      }
      
      console.log('Valor establecido correctamente:', {
        input: this.input.value,
        hidden: this.hiddenInput.value,
        native: this.nativeSelect ? this.nativeSelect.value : 'N/A'
      });
    } else {
      console.warn('Rol no encontrado con ID:', roleId);
      // Si no encuentra el rol, intentar establecer directamente en el input nativo
      if (this.nativeSelect) {
        const nativeOption = this.nativeSelect.querySelector(`option[value="${roleId}"]`);
        if (nativeOption) {
          this.input.value = nativeOption.textContent;
          this.hiddenInput.value = roleId;
          this.nativeSelect.value = roleId;
          console.log('Valor establecido desde selector nativo');
        }
      }
    }
  }

  getSelectedRole() {
    return this.selectedRole;
  }
}

// ===== FUNCIONES DE INTERFAZ DE USUARIO =====

// Función para abrir un modal
function openModal(modalId) {
  document.getElementById(modalId).style.display = "flex";
  
  // Resetear mensajes de error al abrir el modal
  if (modalId === 'registerModal') {
    clearValidationErrors('userForm');
    document.getElementById("userForm").reset();
    
    // Resetear selector nativo
    const roleSelect = document.getElementById("rol");
    if (roleSelect) roleSelect.value = "";
    
    // Resetear selector personalizado de rol
    if (customRoleSelector) customRoleSelector.reset();
  } else if (modalId === 'editModal') {
    clearValidationErrors('editForm');
    
    // NO resetear selectores en modal de edición ya que se establecen en fillEditForm
    // Los valores se establecen específicamente en fillEditForm()
    console.log('Abriendo modal de edición - NO resetear selectores');
  }
}

// Función para cerrar un modal
function closeModal(modalId) {
  document.getElementById(modalId).style.display = "none";
}

// Función para establecer validación de campos numéricos - ACTUALIZADA
function setupPhoneNumberValidation() {
  const phoneInputs = document.querySelectorAll('#contact_number, #editContact');
  
  // Validación para teléfonos (solo números)
  phoneInputs.forEach(input => {
    input.addEventListener('keypress', function(e) {
      if (!/^\d$/.test(e.key) && !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.key)) {
        e.preventDefault();
      }
    });
    
    input.addEventListener('input', function() {
      this.value = this.value.replace(/\D/g, '');
    });
  });
}

// ===== FUNCIÓN PRINCIPAL DE RENDERIZADO CON PAGINADO MEJORADO =====
const renderUsersTable = (page = 1) => {
  const tbody = document.getElementById("userTableBody");
  
  if (!tbody) {
    console.error("Elemento userTableBody no encontrado en el DOM");
    return;
  }
  
  tbody.innerHTML = "";

  if (!allUsers || allUsers.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center">
          No hay usuarios disponibles
        </td>
      </tr>
    `;
    renderPaginationControls();
    return;
  }

  // LÓGICA DE PAGINADO: Calcular elementos a mostrar
  const start = (page - 1) * rowsPerPage;
  const end = start + rowsPerPage;
  const usersToShow = allUsers.slice(start, end);

  let tableContent = '';

  // Renderizar solo los elementos de la página actual
  usersToShow.forEach((user, index) => {
    try {
      const userId = user._id || "";
      const userName = user.name || "Sin nombre";
      const userLastname = user.lastname || "Sin apellido";
      const userPhone = user.contact_number || "Sin teléfono";
      const userEmail = user.email || "Sin email";
      
      const roleName = user.role?.displayName || user.role?.name || "No Rol";
      const isCurrentUser = user._id === getCurrentUserId();
      const currentUserClass = isCurrentUser ? 'current-user' : '';
      const status = user.status || "inactive";
      
      tableContent += `
        <tr class="${currentUserClass}" data-id="${userId}" data-index="${index}">
          <td>${userName}</td>
          <td>${userLastname}</td>
          <td>${userPhone}</td>
          <td>${userEmail}</td>
          <td>${roleName}</td>
          <td>
            <label class="switch">
              <input type="checkbox" ${status === "active" ? "checked" : ""} 
                onchange="updateUserStatus('${userId}', this.checked ? 'active' : 'inactive')">
              <span class="slider round"></span>
            </label>
          </td>
          <td>
            <div class="action-buttons">
              <button onclick="fillEditForm('${userId}')" class="icon-button edit-button" title="Editar usuario">
                <i class="material-icons">edit</i>
              </button>
              <button onclick="deleteUser('${userId}')" class="icon-button delete-button" title="Eliminar usuario">
                <i class="material-icons">delete</i>
              </button>
            </div>
          </td>
        </tr>
      `;
    } catch (error) {
      tableContent += `
        <tr>
          <td colspan="7" class="text-center text-danger">
            Error al renderizar este usuario: ${error.message}
          </td>
        </tr>
      `;
    }
  });
  
  tbody.innerHTML = tableContent;
  renderPaginationControls(); // Renderizar controles de paginación
};

// ===== FUNCIÓN DE CONTROLES DE PAGINACIÓN MEJORADA =====
const renderPaginationControls = () => {
  if (!allUsers || allUsers.length === 0) {
    return;
  }
  
  // Calcular total de páginas
  const totalPages = Math.ceil(allUsers.length / rowsPerPage);
  const container = document.querySelector(".page-numbers");
  const info = document.querySelector(".pagination .page-info");
  
  if (!container) return;

  container.innerHTML = "";

  // Botón "Anterior"
  const prevBtn = document.createElement("button");
  prevBtn.classList.add("page-nav");
  prevBtn.innerText = "←";
  prevBtn.disabled = currentPage === 1;
  prevBtn.onclick = () => changePage(currentPage - 1);
  container.appendChild(prevBtn);

  // Lógica para mostrar máximo 5 páginas visibles
  const maxVisiblePages = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
  let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
  
  // Ajustar startPage si estamos cerca del final
  if (endPage - startPage < maxVisiblePages - 1) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }
  
  // Mostrar página 1 si no está en el rango visible
  if (startPage > 1) {
    const btn = document.createElement("div");
    btn.classList.add("page-number");
    btn.innerText = "1";
    btn.onclick = () => changePage(1);
    container.appendChild(btn);
    
    // Agregar puntos suspensivos si hay gap
    if (startPage > 2) {
      const dots = document.createElement("div");
      dots.classList.add("page-dots");
      dots.innerText = "...";
      container.appendChild(dots);
    }
  }
  
  // Mostrar páginas en el rango visible
  for (let i = startPage; i <= endPage; i++) {
    const btn = document.createElement("div");
    btn.classList.add("page-number");
    if (i === currentPage) btn.classList.add("active");
    btn.innerText = i;
    btn.onclick = () => changePage(i);
    container.appendChild(btn);
  }
  
  // Mostrar última página si no está en el rango visible
  if (endPage < totalPages) {
    // Agregar puntos suspensivos si hay gap
    if (endPage < totalPages - 1) {
      const dots = document.createElement("div");
      dots.classList.add("page-dots");
      dots.innerText = "...";
      container.appendChild(dots);
    }
    
    const btn = document.createElement("div");
    btn.classList.add("page-number");
    btn.innerText = totalPages;
    btn.onclick = () => changePage(totalPages);
    container.appendChild(btn);
  }

  // Botón "Siguiente"
  const nextBtn = document.createElement("button");
  nextBtn.classList.add("page-nav");
  nextBtn.innerText = "→";
  nextBtn.disabled = currentPage === totalPages || totalPages === 0;
  nextBtn.onclick = () => changePage(currentPage + 1);
  container.appendChild(nextBtn);

  // Información de paginación (ej: "1-10 de 50")
  if (info) {
    const startItem = allUsers.length > 0 ? (currentPage - 1) * rowsPerPage + 1 : 0;
    const endItem = Math.min(startItem + rowsPerPage - 1, allUsers.length);
    info.innerHTML = `${startItem}-${endItem} de ${allUsers.length}`;
  }
};

// ===== FUNCIÓN PARA CAMBIAR DE PÁGINA =====
const changePage = (page) => {
  currentPage = page;
  renderUsersTable(currentPage);
};

// ===== FUNCIONES DE UTILIDAD =====

// Obtener el ID del usuario actual
const getCurrentUserId = () => {
  try {
    const token = localStorage.getItem("token");
    if (!token) return null;
    
    // Decodificar el token JWT (solo la parte de payload)
    const payload = token.split('.')[1];
    const decoded = JSON.parse(atob(payload));
    return decoded.id || null;
  } catch (error) {
    return null;
  }
};

// Cargar roles desde el backend
const loadRoles = async () => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      showError("Inicie sesión nuevamente.");
      return [];
    }

    const res = await fetch(API_ROLES, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      }
    });

    const data = await res.json();

    if (res.ok) {
      let roles = [];
      if (data.roles && Array.isArray(data.roles)) {
        roles = data.roles;
      } else if (Array.isArray(data)) {
        roles = data;
      } else {
        roles = [];
      }
      
      // Asegurar que roles sea un array válido y filtrar roles activos
      if (!Array.isArray(roles)) {
        roles = [];
      }
      
      const activeRoles = roles.filter(role => role && role.status === "active");
      
      // Cambiar #role por #rol para el selector del formulario de registro
      const roleSelectors = document.querySelectorAll('#rol, #editRole');
      
      roleSelectors.forEach(selector => {
        let defaultOption = null;
        if (selector.options.length > 0) {
          defaultOption = selector.options[0];
        }
        
        selector.innerHTML = '';
        
        if (defaultOption) {
          selector.appendChild(defaultOption);
        } else {
          const option = document.createElement('option');
          option.value = "";
          option.textContent = "Seleccione un rol";
          option.disabled = true;
          option.selected = true;
          selector.appendChild(option);
        }
        
        activeRoles.forEach(role => {
          const option = document.createElement('option');
          option.value = role._id;
          const displayName = role.displayName || getDisplayNameForRole(role.name) || role.name;
          option.textContent = displayName;
          selector.appendChild(option);
        });
      });
      
      // Inicializar selectores personalizados si los contenedores existen
      if (document.getElementById('roleSelectContainer')) {
        customRoleSelector = new CustomRoleSelector('roleSelectContainer');
        customRoleSelector.setRoles(activeRoles);
      }
      
      if (document.getElementById('editRoleSelectContainer')) {
        customEditRoleSelector = new CustomEditRoleSelector('editRoleSelectContainer');
        customEditRoleSelector.setRoles(activeRoles);
      }
      
      return roles;
    } else {
      showError(data.message || "Error al cargar roles.");
      return [];
    }
  } catch (err) {
    showError("Error al cargar roles: " + (err.message || "desconocido"));
    return [];
  }
};

// ===== FUNCIONES DE API =====

// Función interna para cargar usuarios sin indicador de carga
const loadUsersInternal = async () => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      showError("Inicie sesión nuevamente.");
      return;
    }
    
    const res = await fetch(API_URL, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      }
    });
    
    const data = await res.json();
    
    if (res.ok) {
      originalUsers = data.users || data;
      
      // Verificar si originalUsers es un array válido
      if (!Array.isArray(originalUsers)) {
        originalUsers = [];
      }
      
      // Añadir displayName a los roles si no lo tienen
      originalUsers = originalUsers.map(user => {
        if (user.role) {
          if (typeof user.role === 'string') {
            user.role = {
              name: user.role,
              displayName: getDisplayNameForRole(user.role)
            };
          } else if (typeof user.role === 'object' && !user.role.displayName) {
            user.role.displayName = getDisplayNameForRole(user.role.name);
          }
        }
        return user;
      });
      
      allUsers = [...originalUsers];
      currentPage = 1;
      renderUsersTable(currentPage);
      
      // Mostrar mensaje si no hay usuarios
      const tbody = document.getElementById("userTableBody");
      if (tbody && (!tbody.children.length || tbody.innerHTML.trim() === '')) {
        tbody.innerHTML = `
          <tr>
            <td colspan="7" class="text-center">
              No se encontraron usuarios. Puede que necesite agregar un nuevo usuario o revisar su conexión.
            </td>
          </tr>
        `;
      }
    } else {
      showError(data.message || "No tienes permisos para listar usuarios.");
    }
  } catch (err) {
    showError("Error al listar usuarios");
  }
};

// Listar usuarios desde el backend con indicador de carga
const listUsers = async () => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      showError("Inicie sesión nuevamente.");
      return;
    }
    
    showLoadingIndicator();
    
    const res = await fetch(API_URL, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      }
    });
    
    const data = await res.json();
    
    hideLoadingIndicator();
    
    if (res.ok) {
      originalUsers = data.users || data;
      
      // Verificar si originalUsers es un array válido
      if (!Array.isArray(originalUsers)) {
        originalUsers = [];
      }
      
      // Añadir displayName a los roles si no lo tienen
      originalUsers = originalUsers.map(user => {
        if (user.role) {
          if (typeof user.role === 'string') {
            user.role = {
              name: user.role,
              displayName: getDisplayNameForRole(user.role)
            };
          } else if (typeof user.role === 'object' && !user.role.displayName) {
            user.role.displayName = getDisplayNameForRole(user.role.name);
          }
        }
        return user;
      });
      
      allUsers = [...originalUsers];
      currentPage = 1;
      renderUsersTable(currentPage);
      
      // Mostrar mensaje si no hay usuarios
      const tbody = document.getElementById("userTableBody");
      if (tbody && (!tbody.children.length || tbody.innerHTML.trim() === '')) {
        tbody.innerHTML = `
          <tr>
            <td colspan="7" class="text-center">
              No se encontraron usuarios. Puede que necesite agregar un nuevo usuario o revisar su conexión.
            </td>
          </tr>
        `;
      }
    } else {
      showError(data.message || "No tienes permisos para listar usuarios.");
    }
  } catch (err) {
    hideLoadingIndicator();
    showError("Error al listar usuarios");
  }
};

// Registrar usuario
const registerUser = async () => {
  const token = localStorage.getItem("token");
  if (!token) {
    showError("Inicie sesión nuevamente.");
    return;
  }

  const nameValid = validateField("name", "El nombre es obligatorio.");
  const lastnameValid = validateField("lastname", "El apellido es obligatorio.");
  const phoneValid = validatePhone("contact_number");
  const emailValid = validateEmail("email");
  const passwordValid = validatePassword("password");
  const roleValid = validateRole("role");

  if (!nameValid || !lastnameValid || !phoneValid || !emailValid || !passwordValid || !roleValid) {
    return;
  }

  const name = document.getElementById("name").value.trim();
  const lastname = document.getElementById("lastname").value.trim();
  const email = document.getElementById("email").value.trim();
  const contact_number = document.getElementById("contact_number").value.trim();
  const password = document.getElementById("password").value.trim();
  
  // Obtener rol del selector nativo (fuente de verdad)
  const roleField = document.getElementById("rol");
  const role = roleField ? roleField.value : '';

  try {
    const res = await fetch(API_AUTH, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        name, lastname, email, contact_number, password, role
      })
    });

    const data = await res.json();

    if (res.status === 201 || res.ok) {
      if (data.data && data.data.role) {
        const registeredUser = data.data;
        
        if (typeof registeredUser.role === 'string') {
          const roleName = registeredUser.role;
          registeredUser.role = {
            name: roleName,
            displayName: getDisplayNameForRole(roleName)
          };
        } else if (typeof registeredUser.role === 'object' && !registeredUser.role.displayName) {
          registeredUser.role.displayName = getDisplayNameForRole(registeredUser.role.name);
        }
      }

      // Verificar si el email fue enviado
      if (data.emailSent) {
        showSuccess('El usuario ha sido registrado y las credenciales han sido enviadas por correo electrónico');
      } else {
        showSuccess('El usuario ha sido registrado (no se pudo enviar el correo de notificación)');
      }
      
      closeModal('registerModal');
      document.getElementById("userForm").reset();
      loadUsersInternal();
    } else {
      showError(data.message || "Error al registrar usuario.");
    }
  } catch (err) {
    showError("Error al registrar usuario");
  }
};

// Llenar formulario de edición con validación del usuario actual
const fillEditForm = async (id) => {
  const token = localStorage.getItem("token");

  // VALIDACIÓN: Verificar si es el usuario actual
  if (id === getCurrentUserId()) {
    showInfo('No puedes editar tu propia información de usuario desde esta sección. Para cambiar tus datos personales, ve a tu perfil de usuario.');
    return;
  }

  try {
    await loadRoles();
    
    const res = await fetch(`${API_URL}/${id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      }
    });

    const data = await res.json();
    
    if (!res.ok) {
      showError(data.message || "Error al cargar los datos del usuario.");
      return;
    }

    clearValidationErrors('editForm');

    const user = data;
    document.getElementById("editId").value = user._id || "";
    document.getElementById("editName").value = user.name || "";
    document.getElementById("editLastname").value = user.lastname || "";
    document.getElementById("editContact").value = user.contact_number || "";
    document.getElementById("editEmail").value = user.email || "";

    // Establecer rol (nativo primero, luego sincronizar con personalizado)
      if (user.role) {
        const roleId = user.role._id || user.role;
      
      // Establecer en selector nativo
      const roleSelect = document.getElementById("editRole");
      if (roleSelect) {
        roleSelect.value = roleId;

        if (roleSelect.value !== roleId) {
          if (typeof user.role === 'object' && user.role.name) {
            const option = document.createElement('option');
            option.value = roleId;
            option.textContent = user.role.displayName || getDisplayNameForRole(user.role.name) || user.role.name;
            roleSelect.appendChild(option);
            roleSelect.value = roleId;
          }
        }
      }
      
      // Sincronizar con selector personalizado si está disponible (con delay para asegurar que los roles estén cargados)
      if (customEditRoleSelector) {
        // Intentar establecer el valor con reintentos
        const setValueWithRetry = (attempts = 0) => {
          console.log(`Intento ${attempts + 1} de establecer valor en selector personalizado:`, roleId);
          
          if (customEditRoleSelector && Array.isArray(customEditRoleSelector.roles) && customEditRoleSelector.roles.length > 0) {
            customEditRoleSelector.setValue(roleId);
          } else if (attempts < 3) {
            console.log('Roles aún no cargados, reintentando...');
            setTimeout(() => setValueWithRetry(attempts + 1), 200);
      } else {
            console.error('No se pudo establecer el valor después de varios intentos');
          }
        };
        
        setTimeout(() => setValueWithRetry(), 200);
      }
    } else {
      // Resetear ambos selectores
      const roleSelect = document.getElementById("editRole");
      if (roleSelect) {
        roleSelect.value = "";
      }
      
      if (customEditRoleSelector) {
        customEditRoleSelector.reset();
      }
    }

    openModal("editModal");
  } catch (err) {
    showError(`Ocurrió un error: ${err.message || err}`);
  }
};

// Actualizar usuario
const updateUser = async () => {
  const token = localStorage.getItem("token");
  if (!token) {
    showError("Inicie sesión nuevamente.");
    return;
  }
  
  const nameValid = validateField("editName", "El nombre es obligatorio.");
  const lastnameValid = validateField("editLastname", "El apellido es obligatorio.");
  const phoneValid = validatePhone("editContact");
  const emailValid = validateEmail("editEmail");
  const roleValid = validateRole("editRole");

  if (!nameValid || !lastnameValid || !phoneValid || !emailValid || !roleValid) {
    return;
  }
  
  const id = document.getElementById("editId").value;
  const name = document.getElementById("editName").value.trim();
  const lastname = document.getElementById("editLastname").value.trim();
  const contact_number = document.getElementById("editContact").value.trim();
  const email = document.getElementById("editEmail").value.trim();
  
  // Obtener rol del selector nativo (fuente de verdad)
  const roleSelect = document.getElementById("editRole");
  const role = roleSelect ? roleSelect.value : '';
  
  const userData = { 
    name, lastname, email, contact_number
  };

  if (role) {
    userData.role = role;
  }
    
  try {
    const res = await fetch(`${API_URL}/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(userData)
    });
    
    let data;
    try {
      data = await res.json();
    } catch (jsonError) {
      data = { message: "Error en formato de respuesta" };
    }
    
    if (res.ok) {
      if (data.user && data.user.role) {
        const updatedUser = data.user;
        
        if (typeof updatedUser.role === 'string') {
          const roleName = updatedUser.role;
          updatedUser.role = {
            name: roleName,
            displayName: getDisplayNameForRole(roleName)
          };
        } else if (typeof updatedUser.role === 'object' && !updatedUser.role.displayName) {
          updatedUser.role.displayName = getDisplayNameForRole(updatedUser.role.name);
        }
        
        const userIndex = allUsers.findIndex(u => u._id === id);
        if (userIndex !== -1) {
          allUsers[userIndex] = { ...allUsers[userIndex], ...updatedUser };
          renderUsersTable(currentPage);
        }
      }
      
      showSuccess('El usuario ha sido actualizado');
      closeModal("editModal");
      document.getElementById("editForm").reset();
      
      // Resetear selector nativo explícitamente
      const editRoleSelect = document.getElementById("editRole");
      if (editRoleSelect) editRoleSelect.value = "";
      
      loadUsersInternal();
    } else {
      let errorMsg = data.message || `Error al actualizar el usuario (${res.status})`;
      if (data.error) {
        errorMsg += `: ${data.error}`;
      }
      showError(errorMsg);
    }
  } catch (err) {
    showError(`Ocurrió un error de red: ${err.message || err}`);
  }
};

// Actualizar estado de usuario con validación
const updateUserStatus = async (id, status) => {
  const token = localStorage.getItem("token");
  if (!token) {
    showError("Inicie sesión nuevamente.");
    return;
  }
  
  if (id === getCurrentUserId() && status === 'inactive') {
    showInfo('No puedes desactivar tu propia cuenta mientras te encuetres activo en el sistema.');
    
    setTimeout(() => {
      const switchElement = document.querySelector(`input[type="checkbox"][onchange*="${id}"]`);
      if (switchElement) switchElement.checked = true;
    }, 100);
    
    return;
  }
  
  try {
    const res = await fetch(`${API_URL}/${id}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ status })
    });
    
    let data;
    try {
      data = await res.json();
    } catch (jsonError) {
      data = { message: "Error en formato de respuesta" };
    }
    
    if (res.ok) {
      showSuccess(`El usuario ha sido ${status === 'active' ? 'activado' : 'desactivado'}`);
      loadUsersInternal();
    } else {
      let errorMsg = data.message || `Error al ${status === 'active' ? 'activar' : 'desactivar'} el usuario (${res.status})`;
      if (data.error) {
        errorMsg += `: ${data.error}`;
      }
      showError(errorMsg);
      loadUsersInternal();
    }
  } catch (err) {
    showError(`Ocurrió un error de red: ${err.message || err}`);
    loadUsersInternal();
  }
};

// Eliminar usuario con validación
const deleteUser = async (id) => {
  const token = localStorage.getItem("token");

  // VALIDACIÓN: Verificar si es el usuario actual
  if (id === getCurrentUserId()) {
    showInfo('No puedes eliminar tu propia cuenta.');
    return;
  }

  const confirmed = await showConfirm({ 
    title: "¿Estás seguro de eliminar este usuario?", 
    text: "Esta acción no se puede deshacer.", 
    confirmText: "Eliminar", 
    cancelText: "Cancelar" 
  });

  if (!confirmed) return;

  try {
    const res = await fetch(`${API_URL}/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await res.json();

    if (res.ok) {
       showSuccess('El usuario ha sido eliminado');
      loadUsersInternal();
    } else {
      showError(data.message || "No se pudo eliminar el usuario");
    }
  } catch (err) {
    showError("Error al eliminar usuario");
  }
};

// ===== FUNCIÓN DE BÚSQUEDA CON PAGINADO =====
const searchUser = () => {
  const searchInput = document.getElementById("searchInput");
  
  if (!searchInput) {
    console.error("Elemento searchInput no encontrado");
    return;
  }
  
  const term = searchInput.value.toLowerCase().trim();
  
  if (!originalUsers) {
    console.error("Array originalUsers no inicializado");
    return;
  }
  
  if (!term) {
    allUsers = [...originalUsers];
  } else {
    // Filtrar usuarios según el término de búsqueda
    allUsers = originalUsers.filter(user => {
      const nameMatch = user.name && user.name.toLowerCase().includes(term);
      const lastnameMatch = user.lastname && user.lastname.toLowerCase().includes(term);
      const emailMatch = user.email && user.email.toLowerCase().includes(term);
      const phoneMatch = user.contact_number && user.contact_number.includes(term);
      const roleMatch = user.role && (
        (user.role.name && user.role.name.toLowerCase().includes(term)) ||
        (user.role.displayName && user.role.displayName.toLowerCase().includes(term))
      );
      
      return nameMatch || lastnameMatch || emailMatch || phoneMatch || roleMatch;
    });
  }
  
  // Resetear a la primera página después de una búsqueda
  currentPage = 1;
  renderUsersTable(currentPage);
};

function hideLoadingIndicator() {
  Swal.close();
}

// ===== EVENTOS =====

document.addEventListener("DOMContentLoaded", async () => {
  disableNativeBrowserValidation();
  setupPhoneNumberValidation();
  
  // Cargar roles primero para asegurar que los selectores estén poblados
  try {
    await loadRoles();
  } catch (error) {
    // Manejo silencioso del error
  }
  
  // Luego cargar los usuarios
  try {
    await listUsers();
  } catch (error) {
    // Manejo silencioso del error
  }
  
  // Configurar botones y eventos
  const mobileAddButton = document.getElementById("mobileAddButton");
  if (mobileAddButton) {
    mobileAddButton.onclick = async () => {
      // Recargar roles antes de abrir el modal para asegurar que estén actualizados
      await loadRoles();
      openModal('registerModal');
    };
  }
  
 const addUserButton = document.getElementById("addUserButton");
  if (addUserButton) {
    addUserButton.onclick = async () => {
      await loadRoles();
      openModal('registerModal');
    };
  }
  
  const registerButton = document.getElementById("registerButton");
  if (registerButton) {
    registerButton.onclick = registerUser;
  }
  
  const updateButton = document.getElementById("updateButton");
  if (updateButton) {
    updateButton.onclick = updateUser;
  }
  
  const searchInput = document.getElementById("searchInput");
  if (searchInput) {
    searchInput.addEventListener("keyup", searchUser);
  }

  // Validación para formulario de registro
  const nameInput = document.getElementById("name");
  if (nameInput) {
    nameInput.addEventListener("blur", () => validateField("name", "El nombre es obligatorio."));
  }
  
  const lastnameInput = document.getElementById("lastname");
  if (lastnameInput) {
    lastnameInput.addEventListener("blur", () => validateField("lastname", "El apellido es obligatorio."));
  }
  
  const contactInput = document.getElementById("contact_number");
  if (contactInput) {
    contactInput.addEventListener("blur", () => validatePhone("contact_number"));
  }
  
  const emailInput = document.getElementById("email");
  if (emailInput) {
    emailInput.addEventListener("blur", () => validateEmail("email"));
  }
  
  const passwordInput = document.getElementById("password");
  if (passwordInput) {
    passwordInput.addEventListener("blur", () => validatePassword("password"));
  }
  
  // Usar 'rol' en lugar de 'role' para el selector del formulario de registro
  const rolSelector = document.getElementById("rol");
  if (rolSelector) {
    rolSelector.addEventListener("change", () => validateRole("role"));
  }
  
  // Validación para formulario de edición
  const editNameInput = document.getElementById("editName");
  if (editNameInput) {
    editNameInput.addEventListener("blur", () => validateField("editName", "El nombre es obligatorio."));
  }
  
  const editLastnameInput = document.getElementById("editLastname");
  if (editLastnameInput) {
    editLastnameInput.addEventListener("blur", () => validateField("editLastname", "El apellido es obligatorio."));
  }
  
  const editContactInput = document.getElementById("editContact");
  if (editContactInput) {
    editContactInput.addEventListener("blur", () => validatePhone("editContact"));
  }
  
  const editEmailInput = document.getElementById("editEmail");
  if (editEmailInput) {
    editEmailInput.addEventListener("blur", () => validateEmail("editEmail"));
  }
  
  const editRoleInput = document.getElementById("editRole");
  if (editRoleInput) {
    editRoleInput.addEventListener("change", () => validateRole("editRole"));
  }

  const editForm = document.getElementById("editForm");
  if (editForm) {
    editForm.onsubmit = async (event) => {
      event.preventDefault();
      await updateUser();
    };
  }
});

// Exportar funciones globales
window.fillEditForm = fillEditForm;
window.deleteUser = deleteUser;
window.updateUserStatus = updateUserStatus;
window.openModal = openModal;
window.closeModal = closeModal;
window.changePage = changePage;