<script>
  	import Router from "svelte-spa-router";
  	import routes from "./routes";
	import { onMount } from "svelte";
	import socketIOClient from 'socket.io-client';
	import sailsIOClient from 'sails.io.js';

	// Instantiate the socket client (`io`)
	// (for now, you must explicitly pass in the socket.io client when using this library from Node.js)
	var io = sailsIOClient(socketIOClient);

	io.sails.url = `http://localhost:1337`;

	io.socket.get("/say/hello")

	onMount(()=>{
	})
</script>

<Router {routes} />

<style>

</style>

