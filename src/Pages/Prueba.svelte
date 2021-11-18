<script>


import {onMount} from 'svelte'


function saludar(){

    console.log("..")
}


const getSocketData = (event) => {

    let emptyEvent = {data: null}
    if (!event || !event.data) {
        return emptyEvent
    }

    const match = event.data.match(/\[.*]/)

    if (!match) {
        return emptyEvent
    }

    const data = JSON.parse(match)

    if (!Array.isArray(data) || !data[1]) {
        return emptyEvent
    }

    return {
        type: data[0],
        payload: data[1],
    }
}


onMount(()=>{


    const socket = new WebSocket('ws://localhost:1338/engine.io/?EIO=4&transport=websocket');

// Connection opened
socket.addEventListener('open', function (event) {
    console.log("It's open");
});

// Listen for messages
socket.addEventListener('message', function (event) {
    console.log(getSocketData(event))
});

// console.log(Object.getOwnPropertyNames(io.socket))
})
 
//  console.log(io.socket.isConnected())

//  io.socket.on('connect', function(){
//     console.log("connected!")
//  })
//     io.socket.on("message", function (msg) {
//   // ...
//   console.log("msg",msg)
// });


//     console.log("mount..")
// })
let logs = []
</script>
<container>
{JSON.stringify(logs)}

<input type="button" on:click={saludar} value="saludar" />

</container>