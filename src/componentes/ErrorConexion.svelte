<script>
    export let msgError = '';
</script>
<div class="alert-container">
    <div class="alert alert-danger alert-dismissible fade show" role="alert">
        {msgError} <button
            type="button"
            class="close"
            data-dismiss="alert"
            aria-label="Close"
        >
            <span aria-hidden="true">×</span>
        </button>
    </div>
</div>
