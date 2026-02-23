import '../node_module/bootstrap/dist/js/bootstrap.bundle.min.js';
import '../node_module/bootstrap/dist/css/bootstrap.min.css';

import $ from "jquery";
window.$ = window.jQuery = $; // Para que funcione el plugin de datatables que requiere jQuery

import DataTable from "datatables.net-bs5";
import "datatables.net-responsive-bs5";
DataTable(window, $); // Inicializa DataTables con jQuery

// CSS de datatables
import "datatables.net-bs5/css/dataTables.bootstrap5.min.css";
import "datatables.net-responsive-bs5/css/responsive.bootstrap5.min.css";

