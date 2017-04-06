GLOBAL_JAC_taskID = ''
GLOBAL_JAC_SLAVENUM = 0
GLOBAL_SCROLLDOWN = null

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

            socket.on("connect",function(){
                $('#connIcon').removeClass();
                $('#connIcon').addClass("glyphicon glyphicon-ok")
                $('#connIcon').empty()
                $('#connIcon').append(" Connected")
                socket.on('disconnect', function() {
                    $('#connIcon').removeClass();
                    $('#connIcon').addClass("glyphicon glyphicon-remove")
                    $('#connIcon').empty()
                    $('#connIcon').append(" Disconnected")
                });
                socket.on('connect_timeout', function() {
                    $('#output').append("<br/>Connection Timeout<br/>");
                });
            })

            socket.on('redirect', function(d) {
                $('#output').append(jQuery('<div />').text(d.msg).html().replace(/\n/g,"<br/>"));
                GLOBAL_SCROLLDOWN()
                // socket.emit("ack")
            });

            socket.on('reconnect_attempt', function(){
                $('#output').append("... ")
            });

            socket.on("initial_config",function(d){
                JAC_CONFIG = d.config;
            })

            socket.on("taskFinished",function(d){
                $(".btn").removeClass("disabled")
                $("#btn_stopRunning").removeClass("btn-danger").addClass("btn-default disabled")
            })

            socket.on("upload_done", function(data){
                data = JSON.parse(data)
                // This.refs.taskInfo.setState({"fileStatus":filesList.length+" file(s) uploaded"})
                $("#jac_JMXName").empty()
                $.each(data["jmxList"],function(i,d){
                    $("#jac_JMXName").append("<option value=\""+d+"\">"+d+"</option>")
                })
                alert("succeed");
            })

            // run task button
            $("#btn_runTask").click(function(e){
                var jmx_to_run = $("#jac_JMXName").val()
                if(GLOBAL_JAC_SLAVENUM<1){
                    alert("No slave running!")
                }
                else if(jmx_to_run==null || !jmx_to_run.match(/^[\s\S]*\.jmx$/)){
                    alert("Invaild JMX file, please upload and select jmx file");
                }else{
                    $(".btn").addClass("disabled")
                    $("#btn_clear").removeClass("disabled");
                    $("#btn_stopRunning").removeClass("btn-default disabled").addClass("btn-danger")
                    socket.emit('startRunning', {"jmx_name":jmx_to_run,"taskID":GLOBAL_JAC_taskID})

                }
            })
        });