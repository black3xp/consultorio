<script>
    import { link } from "svelte-spa-router";
    import active from 'svelte-spa-router/active';

    import { user } from '../util/index';

  </script>
  
  <aside class="admin-sidebar">
    <div class="admin-sidebar-brand">
      <!-- begin sidebar branding-->
      <span class="admin-brand-content">
        <a href="/" use:link>xmedical pro</a>
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
              <span class="menu-name">Escritorio</span>
            </span>
            <span class="menu-icon">
              <span class="icon-badge badge-success badge badge-pill">1</span>
  
              <i class="icon-placeholder mdi mdi-link-variant " />
            </span>
          </a>
  
        </li>
        <!--list item ends-->
        <!--list item begins-->
        <li use:active={{path: '/pacientes', className: 'active'}} class="menu-item">
          <a href="/pacientes" use:link class="menu-link">
            <span class="menu-label">
              <span class="menu-name">Pacientes</span>
            </span>
            <span class="menu-icon">
              <!-- <span class="icon-badge badge-success badge badge-pill">1</span> -->
              <i class="icon-placeholder mdi mdi-account-circle-outline"></i>
            </span>
          </a>
        </li>
        <!--list item ends-->
        <!--list item begins-->
        {#if user().roles.includes('admin')}
        <li class="menu-item">
          <a href="#!" class="open-dropdown menu-link">
            <span class="menu-label">
              <span class="menu-name">
                Mantenimiento
                <span class="menu-arrow" />
              </span>
              <span class="menu-info">Ajustes consultorio</span>
            </span>
            <span class="menu-icon">
              <i class="icon-placeholder mdi mdi-link-variant " />
            </span>
          </a>
          <!--submenu-->
          <ul class="sub-menu">
            <li class="menu-item">
              <a href="/usuarios" use:link class=" menu-link">
                <span class="menu-label">
                  <span class="menu-name">Usuarios</span>
                </span>
                <span class="menu-icon">
                  <i class="icon-placeholder ">U</i>
                </span>
              </a>
  
            </li>
            <li class="menu-item">
              <a href="#!" class=" menu-link">
                <span class="menu-label">
                  <span class="menu-name">Empresa</span>
                </span>
                <span class="menu-icon">
                  <i class="icon-placeholder ">E</i>
                </span>
              </a>
  
            </li>
  
          </ul>
        </li>
        {/if}
      </ul>
      <!-- Menu List Ends-->
    </div>
  </aside>
  