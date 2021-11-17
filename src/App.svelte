<script>
  	import Router from "svelte-spa-router";
  	import routes from "./routes";
	import { onMount } from "svelte";

	const event = (e) => {
		jQuery("body").removeClass('sidebar-open')
	}

	onMount(()=>{
	})
</script>

<Router on:routeLoaded={event} {routes} />

<style>

</style>

