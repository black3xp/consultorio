<script>
    import { link } from "svelte-spa-router";
    import active from 'svelte-spa-router/active';
  </script>
  
  <aside class="admin-sidebar">
    <div class="admin-sidebar-brand">
      <!-- begin sidebar branding-->
      <span class="admin-brand-content">
        <a href="/" use:link>xmedical</a>
      </span>
      <!-- end sidebar branding-->
      <div class="ml-auto">
        <!-- sidebar pin-->
        <a href="#!" class="admin-pin-sidebar btn-ghost btn btn-rounded-circle pinned">
          <!--  -->
        </a>
        <!-- sidebar close for mobile device-->
        <a href="#!" class="admin-close-sidebar">
          <!--  -->
        </a>
      </div>
    </div>
    <div class="admin-sidebar-wrapper js-scrollbar">
      <!-- Menu List Begins-->
      <ul class="menu">
        <!--list item begins-->
        <li use:active={{path: '/', className: 'active'}} class="menu-item">
          <a href="/" use:link class="menu-link">
            <span class="menu-label">
              <span class="menu-name">IR A INICIO</span>
            </span>
            <span class="menu-icon">
              <span class="icon-badge badge-success badge badge-pill">1</span>
              <i class="icon-placeholder mdi-24px mdi mdi-home"></i>
            </span>
          </a>
        </li>
        <!--list item ends-->

        <!--list item begins-->
        <li use:active={{path: '/pacientes/:idPaciente/historias/:idHistoria', className: 'active'}} class="menu-item">
            <a href="/pacientes/:idPaciente/historias/:idHistoria" use:link class="menu-link">
            <span class="menu-label">
                <span class="menu-name">Historia Clinica</span>
            </span>
            <span class="menu-icon">
                <i class="icon-placeholder mdi-24px mdi mdi-format-list-bulleted-type"></i>
            </span>
            </a>
        </li>
        <!--list item ends-->

      </ul>
      <!-- Menu List Ends-->
    </div>
  </aside>
  