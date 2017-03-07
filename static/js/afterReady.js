$(document).ready(function() {
            // Use a "/test" namespace.
            // An application can open a connection on multiple namespaces, and
            // Socket.IO will multiplex all those connections on a single
            // physical channel. If you don't care about multiple channels, you
            // can set the namespace to an empty string.
            namespace = '/redirect';

            // Connect to the Socket.IO server.
            // The connection URL has the following format:
            //     http[s]://<domain>:<port>[/<namespace>]
            var socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port + namespace);

            socket.on('redirect', function(d) {
                $('#output').append(d.msg.replace("\n","<br/>"));
            });

            socket.on("initial_config",function(d){
                JAC_CONFIG = d.config;
            })

            socket.on("taskFinished",function(d){
                $(".btn").removeClass("disabled")
            })

            $("#btn_stopRunning").click(function(e){
                socket.emit('stopRunning', {'taskID': GLOBAL_JAC_taskID})
            })

            $("#jac_config_save").on("click",function(e){
                var jsonToSave = $("#jac_config_testArea").val()
                var IS_JSON = true;
                try{
                       var json = $.parseJSON(jsonToSave);
                }catch(err){
                       IS_JSON = false;
                }
                if(!IS_JSON) alert("Invaild JSON format")
                else{
                    $.post("/post/config",{"config":jsonToSave},function(){
                        location.reload()
                    })
                }
            })
            $('#jac_configJson').popup({
                opacity: 0.3,
                transition: 'all 0.5s',
                onopen: function() {
                    $("#jac_config_testArea").val(JAC_CONFIG)
                }
            })
        });