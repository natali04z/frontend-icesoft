// ===== MÓDULO DE EXPORTACIONES PARA COMPRAS - VERSIÓN COMPLETA MEJORADA =====

// Función para cargar las librerías necesarias
function loadExportLibraries() {
  return new Promise((resolve, reject) => {
    let scriptsToLoad = 0;
    let scriptsLoaded = 0;

    function checkComplete() {
      scriptsLoaded++;
      if (scriptsLoaded === scriptsToLoad) {
        // Pequeña pausa para asegurar que las librerías estén completamente cargadas
        setTimeout(resolve, 100);
      }
    }

    // Cargar jsPDF para PDF
    if (!window.jsPDF) {
      scriptsToLoad++;
      const jsPDFScript = document.createElement('script');
      jsPDFScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
      jsPDFScript.onload = checkComplete;
      jsPDFScript.onerror = () => reject(new Error('Error al cargar jsPDF'));
      document.head.appendChild(jsPDFScript);
    }

    // Cargar jsPDF AutoTable para tablas
    if (!window.jsPDF || !window.jsPDF.API || !window.jsPDF.API.autoTable) {
      scriptsToLoad++;
      const autoTableScript = document.createElement('script');
      autoTableScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.31/jspdf.plugin.autotable.min.js';
      autoTableScript.onload = checkComplete;
      autoTableScript.onerror = () => reject(new Error('Error al cargar AutoTable'));
      document.head.appendChild(autoTableScript);
    }

    // Cargar SheetJS para Excel
    if (!window.XLSX) {
      scriptsToLoad++;
      const xlsxScript = document.createElement('script');
      xlsxScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
      xlsxScript.onload = checkComplete;
      xlsxScript.onerror = () => reject(new Error('Error al cargar XLSX'));
      document.head.appendChild(xlsxScript);
    }

    if (scriptsToLoad === 0) {
      resolve();
    }
  });
}

// Función para obtener datos de compras con filtros
function getFilteredPurchasesData(searchTerm = '', dateFrom = '', dateTo = '', providerFilter = '', statusFilter = '') {
  let filteredPurchases = [...originalPurchases];

  // Filtro por término de búsqueda
  if (searchTerm) {
    const term = searchTerm.toLowerCase().trim();
    filteredPurchases = filteredPurchases.filter(p => {
      const providerMatch = 
        (p.provider?.company && p.provider.company.toLowerCase().includes(term)) ||
        (p.proveedor?.company && p.proveedor.company.toLowerCase().includes(term)) ||
        (typeof p.provider === 'string' && providerIdToNameMap[p.provider] && providerIdToNameMap[p.provider].toLowerCase().includes(term)) ||
        (typeof p.proveedor === 'string' && providerIdToNameMap[p.proveedor] && providerIdToNameMap[p.proveedor].toLowerCase().includes(term));
      
      const productsMatch = 
        (p.products && Array.isArray(p.products) && p.products.some(item => {
          if (item.product?.name) {
            return item.product.name.toLowerCase().includes(term);
          } else if (productIdToNameMap[item.product]) {
            return productIdToNameMap[item.product].toLowerCase().includes(term);
          }
          return false;
        })) ||
        (p.productos && Array.isArray(p.productos) && p.productos.some(item => {
          if (item.producto?.name) {
            return item.producto.name.toLowerCase().includes(term);
          } else if (productIdToNameMap[item.producto]) {
            return productIdToNameMap[item.producto].toLowerCase().includes(term);
          }
          return false;
        }));
      
      return providerMatch || productsMatch || (p.id && p.id.toLowerCase().includes(term));
    });
  }

  // Filtro por rango de fechas
  if (dateFrom || dateTo) {
    filteredPurchases = filteredPurchases.filter(p => {
      const purchaseDate = new Date(p.purchase_date || p.fecha_compra || p.purchaseDate);
      if (isNaN(purchaseDate.getTime())) return false;
      
      if (dateFrom && purchaseDate < new Date(dateFrom)) return false;
      if (dateTo && purchaseDate > new Date(dateTo)) return false;
      
      return true;
    });
  }

  // Filtro por proveedor
  if (providerFilter) {
    filteredPurchases = filteredPurchases.filter(p => {
      const providerId = p.provider?._id || p.provider || p.proveedor?._id || p.proveedor;
      return providerId === providerFilter;
    });
  }

  // Filtro por estado
  if (statusFilter) {
    filteredPurchases = filteredPurchases.filter(p => {
      const status = p.status || p.estado || 'active';
      return status === statusFilter;
    });
  }

  return filteredPurchases;
}

// Función para preparar datos para exportación
function prepareExportData(purchases) {
  return purchases.map((purchase, index) => {
    const purchaseId = purchase._id || "";
    const displayId = purchase.id || purchaseId || `Pu${String(index + 1).padStart(2, '0')}`;
    
    let providerName = "Sin Proveedor";
    if (purchase.provider) {
      if (typeof purchase.provider === 'object' && purchase.provider.company) {
        providerName = purchase.provider.company;
      } else {
        providerName = getProviderNameById(purchase.provider);
      }
    } else if (purchase.proveedor) {
      if (typeof purchase.proveedor === 'object' && purchase.proveedor.company) {
        providerName = purchase.proveedor.company;
      } else {
        providerName = getProviderNameById(purchase.proveedor);
      }
    }
    
    const purchaseDate = purchase.purchase_date || purchase.fecha_compra || purchase.purchaseDate;
    const status = purchase.status || purchase.estado || "active";
    const total = purchase.total || 0;
    
    // Obtener productos
    let products = [];
    if (purchase.products && Array.isArray(purchase.products)) {
      products = purchase.products;
    } else if (purchase.productos && Array.isArray(purchase.productos)) {
      products = purchase.productos.map(item => ({
        product: item.producto,
        quantity: item.cantidad,
        purchase_price: item.precio_compra,
        total: item.total
      }));
    }
    
    // Crear lista de productos para PDF (sin cantidades)
    const productsList = products.map(item => {
      const productName = item.product?.name || getProductNameById(item.product?._id || item.product);
      return productName;
    }).join('\n');
    
    // Calcular cantidad total de productos
    const totalQuantity = products.reduce((sum, item) => sum + (item.quantity || 0), 0);
    
    // Lista detallada para Excel
    const productsDetailedList = products.map(item => {
      const productName = item.product?.name || getProductNameById(item.product?._id || item.product);
      return `${productName} - Cant: ${item.quantity} - Precio: ${formatCurrency(item.purchase_price)} - Total: ${formatCurrency(item.total)}`;
    }).join(' | ');
    
    const statusTranslation = {
      'active': 'Activa',
      'inactive': 'Inactiva'
    };
    
    return {
      id: displayId,
      proveedor: providerName,
      fecha: formatDate(purchaseDate),
      productos: productsList,
      cantidad: totalQuantity,
      productosDetallados: productsDetailedList,
      total: total,
      totalFormatted: formatCurrency(total),
      estado: statusTranslation[status] || status,
      rawDate: purchaseDate,
      productCount: products.length,
      productItems: products
    };
  });
}

// ===== EXPORTACIÓN A PDF MEJORADA =====
async function exportToPDF(filters = {}) {
  try {
    showLoadingIndicator();
    
    // Cargar librerías necesarias
    await loadExportLibraries();
    
    // VERIFICAR Y CARGAR jsPDF
    let jsPDF;
    
    if (window.jsPDF) {
      jsPDF = window.jsPDF;
    } else if (window.jspdf && window.jspdf.jsPDF) {
      jsPDF = window.jspdf.jsPDF;
      window.jsPDF = jsPDF;
    } else {
      throw new Error('jsPDF no está disponible');
    }
    
    // Verificar que autoTable esté disponible
    if (!jsPDF.API || !jsPDF.API.autoTable) {
      throw new Error('jsPDF AutoTable no está disponible');
    }
    
    const doc = new jsPDF();
    
    doc.setFont('helvetica');
    
    // Obtener datos filtrados
    const filteredPurchases = getFilteredPurchasesData(
      filters.searchTerm,
      filters.dateFrom,
      filters.dateTo,
      filters.providerFilter,
      filters.statusFilter
    );
    
    const exportData = prepareExportData(filteredPurchases);
    
    // Configuración del documento
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 20;
    let yPosition = margin;
    
    // Encabezado profesional
    doc.setFillColor(27, 43, 64);
    doc.rect(0, 0, pageWidth, 30, 'F');

    // Agregar logo de ICESOFT (opcional)
    try {
      doc.addImage('assets/icesoft.png', 'PNG', 5, 5, 20, 20);
    } catch (error) {
      console.warn('No se pudo cargar el logo ICESOFT:', error);
    }

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('REPORTE DE COMPRAS', 30, 20);
    yPosition = 45;
    doc.setTextColor(0, 0, 0);

    // Fecha y hora
    doc.setTextColor(240, 240, 240);
    doc.setFontSize(10);
    const now = new Date();
    doc.text(`Generado: ${now.toLocaleDateString('es-ES')} ${now.toLocaleTimeString('es-ES')}`, 
            pageWidth - margin, 20, { align: 'right' });

    yPosition = 50;
    doc.setTextColor(0, 0, 0);
    
    // Filtros aplicados
    if (filters.searchTerm || filters.dateFrom || filters.dateTo || filters.providerFilter || filters.statusFilter) {
      doc.setFont('helvetica', 'bold');
      doc.text('FILTROS APLICADOS:', margin, yPosition);
      yPosition += 10;
      doc.setFont('helvetica', 'normal');
      
      if (filters.searchTerm) {
        doc.text(`• Término de búsqueda: ${filters.searchTerm}`, margin + 5, yPosition);
        yPosition += 8;
      }
      if (filters.dateFrom || filters.dateTo) {
        const dateRange = `${filters.dateFrom || 'Sin límite'} hasta ${filters.dateTo || 'Sin límite'}`;
        doc.text(`• Rango de fechas: ${dateRange}`, margin + 5, yPosition);
        yPosition += 8;
      }
      if (filters.providerFilter) {
        const providerName = getProviderNameById(filters.providerFilter) || 'Proveedor no encontrado';
        doc.text(`• Proveedor: ${providerName}`, margin + 5, yPosition);
        yPosition += 8;
      }
      if (filters.statusFilter) {
        const statusNames = {
          'active': 'Activa', 
          'inactive': 'Inactiva'
        };
        doc.text(`• Estado: ${statusNames[filters.statusFilter] || filters.statusFilter}`, margin + 5, yPosition);
        yPosition += 8;
      }
      yPosition += 10;
    }
    
    // Resumen estadístico
    const totalAmount = exportData.reduce((sum, item) => sum + (item.total || 0), 0);
    const activeCount = exportData.filter(item => item.estado === 'Activa').length;
    const inactiveCount = exportData.filter(item => item.estado === 'Inactiva').length;
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('RESUMEN ESTADÍSTICO', margin, yPosition);
    yPosition += 15;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Compras activas: ${activeCount}`, margin, yPosition);
    yPosition += 8;
    doc.text(`Compras inactivas: ${inactiveCount}`, margin, yPosition);
    yPosition += 8;
    doc.text(`Total general: ${formatCurrency(totalAmount)}`, margin, yPosition);
    yPosition += 25;
    
    // TABLA PRINCIPAL DE COMPRAS
    if (exportData.length > 0) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('DETALLE DE COMPRAS', margin, yPosition);
      yPosition += 15;
      
      // Preparar datos para la tabla
      const tableData = exportData.map((purchase) => [
        purchase.id || '',
        purchase.proveedor || '',
        purchase.fecha || '',
        purchase.productos || '',
        purchase.cantidad || 0,
        purchase.totalFormatted || '',
        purchase.estado || ''
      ]);
      
      // Configurar tabla con autoTable
      doc.autoTable({
        startY: yPosition,
        head: [['ID', 'Proveedor', 'Fecha', 'Productos', 'Cantidad', 'Total', 'Estado']],
        body: tableData,
        theme: 'striped',
        styles: {
          fontSize: 8,
          font: 'helvetica',
          cellPadding: 4,
          valign: 'middle',
          halign: 'center',
          lineColor: [200, 200, 200],
          lineWidth: 0.1
        },
        headStyles: {
          fillColor: [27, 43, 64],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 9,
          halign: 'center',
          valign: 'middle'
        },
        columnStyles: {
          0: { 
            cellWidth: 15, 
            halign: 'center',
            valign: 'middle'
          },
          1: { 
            cellWidth: 35, 
            halign: 'left',
            valign: 'middle'
          },
          2: { 
            cellWidth: 20, 
            halign: 'center',
            valign: 'middle'
          },
          3: { 
            cellWidth: 35, 
            halign: 'left',
            valign: 'top',
            fontSize: 7
          },
          4: { 
            cellWidth: 25, 
            halign: 'center',
            valign: 'middle'
          },
          5: { 
            cellWidth: 25, 
            halign: 'right',
            valign: 'middle'
          },
          6: { 
            cellWidth: 20, 
            halign: 'center',
            valign: 'middle'
          }
        },
        margin: { left: margin, right: margin },
        alternateRowStyles: {
          fillColor: [248, 249, 250]
        },
        tableWidth: 'auto',
        tableLineColor: [200, 200, 200],
        tableLineWidth: 0.1,
        didParseCell: function(data) {
          if (data.column.index === 3 && data.cell.text && data.cell.text.length > 0) {
            const lines = data.cell.text.join(' ').split('\n');
            if (lines.length > 1) {
              data.cell.styles.minCellHeight = lines.length * 8;
            }
          }
        },
        margin: { 
          left: (pageWidth - 175) / 2,
          right: (pageWidth - 175) / 2
        }
      });
      
      yPosition = doc.lastAutoTable.finalY + 10;
    } else {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(12);
      const noDataText = 'No se encontraron compras con los filtros aplicados.';
      const textWidth = doc.getTextWidth(noDataText);
      doc.text(noDataText, (pageWidth - textWidth) / 2, yPosition);
    }
    
    // Pie de página
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.5);
      doc.line(margin, pageHeight - 25, pageWidth - margin, pageHeight - 25);
      
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      
      const footerY = pageHeight - 15;
      doc.text('ICESOFT - Sistema de Gestión', margin, footerY);
      doc.text(`Página ${i} de ${totalPages}`, pageWidth - margin, footerY, { align: 'right' });
      
      doc.setFontSize(7);
      const footerDate = new Date().toLocaleDateString('es-ES', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      doc.text(footerDate, pageWidth / 2, footerY, { align: 'center' });
    }
    
    // GUARDAR ARCHIVO
    const fileName = `Compras_${new Date().toISOString().split('T')[0]}_${Date.now()}.pdf`;
    doc.save(fileName);
    
    hideLoadingIndicator();
    showSuccess(`PDF generado exitosamente: ${fileName}`);
    
  } catch (error) {
    hideLoadingIndicator();
    showError(`Error al generar PDF: ${error.message}`);
    console.error('Error completo:', error);
  }
}

// ===== EXPORTACIÓN A EXCEL CON DISEÑO VISUAL MEJORADO =====
async function exportToExcel(filters = {}) {
  try {
    showLoadingIndicator();
    await loadExportLibraries();
    
    // Obtener datos filtrados
    const filteredPurchases = getFilteredPurchasesData(
      filters.searchTerm,
      filters.dateFrom,
      filters.dateTo,
      filters.providerFilter,
      filters.statusFilter
    );
    
    const exportData = prepareExportData(filteredPurchases);
    
    // Crear nuevo workbook
    const wb = XLSX.utils.book_new();
    
    // ===== HOJA 1: RESUMEN EJECUTIVO CON DISEÑO PROFESIONAL =====
    const currentDate = new Date();
    
    // Crear array de datos con formato estructurado
    const summaryData = [];
    
    // ENCABEZADO PRINCIPAL
    summaryData.push(['REPORTE DE COMPRAS - ICESOFT', '', '', '']);
    summaryData.push(['RESUMEN EJECUTIVO', '', '', '']);
    summaryData.push(['', '', '', '']);
    
    // INFORMACIÓN GENERAL EN FORMATO DE TABLA
    summaryData.push(['INFORMACIÓN GENERAL', '', '', '']);
    summaryData.push(['Sistema:', 'ICESOFT - Gestión Empresarial', '', '']);
    summaryData.push(['Fecha de generación:', currentDate.toLocaleDateString('es-ES'), '', '']);
    summaryData.push(['Hora de generación:', currentDate.toLocaleTimeString('es-ES'), '', '']);
    summaryData.push(['Total de registros:', exportData.length, '', '']);
    summaryData.push(['', '', '', '']);
    
    // FILTROS APLICADOS
    summaryData.push(['FILTROS APLICADOS', '', '', '']);
    if (filters.searchTerm) {
      summaryData.push(['Término de búsqueda:', filters.searchTerm, '', '']);
    }
    if (filters.dateFrom || filters.dateTo) {
      const dateRange = `${filters.dateFrom || 'Sin límite'} - ${filters.dateTo || 'Sin límite'}`;
      summaryData.push(['Rango de fechas:', dateRange, '', '']);
    }
    if (filters.providerFilter) {
      summaryData.push(['Proveedor:', getProviderNameById(filters.providerFilter), '', '']);
    }
    if (filters.statusFilter) {
      const statusNames = {
        'active': 'Activa',
        'inactive': 'Inactiva'
      };
      summaryData.push(['Estado:', statusNames[filters.statusFilter] || filters.statusFilter, '', '']);
    }
    summaryData.push(['', '', '', '']);
    
    // RESUMEN FINANCIERO CON FORMATO DESTACADO
    const totalAmount = exportData.reduce((sum, item) => sum + item.total, 0);
    const avgAmount = totalAmount / (exportData.length || 1);
    
    summaryData.push(['RESUMEN FINANCIERO', '', '', '']);
    summaryData.push(['Total General:', '', formatCurrency(totalAmount), '']);
    summaryData.push(['Promedio por Compra:', '', formatCurrency(avgAmount), '']);
    summaryData.push(['', '', '', '']);
    
    // ESTADÍSTICAS POR ESTADO
    const activeCount = exportData.filter(item => item.estado === 'Activa').length;
    const inactiveCount = exportData.filter(item => item.estado === 'Inactiva').length;
    const activeRate = ((activeCount / exportData.length) * 100).toFixed(1);
    
    summaryData.push(['ESTADÍSTICAS POR ESTADO', '', '', '']);
    summaryData.push(['Estado', 'Cantidad', 'Porcentaje', '']);
    summaryData.push(['Activas', activeCount, `${((activeCount / exportData.length) * 100).toFixed(1)}%`, '']);
    summaryData.push(['Inactivas', inactiveCount, `${((inactiveCount / exportData.length) * 100).toFixed(1)}%`, '']);
    summaryData.push(['', '', '', '']);
    summaryData.push(['TASA DE ACTIVIDAD:', '', `${activeRate}%`, '']);
    
    // Crear hoja de resumen
    const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
    
    // APLICAR ESTILOS PROFESIONALES AL RESUMEN
    const summaryStyles = {};
    
    // Combinar celdas para el título
    summaryWs['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } }, // Título principal
      { s: { r: 1, c: 0 }, e: { r: 1, c: 3 } }, // Subtítulo
    ];
    
    // Configurar ancho de columnas
    summaryWs['!cols'] = [
      { width: 25 }, // Columna A - Etiquetas
      { width: 35 }, // Columna B - Valores
      { width: 20 }, // Columna C - Montos/Porcentajes
      { width: 15 }  // Columna D - Extra
    ];
    
    XLSX.utils.book_append_sheet(wb, summaryWs, 'Resumen Ejecutivo');
    
    // ===== HOJA 2: DATOS PRINCIPALES CON FORMATO PROFESIONAL =====
    if (exportData.length > 0) {
      const detailData = exportData.map((purchase, index) => ({
        'ID': purchase.id,
        'Proveedor': purchase.proveedor,
        'Fecha': purchase.fecha,
        'Productos': purchase.productosDetallados,
        'Items': purchase.productCount,
        'Cantidad': purchase.cantidad,
        'Total': purchase.total,
        'Estado': purchase.estado,
        'Observaciones': purchase.estado === 'Activa' ? 'Compra vigente' : 
                        purchase.estado === 'Inactiva' ? 'Requiere revisión' : 'En proceso'
      }));
      
      const detailWs = XLSX.utils.json_to_sheet(detailData);
      
      // Configurar ancho de columnas optimizado
      detailWs['!cols'] = [
        { width: 12 }, // ID
        { width: 25 }, // Proveedor
        { width: 12 }, // Fecha
        { width: 40 }, // Productos
        { width: 8 },  // Items
        { width: 10 }, // Cantidad
        { width: 15 }, // Total
        { width: 12 }, // Estado
        { width: 20 }  // Observaciones
      ];
      
      XLSX.utils.book_append_sheet(wb, detailWs, 'Datos Principales');
    }
    
    // ===== HOJA 3: ANÁLISIS POR PROVEEDOR CON GRÁFICOS VISUALES =====
    if (exportData.length > 0) {
      const providerStats = {};
      
      exportData.forEach(purchase => {
        const provider = purchase.proveedor;
        if (!providerStats[provider]) {
          providerStats[provider] = {
            totalCompras: 0,
            montoTotal: 0,
            comprasActivas: 0,
            comprasInactivas: 0,
            productos: new Set()
          };
        }
        
        providerStats[provider].totalCompras++;
        providerStats[provider].montoTotal += purchase.total;
        
        if (purchase.productItems && Array.isArray(purchase.productItems)) {
          purchase.productItems.forEach(product => {
            const productName = product.product?.name || getProductNameById(product.product?._id || product.product);
            providerStats[provider].productos.add(productName);
          });
        }
        
        switch(purchase.estado) {
          case 'Activa':
            providerStats[provider].comprasActivas++;
            break;
          case 'Inactiva':
            providerStats[provider].comprasInactivas++;
            break;
        }
      });
      
      const totalAmount = exportData.reduce((sum, item) => sum + item.total, 0);
      
      const providerAnalysis = Object.entries(providerStats).map(([provider, stats]) => {
        const activeRate = ((stats.comprasActivas / stats.totalCompras) * 100).toFixed(1);
        const participation = ((stats.montoTotal / totalAmount) * 100).toFixed(1);
        
        return {
          'Proveedor': provider,
          'Total Compras': stats.totalCompras,
          'Monto Total': stats.montoTotal,
          'Activas': stats.comprasActivas,
          'Inactivas': stats.comprasInactivas,
          'Promedio/Compra': Math.round(stats.montoTotal / stats.totalCompras),
          'Productos Únicos': stats.productos.size,
          '% Participación': `${participation}%`,
          'Tasa Actividad': `${activeRate}%`,
          'Calificación': activeRate >= 80 ? 'EXCELENTE' : 
                           activeRate >= 60 ? 'BUENO' : 
                           activeRate >= 40 ? 'REGULAR' : 'MEJORAR'
        };
      });
      
      // Ordenar por monto total descendente
      providerAnalysis.sort((a, b) => b['Monto Total'] - a['Monto Total']);
      
      const providerWs = XLSX.utils.json_to_sheet(providerAnalysis);
      
      // Configurar anchos de columna
      providerWs['!cols'] = [
        { width: 25 }, // Proveedor
        { width: 12 }, // Total Compras
        { width: 15 }, // Monto Total
        { width: 12 }, // Activas
        { width: 12 }, // Inactivas
        { width: 15 }, // Promedio
        { width: 15 }, // Productos Únicos
        { width: 15 }, // Participación
        { width: 12 }, // Tasa Actividad
        { width: 15 }  // Calificación
      ];
      
      XLSX.utils.book_append_sheet(wb, providerWs, 'Análisis Proveedores');
    }
    
    // ===== HOJA 4: DASHBOARD DE TENDENCIAS =====
    if (exportData.length > 0) {
      // Crear encabezado del dashboard
      const dashboardData = [];
      dashboardData.push(['DASHBOARD DE TENDENCIAS TEMPORALES', '', '', '', '', '']);
      dashboardData.push(['', '', '', '', '', '']);
      
      // Agregar análisis mensual
      const monthlyStats = {};
      exportData.forEach(purchase => {
        const date = new Date(purchase.rawDate);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const monthName = date.toLocaleDateString('es-ES', { year: 'numeric', month: 'long' });
        
        if (!monthlyStats[monthKey]) {
          monthlyStats[monthKey] = {
            name: monthName,
            compras: 0,
            total: 0,
            activas: 0,
            inactivas: 0
          };
        }
        
        monthlyStats[monthKey].compras++;
        monthlyStats[monthKey].total += purchase.total;
        if (purchase.estado === 'Activa') monthlyStats[monthKey].activas++;
        if (purchase.estado === 'Inactiva') monthlyStats[monthKey].inactivas++;
      });
      
      // Encabezados de la tabla
      dashboardData.push(['Período', 'Compras', 'Total', 'Activas', 'Inactivas', 'Tasa Actividad', 'Rendimiento']);
      
      const trendsData = Object.entries(monthlyStats)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, stats]) => {
          const activeRate = ((stats.activas / stats.compras) * 100).toFixed(1);
          const performance = stats.compras > 10 ? 'ALTO' : 
                            stats.compras > 5 ? 'MEDIO' : 
                            'BAJO';
          
          return [
            stats.name,
            stats.compras,
            stats.total,
            stats.activas,
            stats.inactivas,
            `${activeRate}%`,
            performance
          ];
        });
      
      // Agregar datos a la tabla
      trendsData.forEach(row => dashboardData.push(row));
      
      // Agregar resumen final
      dashboardData.push(['', '', '', '', '', '', '']);
      dashboardData.push(['RESUMEN GENERAL', '', '', '', '', '', '']);
      
      const totalCompras = trendsData.reduce((sum, row) => sum + row[1], 0);
      const totalMonto = trendsData.reduce((sum, row) => sum + row[2], 0);
      const totalActivas = trendsData.reduce((sum, row) => sum + row[3], 0);
      const promedioMensual = Math.round(totalCompras / trendsData.length);
      
      dashboardData.push(['Total Períodos Analizados:', trendsData.length, '', '', '', '', '']);
      dashboardData.push(['Promedio Compras/Mes:', promedioMensual, '', '', '', '', '']);
      dashboardData.push(['Mejor Período:', trendsData.sort((a,b) => b[1] - a[1])[0][0], '', '', '', '', '']);
      
      const trendsWs = XLSX.utils.aoa_to_sheet(dashboardData);
      
      // Configurar anchos
      trendsWs['!cols'] = [
        { width: 20 }, // Período
        { width: 10 }, // Compras
        { width: 15 }, // Total
        { width: 12 }, // Activas
        { width: 12 }, // Inactivas
        { width: 12 }, // Tasa Actividad
        { width: 15 }  // Rendimiento
      ];
      
      // Combinar celdas para el título
      trendsWs['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 6 } }
      ];
      
      XLSX.utils.book_append_sheet(wb, trendsWs, 'Tendencias');
    }
    
    // ===== GUARDAR ARCHIVO CON NOMBRE DESCRIPTIVO =====
    const timestamp = new Date().toISOString().slice(0,16).replace(/[-:]/g, '').replace('T', '_');
    const fileName = `Compras_Reporte_Ejecutivo_${timestamp}.xlsx`;
    
    XLSX.writeFile(wb, fileName);
    
    hideLoadingIndicator();
    showSuccess(`Archivo Excel generado exitosamente: ${fileName}`);
    
  } catch (error) {
    hideLoadingIndicator();
    showError('Error al generar Excel: ' + error.message);
    console.error('Error completo:', error);
  }
}

// ===== MODAL DE FILTROS PARA EXPORTACIÓN MEJORADO =====
function showExportModal() {
  const modalHtml = `
    <div id="exportModal" class="custom-modal">
      <div class="custom-modal-content">
        <div class="custom-modal-header">
          <h3 style="margin: 0; font-family: 'Poppins', Arial, sans-serif; font-size: 24px; font-weight: 600;">Exportar compras</h3>
          <button class="modal-close" onclick="closeExportModal()">&times;</button>
        </div>
        
        <div class="custom-modal-body">
          <div class="export-filters">
            <div class="filters-grid">           
              <div class="field-group">
                <label for="exportProviderFilter">
                  Proveedor:
                </label>
                <select id="exportProviderFilter" class="field-element modern-select">
                  <option value="">Todos los proveedores</option>
                </select>
              </div>
            </div>
            
            <div class="filters-grid">
              <div class="field-group">
                <label for="exportDateFrom">
                 Fecha desde:
                </label>
                <input type="date" id="exportDateFrom" class="field-element modern-input">
              </div>
              
              <div class="field-group">
                <label for="exportDateTo">
                  Fecha hasta:
                </label>
                <input type="date" id="exportDateTo" class="field-element modern-input">
              </div>
              
              <div class="field-group">
                <label for="exportStatusFilter">
                  Estado:
                </label>
                <select id="exportStatusFilter" class="field-element modern-select">
                  <option value="">Todos los estados</option>
                  <option value="active">Activa</option>
                  <option value="inactive">Inactiva</option>
                </select>
              </div>
            </div>
          </div>
          
          <div class="export-preview">
            <h4>Vista Previa</h4>
            <p id="exportPreviewText">
              Seleccione los filtros para ver la cantidad de registros a exportar
            </p>
          </div>
        </div>
        
        <div class="custom-modal-footer">
          <div class="export-buttons">
            <button type="button" class="add-button cancel-button" onclick="closeExportModal()">
              Cancelar
            </button>
            <button type="button" class="add-button pdf-button" onclick="executeExport('pdf')">
              Exportar PDF
            </button>
            <button type="button" class="add-button excel-button" onclick="executeExport('excel')">
              Exportar Excel
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
  
  // Remover modal existente si existe
  const existingModal = document.getElementById('exportModal');
  if (existingModal) {
    existingModal.remove();
  }
  
  document.body.insertAdjacentHTML('beforeend', modalHtml);
  
  // Cargar proveedores en el select
  const providerSelect = document.getElementById('exportProviderFilter');
  if (providerSelect && providerIdToNameMap) {
    Object.entries(providerIdToNameMap).forEach(([id, name]) => {
      const option = document.createElement('option');
      option.value = id;
      option.textContent = name;
      providerSelect.appendChild(option);
    });
  }
  
  // Agregar event listeners para actualizar el preview
  const filterInputs = ['exportSearchTerm', 'exportDateFrom', 'exportDateTo', 'exportProviderFilter', 'exportStatusFilter'];
  filterInputs.forEach(inputId => {
    const input = document.getElementById(inputId);
    if (input) {
      input.addEventListener('change', updateExportPreview);
      input.addEventListener('keyup', updateExportPreview);
    }
  });
  
  document.getElementById('exportModal').style.display = 'flex';
  updateExportPreview();
}

function updateExportPreview() {
  const filters = getExportFilters();
  const filteredPurchases = getFilteredPurchasesData(
    filters.searchTerm,
    filters.dateFrom,
    filters.dateTo,
    filters.providerFilter,
    filters.statusFilter
  );
  
  const previewText = document.getElementById('exportPreviewText');
  if (previewText) {
    const total = filteredPurchases.reduce((sum, p) => sum + (p.total || 0), 0);
    const activeCount = filteredPurchases.filter(p => (p.status || p.estado || 'active') === 'active').length;
    const inactiveCount = filteredPurchases.filter(p => (p.status || p.estado || 'active') === 'inactive').length;
    
    previewText.innerHTML = `
      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; text-align: center;">
        <div>
          <div style="font-size: 24px; font-weight: bold;">${filteredPurchases.length}</div>
          <div style="font-size: 12px; opacity: 0.8;">Compras encontradas</div>
        </div>
        <div>
          <div style="font-size: 24px; font-weight: bold;">${formatCurrency(total)}</div>
          <div style="font-size: 12px; opacity: 0.8;">Total general</div>
        </div>
        <div>
          <div style="font-size: 20px; font-weight: bold;">${activeCount}</div>
          <div style="font-size: 12px; opacity: 0.8;">Compras activas</div>
        </div>
        <div>
          <div style="font-size: 20px; font-weight: bold;">${inactiveCount}</div>
          <div style="font-size: 12px; opacity: 0.8;">Compras inactivas</div>
        </div>
      </div>
    `;
  }
}

function getExportFilters() {
  return {
    searchTerm: document.getElementById('exportSearchTerm')?.value || '',
    dateFrom: document.getElementById('exportDateFrom')?.value || '',
    dateTo: document.getElementById('exportDateTo')?.value || '',
    providerFilter: document.getElementById('exportProviderFilter')?.value || '',
    statusFilter: document.getElementById('exportStatusFilter')?.value || ''
  };
}

function executeExport(type) {
  const filters = getExportFilters();
  
  if (type === 'pdf') {
    exportToPDF(filters);
  } else if (type === 'excel') {
    exportToExcel(filters);
  }
  
  closeExportModal();
}

function closeExportModal() {
  const modal = document.getElementById('exportModal');
  if (modal) {
    modal.style.display = 'none';
    modal.remove();
  }
}

// ===== FUNCIONES GLOBALES =====
window.showExportModal = showExportModal;
window.closeExportModal = closeExportModal;
window.executeExport = executeExport;
window.exportToPDF = exportToPDF;
window.exportToExcel = exportToExcel;

// Agregar estilos al documento
if (!document.getElementById('export-styles')) {
  const styleElement = document.createElement('div');
  styleElement.id = 'export-styles';
  styleElement.innerHTML = exportStyles;
  document.head.appendChild(styleElement);
}